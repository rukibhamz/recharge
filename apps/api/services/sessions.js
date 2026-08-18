import { randomBytes, randomUUID } from 'crypto';
import { formatMbtiType } from '@recharge/shared/mbtiScoring';
import { normalizeRecommendationsList } from '@recharge/shared/recommendations';
import {
  packRecommendationsPayload,
  unpackRecommendationsPayload,
  teaseRecoveryRoadmap,
  buildRecoveryRoadmap,
} from '@recharge/shared/recoveryRoadmap';
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

function sanitizeRecommendationsForDb(recommendations, recoveryRoadmap = null) {
  if (recoveryRoadmap) {
    return packRecommendationsPayload(recommendations, recoveryRoadmap);
  }
  const unpacked = unpackRecommendationsPayload(recommendations);
  if (unpacked.recoveryRoadmap) {
    return packRecommendationsPayload(unpacked.recommendations, unpacked.recoveryRoadmap);
  }
  return normalizeRecommendationsList(recommendations, []);
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
  if (row.personality_snapshot && typeof row.personality_snapshot === 'object') {
    return row.personality_snapshot;
  }

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

export async function buildSessionResponse(row, { includeFullRoadmap = true } = {}) {
  const personality = await buildPersonalityFromRow(row);
  const unpacked = unpackRecommendationsPayload(row.recommendations ?? []);
  let recoveryRoadmap = unpacked.recoveryRoadmap;
  if (!recoveryRoadmap && includeFullRoadmap) {
    recoveryRoadmap = buildRecoveryRoadmap({
      burnout: {
        pct: row.burnout_pct,
        level: row.burnout_level,
        cls: row.burnout_cls,
      },
      personality,
      psychometricProfile: personality?.psychometricProfile,
      recoveryPreferences: row.demographics?.recoveryPreferences,
    });
  } else if (recoveryRoadmap && !includeFullRoadmap) {
    recoveryRoadmap = teaseRecoveryRoadmap(recoveryRoadmap);
  }
  return {
    sessionId: row.id,
    shareToken: row.share_token,
    displayName: row.display_name,
    createdAt: row.created_at,
    burnout: {
      pct: row.burnout_pct,
      level: row.burnout_level,
      cls: row.burnout_cls,
      summary: row.burnout_summary ?? null,
    },
    personality,
    recommendations: unpacked.recommendations,
    recoveryRoadmap,
    roadmapLocked: Boolean(recoveryRoadmap?.guestPreview),
  };
}

async function findRecentDuplicateSession({ userId, displayName, burnoutPct, personalityType }) {
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  if (userId) {
    const { data: links, error: linkError } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(8);
    if (!linkError && links?.length) {
      const { data } = await supabase
        .from('sessions')
        .select('id, share_token')
        .in(
          'id',
          links.map((row) => row.session_id),
        )
        .eq('burnout_pct', burnoutPct)
        .eq('personality_type', personalityType)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]) return data[0];
    }
  }

  const name = String(displayName ?? '').trim();
  if (!name) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select('id, share_token')
    .eq('display_name', name)
    .eq('burnout_pct', burnoutPct)
    .eq('personality_type', personalityType)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return null;
  return data?.[0] ?? null;
}

export async function saveSession({
  displayName,
  demographics,
  burnout,
  personality,
  recommendations,
  recoveryRoadmap = null,
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
  const recommendationsRow = sanitizeRecommendationsForDb(recommendations, recoveryRoadmap);

  const duplicate = await findRecentDuplicateSession({
    userId,
    displayName,
    burnoutPct: burnoutRow.pct,
    personalityType: personalityRow.typeCode,
  });
  if (duplicate) {
    let linked = false;
    if (userId) {
      const linkResult = await linkSessionToUser(userId, duplicate.id, email);
      linked = linkResult.linked;
    }
    return {
      sessionId: duplicate.id,
      shareToken: duplicate.share_token,
      persisted: true,
      linked,
      persistError: null,
      reused: true,
    };
  }

  const baseRow = {
    id: sessionId,
    share_token: shareToken,
    display_name: displayName ?? null,
    burnout_pct: burnoutRow.pct,
    burnout_level: burnoutRow.level,
    burnout_cls: burnoutRow.cls,
    burnout_summary: burnout?.summary ? String(burnout.summary).slice(0, 4000) : null,
    personality_type: personalityRow.typeCode,
    personality_name: personalityRow.name,
    personality_snapshot: personality ?? null,
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

  if (error && /personality_snapshot|burnout_summary/i.test(error.message)) {
    console.warn(
      'Session snapshot columns missing — saving without rich copy. Run migration 008_session_snapshots.sql',
    );
    const slim = { ...baseRow };
    delete slim.personality_snapshot;
    delete slim.burnout_summary;
    ({ error } = await supabase.from('sessions').insert(
      demographics != null ? { ...slim, demographics } : slim,
    ));
    if (error && /demographics/i.test(error.message)) {
      ({ error } = await supabase.from('sessions').insert(slim));
    }
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

const SHARE_LINK_TTL_HOURS = 24;

export async function getSessionByShareToken(shareToken) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const cutoff = new Date(Date.now() - SHARE_LINK_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, share_token, display_name, burnout_pct, burnout_level, burnout_cls, burnout_summary, personality_type, personality_name, personality_snapshot, traits, recommendations, created_at',
    )
    .eq('share_token', shareToken)
    .gte('created_at', cutoff)
    .maybeSingle();

  return { data, error };
}

export async function getSharedSessionResponse(shareToken) {
  const { data, error } = await getSessionByShareToken(shareToken);
  if (error) return { data: null, error };
  if (!data) return { data: null, error: null };
  const response = await buildSessionResponse(data, { includeFullRoadmap: false });
  return { data: response, error: null };
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
        burnout_summary,
        personality_type,
        personality_name,
        personality_snapshot,
        traits,
        recommendations,
        created_at
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fall back if optional snapshot columns missing from older DBs
  let rows;
  if (error) {
    if (/burnout_summary|personality_snapshot|column/i.test(error.message || '')) {
      const light = await supabase
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
            traits,
            recommendations,
            created_at
          )
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (light.error) return { data: [], error: light.error };
      rows = (light.data ?? []).map((row) => row.sessions).filter(Boolean);
    } else {
      return { data: [], error };
    }
  } else {
    rows = (data ?? []).map((row) => row.sessions).filter(Boolean);
  }

  const items = await Promise.all(rows.map((s) => buildSessionResponse(s)));

  return { data: items, error: null };
}

/** Latest saved personality type code for a user (for retake stability). */
export async function getLatestPersonalityTypeForUser(userId) {
  if (!isSupabaseConfigured() || !userId) {
    return { typeCode: null, error: null };
  }

  const { data, error } = await supabase
    .from('user_sessions')
    .select(
      `
      created_at,
      sessions (
        personality_type
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return { typeCode: null, error };

  const typeCode = data?.[0]?.sessions?.personality_type ?? null;
  return {
    typeCode: typeCode ? String(typeCode).toUpperCase() : null,
    error: null,
  };
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
      'id, share_token, display_name, burnout_pct, burnout_level, burnout_cls, burnout_summary, personality_type, personality_name, personality_snapshot, traits, recommendations, created_at',
    )
    .eq('id', sessionId)
    .maybeSingle();

  if (error) return { data: null, error };
  if (!data) return { data: null, error: new Error('Session not found') };

  const response = await buildSessionResponse(data);
  return { data: response, error: null };
}
