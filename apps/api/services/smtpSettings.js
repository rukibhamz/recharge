import { validateSmtpSettingsPayload } from '@recharge/shared/emailMarketing';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const DEFAULT_SMTP = Object.freeze({
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'Recharge',
  fromEmail: 'recharge@thedigitalerrand.com',
});

let cache = { at: 0, value: null };
const CACHE_MS = 10_000;

function fromEnv() {
  const host = String(process.env.SMTP_HOST ?? '').trim();
  if (!host) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
    user: String(process.env.SMTP_USER ?? '').trim(),
    pass: String(process.env.SMTP_PASS ?? ''),
    fromName: String(process.env.SMTP_FROM_NAME ?? 'Recharge').trim() || 'Recharge',
    fromEmail:
      String(process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_FROM ?? '').trim() ||
      DEFAULT_SMTP.fromEmail,
  };
}

function normalizeStored(raw) {
  return {
    host: String(raw?.host ?? '').trim(),
    port: Number(raw?.port) || 587,
    secure: Boolean(raw?.secure),
    user: String(raw?.user ?? '').trim(),
    pass: String(raw?.pass ?? ''),
    fromName: String(raw?.fromName ?? DEFAULT_SMTP.fromName).trim() || DEFAULT_SMTP.fromName,
    fromEmail: String(raw?.fromEmail ?? DEFAULT_SMTP.fromEmail).trim() || DEFAULT_SMTP.fromEmail,
  };
}

export function clearSmtpSettingsCache() {
  cache = { at: 0, value: null };
}

/** Public-safe view: never include the password. */
export function redactSmtpSettings(settings) {
  if (!settings) {
    return {
      configured: false,
      host: '',
      port: 587,
      secure: false,
      user: '',
      fromName: DEFAULT_SMTP.fromName,
      fromEmail: DEFAULT_SMTP.fromEmail,
      hasPassword: false,
      source: 'none',
    };
  }
  return {
    configured: Boolean(settings.host),
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    user: settings.user,
    fromName: settings.fromName,
    fromEmail: settings.fromEmail,
    hasPassword: Boolean(settings.pass),
    source: settings.source || 'app',
  };
}

async function loadFromDb() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'smtp')
    .maybeSingle();

  if (error) {
    if (/app_settings/i.test(error.message) || error.code === '42P01') return null;
    throw error;
  }
  if (!data?.value) return null;
  const normalized = normalizeStored(data.value);
  return normalized.host ? normalized : null;
}

/**
 * Resolve SMTP credentials: admin DB settings first, then env fallback.
 */
export async function getSmtpSettings({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.value && now - cache.at < CACHE_MS) return cache.value;

  let value = null;
  let source = 'none';

  try {
    const fromDb = await loadFromDb();
    if (fromDb?.host) {
      value = { ...fromDb, source: 'app' };
      source = 'app';
    }
  } catch (err) {
    console.warn('SMTP settings load failed:', err.message);
  }

  if (!value) {
    const env = fromEnv();
    if (env?.host) {
      value = { ...env, source: 'env' };
      source = 'env';
    }
  }

  if (!value) {
    value = { ...DEFAULT_SMTP, source };
  } else {
    value.source = source;
  }

  cache = { at: now, value };
  return value;
}

export async function updateSmtpSettings(input) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  const existing = (await loadFromDb()) || fromEnv() || DEFAULT_SMTP;
  const merged = {
    ...existing,
    ...input,
    pass:
      input.pass === undefined || input.pass === null || String(input.pass).trim() === ''
        ? existing.pass
        : String(input.pass),
  };

  const check = validateSmtpSettingsPayload(merged, { requirePass: !merged.pass });
  if (!check.ok) throw new Error(check.error);

  const next = check.value;
  const { data, error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: 'smtp',
        value: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    .select('value')
    .single();

  if (error) throw error;

  const saved = { ...normalizeStored(data?.value ?? next), source: 'app' };
  cache = { at: Date.now(), value: saved };
  return saved;
}
