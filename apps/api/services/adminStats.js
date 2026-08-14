import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { listWorkspaces } from './workspaces.js';
import { countNewFeedback } from './feedback.js';

function daysAgoIso(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function dayKey(iso) {
  return String(iso).slice(0, 10);
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

function pctChange(current, previous) {
  if (previous == null || previous === 0) {
    if (current > 0) return 100;
    return 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function burnoutRiskLabel(avg) {
  if (avg == null) return 'No data';
  if (avg < 25) return 'Healthy range';
  if (avg < 45) return 'Mild risk';
  if (avg < 70) return 'Moderate risk';
  return 'Elevated risk';
}

function buildVolumeSeries(sessionRows, linkedSet, days = 14) {
  const buckets = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    buckets.push({ date: key, completed: 0, linked: 0 });
  }
  const byDate = new Map(buckets.map((b) => [b.date, b]));

  for (const row of sessionRows) {
    const key = dayKey(row.created_at);
    const bucket = byDate.get(key);
    if (!bucket) continue;
    bucket.completed += 1;
    if (linkedSet.has(row.id)) bucket.linked += 1;
  }

  return buckets.map((b, index) => {
    const label =
      index === buckets.length - 1
        ? 'Today'
        : new Date(`${b.date}T12:00:00Z`).toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          });
    return {
      date: b.date,
      label,
      completed: b.completed,
      // Approximation: sessions without account link still count as completed runs
      started: b.completed,
      linked: b.linked,
    };
  });
}

export async function getAdminStats() {
  if (!isSupabaseConfigured()) {
    throw new Error('Database not configured');
  }

  const since7 = daysAgoIso(7);
  const since14 = daysAgoIso(14);
  const since30 = daysAgoIso(30);
  const since24h = hoursAgoIso(24);
  const prev7Start = daysAgoIso(14);
  const prev7End = since7;

  let databaseOk = true;
  try {
    const { error } = await supabase.from('sessions').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) databaseOk = false;
  } catch {
    databaseOk = false;
  }

  const [
    signupsTotal,
    signups7d,
    signupsPrev7d,
    signups30d,
    signups24h,
    assessmentsTotal,
    assessments7d,
    assessmentsPrev7d,
    assessments30d,
    assessments24h,
    linkedTotal,
    linked7d,
  ] = await Promise.all([
    countExact(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    countExact(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since7),
    ),
    countExact(
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', prev7Start)
        .lt('created_at', prev7End),
    ),
    countExact(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since30),
    ),
    countExact(
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    ),
    countExact(supabase.from('sessions').select('id', { count: 'exact', head: true })),
    countExact(
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('created_at', since7),
    ),
    countExact(
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', prev7Start)
        .lt('created_at', prev7End),
    ),
    countExact(
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('created_at', since30),
    ),
    countExact(
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    ),
    countExact(supabase.from('user_sessions').select('session_id', { count: 'exact', head: true })),
    countExact(
      supabase
        .from('user_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('created_at', since7),
    ),
  ]);

  const { data: recentSessions, error: sessionsErr } = await supabase
    .from('sessions')
    .select(
      'id, created_at, display_name, burnout_cls, burnout_level, burnout_pct, personality_type, personality_name',
    )
    .gte('created_at', since30)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (sessionsErr) throw sessionsErr;

  const sessionRows = recentSessions ?? [];

  const sessionIds = sessionRows.map((s) => s.id);
  let linkedSet = new Set();
  if (sessionIds.length) {
    const { data: links, error: linksErr } = await supabase
      .from('user_sessions')
      .select('session_id')
      .in('session_id', sessionIds.slice(0, 500));
    if (!linksErr) {
      linkedSet = new Set((links ?? []).map((l) => l.session_id));
    }
  }

  const burnoutDistribution = {
    healthy: 0,
    mild: 0,
    moderate: 0,
    severe: 0,
  };
  let burnoutSum = 0;
  let burnoutCount = 0;
  for (const row of sessionRows) {
    const cls = String(row.burnout_cls ?? '').toLowerCase();
    if (Object.hasOwn(burnoutDistribution, cls)) {
      burnoutDistribution[cls] += 1;
    }
    const pct = Number(row.burnout_pct);
    if (Number.isFinite(pct)) {
      burnoutSum += pct;
      burnoutCount += 1;
    }
  }

  const avgBurnoutPct =
    burnoutCount > 0 ? Math.round((burnoutSum / burnoutCount) * 10) / 10 : null;

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
  const conversionRate =
    assessmentsTotal > 0
      ? Math.round((linkedTotal / assessmentsTotal) * 1000) / 10
      : 0;

  // Approximate previous conversion using linked7d / assessments7d vs prior week if available
  const conversionPrev =
    assessmentsPrev7d > 0
      ? Math.round((linked7d / Math.max(assessments7d, 1)) * 1000) / 10
      : null;

  let workspaces = [];
  try {
    workspaces = await listWorkspaces();
  } catch {
    workspaces = [];
  }

  const orgOverview = (workspaces ?? []).slice(0, 8).map((ws) => ({
    id: ws.id,
    name: ws.name || ws.brandName || 'Workspace',
    slug: ws.slug,
    plan:
      ws.status === 'live' || ws.status === 'active'
        ? 'Enterprise'
        : ws.status === 'draft'
          ? 'Standard'
          : 'Premium',
    status: ws.status || 'draft',
    contactEmail: ws.contactEmail || null,
    updatedAt: ws.updatedAt || ws.createdAt || null,
    domain: ws.customDomain || null,
  }));

  const volumeSeries = buildVolumeSeries(sessionRows, linkedSet, 14);
  const feedbackNew = await countNewFeedback();

  return {
    generatedAt: new Date().toISOString(),
    systemLive: databaseOk,
    signups: {
      total: signupsTotal,
      last7Days: signups7d,
      previous7Days: signupsPrev7d,
      last30Days: signups30d,
      last24Hours: signups24h,
      changeVsPreviousWeek: pctChange(signups7d, signupsPrev7d),
    },
    assessments: {
      total: assessmentsTotal,
      last7Days: assessments7d,
      previous7Days: assessmentsPrev7d,
      last30Days: assessments30d,
      last24Hours: assessments24h,
      linkedToAccount: linkedTotal,
      linkedLast7Days: linked7d,
      guestOrUnlinked: guestAssessments,
      changeVsPreviousWeek: pctChange(assessments7d, assessmentsPrev7d),
    },
    kpis: {
      totalAssessments: assessmentsTotal,
      assessmentsTrend: pctChange(assessments7d, assessmentsPrev7d),
      activeUsers24h: assessments24h + signups24h,
      activeUsersTrend: pctChange(assessments24h + signups24h, Math.round((assessmentsPrev7d + signupsPrev7d) / 7)),
      avgBurnoutPct,
      avgBurnoutLabel: burnoutRiskLabel(avgBurnoutPct),
      conversionRate,
      conversionTrend:
        conversionPrev == null ? 0 : Math.round((conversionRate - conversionPrev) * 10) / 10,
    },
    burnoutDistribution,
    personalityTop,
    volumeSeries,
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
    organizations: orgOverview,
    organizationCount: workspaces?.length ?? 0,
    feedbackNew,
    health: {
      database: {
        status: databaseOk ? 'up' : 'down',
        label: databaseOk ? 'Active' : 'Unreachable',
        detail: databaseOk ? '99.9% uptime target' : 'Could not query Postgres',
      },
    },
    sampleNote:
      sessionRows.length >= 2000
        ? 'Volume and burnout charts use up to the 2,000 most recent assessments in the last 30 days.'
        : null,
  };
}
