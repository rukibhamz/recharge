import { randomBytes, randomUUID } from 'crypto';
import { formatMbtiType } from '@recharge/shared/mbtiScoring';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getMbtiTypeProfile } from './questionBank.js';

function makeShareToken() {
  return randomBytes(16).toString('hex');
}

function safePct(value, fallback = 50) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

const BURNOUT_CLS = new Set(['healthy', 'mild', 'moderate', 'severe']);

function clsFromPct(pct) {
  if (pct >= 70) return 'severe';
  if (pct >= 45) return 'moderate';
  if (pct >= 25) return 'mild';
  return 'healthy';
}

const BURNOUT_LEVEL_LABELS = {
  healthy: 'Healthy Range',
  mild: 'Mild Burnout',
  moderate: 'Moderate Burnout',
  severe: 'Severe Burnout',
};

function sanitizeBurnoutForDb(burnout) {
  const pct = safePct(burnout?.pct);
  let cls = String(burnout?.cls ?? '').toLowerCase();
  if (!BURNOUT_CLS.has(cls)) cls = clsFromPct(pct);
  const level = burnout?.level || BURNOUT_LEVEL_LABELS[cls];
  return { pct, cls, level };
}

function sanitizePersonalityForDb(personality) {
  const typeCode = String(
    personality?.typeCode ?? personality?.type?.code ?? personality?.type?.id ?? 'UNKNOWN',
  )
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 16) || 'UNKNOWN';
  const name = String(
    personality?.type?.name ?? personality?.typeCode ?? typeCode ?? 'Unknown',
  ).slice(0, 120) || 'Unknown';
  const traits = Array.isArray(personality?.traits) ? personality.traits : [];
  return { typeCode, name, traits };
}

function sanitizeRecommendationsForDb(recommendations) {
  return Array.isArray(recommendations) ? recommendations : [];
}

export async function ensureProfile(userId, email) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, email: email ?? null },
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function linkSessionToUser(userId, sessionId, email) {
  if (!isSupabaseConfigured()) {
    return { linked: false, error: new Error('Database not configured') };
  }

  await ensureProfile(userId, email);

  const { data: session, error: findErr } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .maybeSingle();

  if (findErr) return { linked: false, error: findErr };
  if (!session) return { linked: false, error: new Error('Session not found') };

  const { error } = await supabase.from('user_sessions').insert({
    user_id: userId,
    session_id: sessionId,
  });

  if (error) {
    if (error.code === '23505') return { linked: true, alreadyLinked: true };
    return { linked: false, error };
  }

  return { linked: true, alreadyLinked: false };
}

async function buildPersonalityFromRow(row) {
  const typeCode = String(row.personality_type ?? '').toUpperCase();
  let type = {
    id: row.personality_type,
    name: row.personality_name,
    desc: '',
    icon: '✨',
  };

  if (typeCode) {
    try {
      const profile = await getMbtiTypeProfile(typeCode);
      if (profile) type = formatMbtiType(profile);
    } catch {
      /* use stored name */
    }
  }

  return {
    typeCode,
    type,
    traits: row.traits ?? [],
  };
}

export async function buildSessionResponse(row) {
  const personality = await buildPersonalityFromRow(row);
  return {
    sessionId: row.id,
    shareToken: row.share_token,
    displayName: row.display_name,
    createdAt: row.created_at,
    burnout: {
      pct: row.burnout_pct,
      level: row.burnout_level,
      cls: row.burnout_cls,
    },
    personality,
    recommendations: row.recommendations ?? [],
  };
}

export async function saveSession({
  displayName,
  demographics,
  burnout,
  personality,
  recommendations,
  userId,
  email,
}) {
  const sessionId = randomUUID();
  const shareToken = makeShareToken();

  if (!isSupabaseConfigured()) {
    return { sessionId, shareToken, persisted: false, linked: false, persistError: 'Database not configured' };
  }

  const burnoutRow = sanitizeBurnoutForDb(burnout);
  const personalityRow = sanitizePersonalityForDb(personality);
  const recommendationsRow = sanitizeRecommendationsForDb(recommendations);

  const baseRow = {
    id: sessionId,
    share_token: shareToken,
    display_name: displayName ?? null,
    burnout_pct: burnoutRow.pct,
    burnout_level: burnoutRow.level,
    burnout_cls: burnoutRow.cls,
    personality_type: personalityRow.typeCode,
    personality_name: personalityRow.name,
    traits: personalityRow.traits,
    recommendations: recommendationsRow,
  };

  let row = { ...baseRow, demographics: demographics ?? null };
  let { error } = await supabase.from('sessions').insert(row);

  if (error && /demographics/i.test(error.message)) {
    console.warn(
      'Sessions demographics column missing — saving without demographics. Run migration 007_session_demographics.sql',
    );
    ({ error } = await supabase.from('sessions').insert(baseRow));
  }

  if (error) {
    console.error('Supabase insert error:', error.message, { code: error.code, details: error.details });
    return {
      sessionId,
      shareToken,
      persisted: false,
      linked: false,
      persistError: error.message,
    };
  }

  let linked = false;
  if (userId) {
    const linkResult = await linkSessionToUser(userId, sessionId, email);
    linked = linkResult.linked;
  }

  return { sessionId, shareToken, persisted: true, linked, persistError: null };
}

export async function getSessionByShareToken(shareToken) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { data, error } = await supabase
    .from('sessions')
    .select(
      'burnout_level, burnout_cls, personality_type, personality_name, traits, recommendations, created_at',
    )
    .eq('share_token', shareToken)
    .maybeSingle();

  return { data, error };
}

export async function getSessionsForUser(userId) {
  if (!isSupabaseConfigured()) {
    return { data: [], error: new Error('Database not configured') };
  }

  const { data, error } = await supabase
    .from('user_sessions')
    .select(
      `
      created_at,
      sessions (
        id,
        share_token,
        display_name,
        burnout_pct,
        burnout_level,
        burnout_cls,
        personality_type,
        personality_name,
        created_at
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };

  const items = (data ?? [])
    .map((row) => row.sessions)
    .filter(Boolean)
    .map((s) => ({
      sessionId: s.id,
      shareToken: s.share_token,
      displayName: s.display_name,
      burnout: {
        pct: s.burnout_pct,
        level: s.burnout_level,
        cls: s.burnout_cls,
      },
      personality: {
        type: { id: s.personality_type, name: s.personality_name },
      },
      createdAt: s.created_at,
    }));

  return { data: items, error: null };
}

export async function getSessionForUser(userId, sessionId) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { data: link, error: linkErr } = await supabase
    .from('user_sessions')
    .select('session_id')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (linkErr) return { data: null, error: linkErr };
  if (!link) return { data: null, error: new Error('Session not found') };

  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, share_token, display_name, burnout_pct, burnout_level, burnout_cls, personality_type, personality_name, traits, recommendations, created_at',
    )
    .eq('id', sessionId)
    .maybeSingle();

  if (error) return { data: null, error };
  if (!data) return { data: null, error: new Error('Session not found') };

  const response = await buildSessionResponse(data);
  return { data: response, error: null };
}
