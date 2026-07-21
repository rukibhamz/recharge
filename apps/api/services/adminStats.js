import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

function daysAgoIso(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countExact(query) {
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function tally(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAdminStats() {
  if (!isSupabaseConfigured()) {
    throw new Error('Database not configured');
  }

  const since7 = daysAgoIso(7);
  const since30 = daysAgoIso(30);

  const [
    signupsTotal,
    signups7d,
    signups30d,
    assessmentsTotal,
    assessments7d,
    assessments30d,
    linkedTotal,
  ] = await Promise.all([
    countExact(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    countExact(
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since7),
    ),
    countExact(
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since30),
    ),
    countExact(supabase.from('sessions').select('id', { count: 'exact', head: true })),
    countExact(
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since7),
    ),
    countExact(
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since30),
    ),
    countExact(supabase.from('user_sessions').select('session_id', { count: 'exact', head: true })),
  ]);

  const { data: recentSessions, error: sessionsErr } = await supabase
    .from('sessions')
    .select(
      'id, created_at, display_name, burnout_cls, burnout_level, burnout_pct, personality_type, personality_name',
    )
    .order('created_at', { ascending: false })
    .limit(400);

  if (sessionsErr) throw sessionsErr;

  const sessionRows = recentSessions ?? [];
  const burnoutDistribution = {
    healthy: 0,
    mild: 0,
    moderate: 0,
    severe: 0,
  };
  for (const row of sessionRows) {
    const cls = String(row.burnout_cls ?? '').toLowerCase();
    if (Object.hasOwn(burnoutDistribution, cls)) {
      burnoutDistribution[cls] += 1;
    }
  }

  const personalityTop = tally(sessionRows, (r) =>
    String(r.personality_type ?? '')
      .toUpperCase()
      .slice(0, 4),
  ).slice(0, 8);

  const { data: recentProfiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  if (profilesErr) throw profilesErr;

  const guestAssessments = Math.max(0, assessmentsTotal - linkedTotal);

  return {
    generatedAt: new Date().toISOString(),
    signups: {
      total: signupsTotal,
      last7Days: signups7d,
      last30Days: signups30d,
    },
    assessments: {
      total: assessmentsTotal,
      last7Days: assessments7d,
      last30Days: assessments30d,
      linkedToAccount: linkedTotal,
      guestOrUnlinked: guestAssessments,
    },
    burnoutDistribution,
    personalityTop,
    recentSignups: (recentProfiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      createdAt: p.created_at,
    })),
    recentAssessments: sessionRows.slice(0, 15).map((s) => ({
      id: s.id,
      displayName: s.display_name,
      burnoutCls: s.burnout_cls,
      burnoutLevel: s.burnout_level,
      burnoutPct: s.burnout_pct,
      personalityType: s.personality_type,
      personalityName: s.personality_name,
      createdAt: s.created_at,
    })),
    sampleNote:
      sessionRows.length >= 400
        ? 'Burnout and personality charts use the 400 most recent assessments.'
        : null,
  };
}
