import { demographicsLabels } from '@recharge/shared/demographics';
import { firstName } from '@recharge/shared/name';
import { personalityRecoveryProfile } from '@recharge/shared/promptCoaching';
import { recoveryPreferencesPromptContext } from '@recharge/shared/recoveryPreferences';
import {
  COACH_NAME,
  OMA_PERSONA,
  omaTurnGuidance,
} from '@recharge/shared/coachPersona';
import { flattenRoadmapSteps } from '@recharge/shared/recoveryRoadmap';
import { formatTodayPlanForCoach } from '@recharge/shared/roadmapProgress';
import { normalizeRecommendationsList } from '@recharge/shared/recommendations';
import { getSessionForUser, getSessionsForUser } from './sessions.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const HISTORY_LIMIT = 5;

async function loadSessionWithDemographics(userId, sessionId) {
  const { data, error } = await getSessionForUser(userId, sessionId);
  if (error || !data) return { data: null, error: error ?? new Error('Session not found') };

  if (!isSupabaseConfigured()) return { data, error: null };

  const { data: row } = await supabase
    .from('sessions')
    .select('demographics')
    .eq('id', sessionId)
    .maybeSingle();

  return {
    data: {
      ...data,
      demographics: row?.demographics ?? null,
    },
    error: null,
  };
}

function formatRecommendations(session) {
  const steps = flattenRoadmapSteps(session?.recoveryRoadmap);
  const list = steps.length
    ? steps
    : normalizeRecommendationsList(session?.recommendations ?? [], []).slice(0, 4);
  if (!list.length) return 'No recovery tips on file yet.';
  return list
    .map((rec, i) => {
      const when = rec.when ? ` (${rec.when})` : '';
      return `${i + 1}.${when} ${rec.title}: ${rec.tip}`;
    })
    .join('\n');
}

function formatPlanForOma(session, completedDayKeys = null) {
  const roadmap = session?.recoveryRoadmap;
  if (roadmap?.phases?.length) {
    const startedAt = session?.createdAt || session?.created_at || null;
    const todayBlock = formatTodayPlanForCoach(roadmap, completedDayKeys, startedAt);
    if (todayBlock) return todayBlock;
  }
  return `Broader recovery tips (use only if they ask beyond today):\n${formatRecommendations(session)}`;
}

function formatTraits(traits) {
  if (!Array.isArray(traits) || !traits.length) return '';
  return traits
    .slice(0, 4)
    .map((t) => {
      const name = t.name || `${t.poleA ?? ''}/${t.poleB ?? ''}`;
      return `- ${name}: ${t.pct ?? '?'}%`;
    })
    .join('\n');
}

/** Build Oma's system prompt from a saved assessment. */
export function buildOmaSystemPrompt(
  session,
  {
    userTurnCount = 0,
    adviceAcknowledged = false,
    coachName = COACH_NAME,
    completedDayKeys = null,
  } = {},
) {
  const name = firstName(session?.displayName) || 'there';
  const demographics = session?.demographics ?? {};
  const recoveryPreferences =
    demographics.recoveryPreferences ?? session?.recoveryPreferences ?? null;
  const labels = demographicsLabels(demographics);
  const personality = session?.personality;
  const burnout = session?.burnout;

  const lines = [
    OMA_PERSONA,
    '',
    omaTurnGuidance({ userTurnCount, adviceAcknowledged }),
    '',
    `You are speaking privately with ${name}.`,
    '',
    'Saved check-in context (use lightly to ask better questions, not to lecture):',
  ];

  if (burnout) {
    lines.push(
      `- Burnout: ${burnout.level ?? 'Unknown'} (${burnout.pct ?? '?'}%).`,
    );
    if (burnout.summary) {
      lines.push(`- Burnout reflection: ${String(burnout.summary).slice(0, 600)}`);
    }
  }

  if (personality) {
    const typeTitle =
      personality.type?.title || personality.type?.name || personality.typeCode || 'Unknown';
    lines.push(`- Personality: ${personality.typeCode ?? ''} — ${typeTitle}`);
    if (personality.summary) {
      lines.push(`- Personality reflection: ${String(personality.summary).slice(0, 500)}`);
    }
    const traitLines = formatTraits(personality.traits);
    if (traitLines) lines.push(`- Trait leanings:\n${traitLines}`);
    const recoveryProfile = personalityRecoveryProfile(personality);
    if (recoveryProfile) lines.push(recoveryProfile);
  }

  if (labels) {
    const contextBits = [
      labels.ageBand && `Age band: ${labels.ageBand}`,
      labels.workContext && `Work situation: ${labels.workContext}`,
      labels.workSector && `Field: ${labels.workSector}`,
      labels.city && labels.country
        ? `Location: ${labels.city}, ${labels.country}`
        : labels.country
          ? `Location: ${labels.country}`
          : null,
    ].filter(Boolean);
    if (contextBits.length) {
      lines.push(`- Life context: ${contextBits.join('; ')}`);
    }
  }

  const unwind = recoveryPreferencesPromptContext(recoveryPreferences);
  if (unwind) lines.push(unwind);

  if (session?.knowledgeContext) {
    lines.push('', session.knowledgeContext);
  }

  lines.push(
    `- Their recovery plan (prefer TODAY; only expand if they ask):\n${formatPlanForOma(session, completedDayKeys)}`,
  );
  lines.push('');
  if (coachName && coachName !== COACH_NAME) {
    lines.push(`For this conversation, your name is ${coachName}. Introduce yourself with this name.`);
  }
  lines.push(
    `Sign replies as yourself (${coachName || COACH_NAME}) in tone only. Do not end every message with a signature.`,
  );

  return lines.join('\n');
}

export async function resolveCoachAssessmentContext(userId, preferredSessionId = null) {
  const { data: assessments, error: listError } = await getSessionsForUser(userId);
  if (listError) return { assessments: [], session: null, error: listError };

  if (!assessments.length) {
    return { assessments: [], session: null, error: null };
  }

  const sessionId =
    preferredSessionId && assessments.some((a) => a.sessionId === preferredSessionId)
      ? preferredSessionId
      : assessments[0].sessionId;

  const { data: session, error } = await loadSessionWithDemographics(userId, sessionId);
  if (error) return { assessments, session: null, error };

  return {
    assessments: assessments.slice(0, HISTORY_LIMIT),
    session,
    error: null,
  };
}
