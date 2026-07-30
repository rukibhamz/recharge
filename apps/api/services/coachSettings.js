import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const DEFAULT_COACH_SETTINGS = Object.freeze({
  name: 'Oma',
  connectorId: null,
});

let cache = { at: 0, value: DEFAULT_COACH_SETTINGS };
const CACHE_MS = 15_000;

function normalizeCoachSettings(raw) {
  const name = String(raw?.name ?? DEFAULT_COACH_SETTINGS.name).trim().slice(0, 40);
  const connectorIdRaw = raw?.connectorId;
  const connectorId =
    typeof connectorIdRaw === 'string' && /^[0-9a-f-]{36}$/i.test(connectorIdRaw)
      ? connectorIdRaw
      : null;

  return {
    name: name || DEFAULT_COACH_SETTINGS.name,
    connectorId,
  };
}

export function clearCoachSettingsCache() {
  cache = { at: 0, value: DEFAULT_COACH_SETTINGS };
}

export async function getCoachSettings() {
  if (!isSupabaseConfigured()) return DEFAULT_COACH_SETTINGS;

  const now = Date.now();
  if (now - cache.at < CACHE_MS) return cache.value;

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'coach')
    .maybeSingle();

  if (error) {
    if (/app_settings/i.test(error.message) || error.code === '42P01') {
      cache = { at: now, value: DEFAULT_COACH_SETTINGS };
      return DEFAULT_COACH_SETTINGS;
    }
    throw error;
  }

  const value = normalizeCoachSettings(data?.value ?? {});
  cache = { at: now, value };
  return value;
}

export async function updateCoachSettings(input) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  const next = normalizeCoachSettings(input);
  const { data, error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: 'coach',
        value: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    .select('value')
    .single();

  if (error) throw error;

  const saved = normalizeCoachSettings(data?.value ?? next);
  cache = { at: Date.now(), value: saved };
  return saved;
}
