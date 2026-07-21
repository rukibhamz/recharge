import {
  isValidProvider,
  maskApiKey,
  providerMeta,
} from '@recharge/shared/llmConnectors';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { geminiApiKey } from '../config/gemini.js';
import { ollamaBaseUrl, ollamaModel } from '../config/llm.js';

const SELECT =
  'id, name, provider, model, base_url, api_key, enabled, priority, notes, created_at, updated_at';

let cache = { at: 0, rows: null };
const CACHE_MS = 30_000;

export function clearConnectorCache() {
  cache = { at: 0, rows: null };
}

function mapPublic(row) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    model: row.model,
    baseUrl: row.base_url || null,
    apiKeyMasked: maskApiKey(row.api_key),
    hasApiKey: Boolean(row.api_key),
    enabled: Boolean(row.enabled),
    priority: row.priority ?? 100,
    notes: row.notes || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRuntime(row) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    model: row.model,
    baseUrl: row.base_url || null,
    apiKey: row.api_key || null,
    enabled: Boolean(row.enabled),
    priority: row.priority ?? 100,
  };
}

export async function listConnectors() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('llm_connectors')
    .select(SELECT)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    if (/llm_connectors/i.test(error.message) || error.code === '42P01') {
      return [];
    }
    throw error;
  }
  return (data ?? []).map(mapPublic);
}

async function loadEnabledRows() {
  if (!isSupabaseConfigured()) return [];
  const now = Date.now();
  if (cache.rows && now - cache.at < CACHE_MS) return cache.rows;

  const { data, error } = await supabase
    .from('llm_connectors')
    .select(SELECT)
    .eq('enabled', true)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (/llm_connectors/i.test(error.message) || error.code === '42P01') {
      cache = { at: now, rows: [] };
      return [];
    }
    throw error;
  }

  cache = { at: now, rows: data ?? [] };
  return cache.rows;
}

/** Runtime chain: DB connectors first; if none, fall back to env Gemini/Ollama. */
export async function getRuntimeConnectors() {
  try {
    const rows = await loadEnabledRows();
    if (rows.length) return rows.map(mapRuntime);
  } catch (err) {
    console.warn('[connectors] load failed, using env fallback:', err.message);
  }

  const fallback = [];
  if (geminiApiKey()) {
    fallback.push({
      id: 'env-gemini',
      name: 'Env Gemini',
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      baseUrl: null,
      apiKey: geminiApiKey(),
      enabled: true,
      priority: 10,
    });
  }
  if (ollamaBaseUrl() && ollamaModel()) {
    fallback.push({
      id: 'env-ollama',
      name: 'Env Ollama',
      provider: 'ollama',
      model: ollamaModel(),
      baseUrl: ollamaBaseUrl(),
      apiKey: null,
      enabled: true,
      priority: 20,
    });
  }
  return fallback;
}

export async function createConnector(input) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');
  const provider = String(input?.provider ?? '').toLowerCase();
  if (!isValidProvider(provider)) throw new Error('Invalid provider.');

  const meta = providerMeta(provider);
  const name = String(input?.name ?? meta.label).trim().slice(0, 80) || meta.label;
  const model = String(input?.model ?? meta.defaultModel).trim().slice(0, 120);
  if (!model) throw new Error('Model is required.');

  let baseUrl = input?.baseUrl != null ? String(input.baseUrl).trim().replace(/\/$/, '') : '';
  if (!baseUrl && meta.defaultBaseUrl) baseUrl = meta.defaultBaseUrl;
  if (meta.needsBaseUrl && !baseUrl) throw new Error('Base URL is required for this provider.');

  const apiKey = input?.apiKey != null ? String(input.apiKey).trim() : '';
  if (meta.needsApiKey && !apiKey) throw new Error('API key is required for this provider.');

  const row = {
    name,
    provider,
    model,
    base_url: baseUrl || null,
    api_key: apiKey || null,
    enabled: input?.enabled !== false,
    priority: Number.isFinite(Number(input?.priority)) ? Number(input.priority) : 100,
    notes: input?.notes ? String(input.notes).trim().slice(0, 500) : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('llm_connectors').insert(row).select(SELECT).single();
  if (error) throw error;
  clearConnectorCache();
  return mapPublic(data);
}

export async function updateConnector(id, input) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  const { data: existing, error: findErr } = await supabase
    .from('llm_connectors')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) throw new Error('Connector not found.');

  const patch = { updated_at: new Date().toISOString() };

  if (input?.name != null) {
    const name = String(input.name).trim().slice(0, 80);
    if (!name) throw new Error('Name is required.');
    patch.name = name;
  }
  if (input?.provider != null) {
    const provider = String(input.provider).toLowerCase();
    if (!isValidProvider(provider)) throw new Error('Invalid provider.');
    patch.provider = provider;
  }
  if (input?.model != null) {
    const model = String(input.model).trim().slice(0, 120);
    if (!model) throw new Error('Model is required.');
    patch.model = model;
  }
  if (input?.baseUrl !== undefined) {
    const baseUrl = String(input.baseUrl ?? '')
      .trim()
      .replace(/\/$/, '');
    patch.base_url = baseUrl || null;
  }
  if (input?.apiKey !== undefined) {
    const apiKey = String(input.apiKey ?? '').trim();
    // Empty string means "keep existing"; sentinel CLEAR clears
    if (apiKey === 'CLEAR') patch.api_key = null;
    else if (apiKey) patch.api_key = apiKey;
  }
  if (input?.enabled != null) patch.enabled = Boolean(input.enabled);
  if (input?.priority != null && Number.isFinite(Number(input.priority))) {
    patch.priority = Number(input.priority);
  }
  if (input?.notes !== undefined) {
    patch.notes = input.notes ? String(input.notes).trim().slice(0, 500) : null;
  }

  const provider = patch.provider || existing.provider;
  const meta = providerMeta(provider);
  const finalKey = patch.api_key !== undefined ? patch.api_key : existing.api_key;
  const finalBase = patch.base_url !== undefined ? patch.base_url : existing.base_url;
  if (meta?.needsApiKey && !finalKey) throw new Error('API key is required for this provider.');
  if (meta?.needsBaseUrl && !finalBase) throw new Error('Base URL is required for this provider.');

  const { data, error } = await supabase
    .from('llm_connectors')
    .update(patch)
    .eq('id', id)
    .select(SELECT)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Connector not found.');
  clearConnectorCache();
  return mapPublic(data);
}

export async function deleteConnector(id) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');
  const { error } = await supabase.from('llm_connectors').delete().eq('id', id);
  if (error) throw error;
  clearConnectorCache();
  return { deleted: true };
}

export async function getConnectorSecret(id) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('llm_connectors')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRuntime(data) : null;
}
