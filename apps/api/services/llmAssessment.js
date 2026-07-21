import {
  ASSESSMENT_QUESTION_MAX,
  ASSESSMENT_QUESTION_MIN,
} from '@recharge/shared/assessmentConstants';
import { optionsForScale, resolveQuestionScale } from '@recharge/shared/questions';
import { coerceOptionsToScale, optionLabelForValue } from '@recharge/shared/questionOptions';
import { firstName } from '@recharge/shared/name';
import { scoreMbti, formatMbtiType } from '@recharge/shared/mbtiScoring';
import { scoreBurnout } from '@recharge/shared/scoring';
import { llmFeatures } from '../config/llm.js';
import { hasAnyLlmProvider, generateJson, getLastLlmProvider } from './llmProvider.js';
import { buildQuestionPromptContext, buildPersonalityInsightPromptContext, buildUserPromptContext } from './promptContext.js';
import { BURNOUT_MIXED_SCALE_RULES } from '@recharge/shared/promptCoaching';
import { generateRecommendations } from './llm.js';
import { getBurnoutBankQuestions, getMbtiTypeProfile, getPersonalityBankQuestions } from './questionBank.js';

function llmSource() {
  return getLastLlmProvider() ?? 'llm';
}

function bankFallbackEnabled() {
  const raw = process.env.LLM_ASSESSMENT_BANK_FALLBACK;
  if (raw === 'false' || raw === '0') return false;
  return true;
}

function questionsSupportMbtiScoring(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  return questions.every((q) => q.scoredPole ?? q.scored_pole);
}

async function scorePersonalityFromBank(questions, answers) {
  const mbti = scoreMbti(answers, questions);
  let profile = null;
  try {
    profile = await getMbtiTypeProfile(mbti.typeCode);
  } catch (err) {
    console.warn('MBTI profile load failed:', err.message);
  }
  const type = formatMbtiType(
    profile ?? {
      code: mbti.typeCode,
      title: '',
      archetype: '',
      description: '',
      strengths: '',
      growth_areas: '',
    },
  );
  const personality = normalizePersonalityResult({
    typeCode: mbti.typeCode,
    type: {
      title: type.title,
      archetype: type.archetype,
      desc: type.desc,
      strengths: type.strengths,
      growthAreas: type.growthAreas,
      icon: type.icon,
    },
    traits: mbti.traits,
    summary: type.desc,
  });
  return { personality, source: profile ? 'bank' : 'scoring' };
}

function scoreBurnoutFromAnswers(questions, answers) {
  const scored = scoreBurnout(answers, questions);
  return {
    burnout: {
      ...scored,
      summary: `Based on your check-in answers, your current burnout score is ${scored.pct}% (${scored.level}).`,
    },
    source: 'scoring',
  };
}

function formatQaBlock(questions, answers) {
  return questions
    .map((q, i) => {
      const label = optionLabelForValue(q.options, answers[i]);
      return `Q${i + 1}: ${q.text}\nAnswer: ${label}`;
    })
    .join('\n\n');
}

function normalizeQuestions(raw, phase) {
  const list = Array.isArray(raw) ? raw : raw?.questions;
  if (!Array.isArray(list)) throw new Error('Invalid question list from LLM');

  const questions = list
    .map((q, i) => {
      const text = String(q.text ?? q.question ?? '').trim();
      const scale =
        phase === 'personality'
          ? 'agreement'
          : resolveQuestionScale({ scale: q.scale, text }, 'burnout');
      return {
        id: String(q.id ?? `${phase[0]}${i + 1}`),
        text,
        scale,
        options: coerceOptionsToScale(q.options, scale),
      };
    })
    .filter((q) => q.text.length > 8);

  if (questions.length < ASSESSMENT_QUESTION_MIN) {
    throw new Error(`LLM returned only ${questions.length} questions`);
  }

  return questions.slice(0, ASSESSMENT_QUESTION_MAX);
}

export function normalizePersonalityResult(parsed) {
  const typeCode = String(parsed.typeCode ?? parsed.type_code ?? 'INTJ')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4) || 'INTJ';
  const t = parsed.type ?? {};

  return {
    typeCode,
    type: {
      id: typeCode.toLowerCase(),
      code: typeCode,
      name: t.title ? `${typeCode} — ${t.title}` : typeCode,
      title: t.title ?? '',
      archetype: t.archetype ?? '',
      desc: t.desc ?? t.description ?? parsed.summary ?? '',
      strengths: t.strengths ?? '',
      growthAreas: t.growthAreas ?? t.growth_areas ?? '',
      icon: t.icon ?? '✨',
    },
    traits: Array.isArray(parsed.traits)
      ? parsed.traits.map((tr) => ({
          name: tr.name ?? '',
          pct: Math.min(100, Math.max(0, Number(tr.pct ?? 50))),
          poleA: tr.poleA ?? tr.pole_a ?? 'E',
          poleB: tr.poleB ?? tr.pole_b ?? 'I',
        }))
      : [],
    summary: parsed.summary ?? '',
  };
}

export function normalizeBurnoutResult(parsed) {
  const rawPct = Number(parsed?.pct ?? parsed?.score ?? 50);
  const pct = Number.isFinite(rawPct)
    ? Math.min(100, Math.max(0, Math.round(rawPct)))
    : 50;
  let cls = String(parsed?.cls ?? parsed?.level_class ?? '').toLowerCase();
  const levelMap = {
    healthy: 'Healthy Range',
    mild: 'Mild Burnout',
    moderate: 'Moderate Burnout',
    severe: 'Severe Burnout',
  };

  if (!['healthy', 'mild', 'moderate', 'severe'].includes(cls)) {
    if (pct >= 70) cls = 'severe';
    else if (pct >= 45) cls = 'moderate';
    else if (pct >= 25) cls = 'mild';
    else cls = 'healthy';
  }

  return {
    pct,
    level: parsed.level ?? levelMap[cls],
    cls,
    summary: parsed.summary ?? '',
  };
}

export async function generatePersonalityTest(userName, demographics) {
  const useBank = () => getPersonalityBankQuestions();

  if (!llmFeatures.personalityQuestions) {
    const { questions, source } = await useBank();
    return { questions, count: questions.length, source };
  }

  if (!hasAnyLlmProvider()) {
    if (bankFallbackEnabled()) {
      const { questions, source } = await useBank();
      return { questions, count: questions.length, source };
    }
    throw new Error('No LLM provider available. Personality test requires a live connection.');
  }

  const ctx = buildQuestionPromptContext({ userName, demographics });
  const name = firstName(userName);

  const prompt = `Design a unique personality interview for ${name || 'this person'}.

${ctx}

Create exactly ${ASSESSMENT_QUESTION_MIN} to ${ASSESSMENT_QUESTION_MAX} questions that reveal how they gain energy, process information, make decisions, and organise life.
- Each question: one clear "I ..." statement they can rate
- Exactly 5 options per question (value 0–4, labels must fit THAT statement — not generic Likert text)
- Personalise tone to their age and work context only — no place names
- All questions must be answerable on a single 5-point scale

Return JSON only:
{"questions":[{"id":"p1","text":"I ...","options":[{"value":0,"label":"..."},{"value":1,"label":"..."},{"value":2,"label":"..."},{"value":3,"label":"..."},{"value":4,"label":"..."}]}]}`;

  try {
    const parsed = await generateJson(prompt);
    const questions = normalizeQuestions(parsed, 'personality');
    return { questions, count: questions.length, source: llmSource() };
  } catch (err) {
    console.warn('Personality test LLM failed:', err.message);
    if (!bankFallbackEnabled()) throw err;
    const { questions, source } = await useBank();
    return { questions, count: questions.length, source };
  }
}

export async function scorePersonalityTest(userName, demographics, questions, answers) {
  const ctx = buildPersonalityInsightPromptContext({ userName, demographics });
  const qa = formatQaBlock(questions, answers);

  const prompt = `You are a skilled therapist listening to someone's personality interview. Reflect back what their answers reveal — with warmth, specificity, and zero geography.

${ctx}

Their interview:
${qa}

Infer their best-fit 4-letter type from the answers (MBTI-style). Trait percentages show lean toward poleA (0–100).

Write copy they will read on screen right after the interview. It should feel heard, not categorised.

Return JSON only:
{"typeCode":"ENFP","type":{"title":"Campaigner","archetype":"short nickname e.g. The Encourager","desc":"2-3 sentences, second person, tied to their answers","strengths":"One gentle sentence — what seems to sustain them","growthAreas":"One gentle sentence — where they might need more compassion or space","icon":"🌟"},"traits":[{"name":"Extraversion / Introversion","pct":72,"poleA":"E","poleB":"I"},{"name":"Sensing / Intuition","pct":40,"poleA":"S","poleB":"N"},{"name":"Thinking / Feeling","pct":55,"poleA":"T","poleB":"F"},{"name":"Judging / Perceiving","pct":35,"poleA":"J","poleB":"P"}],"summary":"2-4 reflective sentences — themes from their answers, no type-code lecture, no places"}`;

  if (hasAnyLlmProvider()) {
    try {
      const parsed = await generateJson(prompt);
      return { personality: normalizePersonalityResult(parsed), source: llmSource() };
    } catch (err) {
      console.warn('Personality score LLM failed:', err.message);
      if (!bankFallbackEnabled() || !questionsSupportMbtiScoring(questions)) {
        throw new Error(
          err.message?.includes('429') || /quota|circuit/i.test(err.message ?? '')
            ? 'Gemini is temporarily rate-limited. Wait a minute and try again, or retry later.'
            : err.message,
        );
      }
    }
  } else if (!bankFallbackEnabled() || !questionsSupportMbtiScoring(questions)) {
    throw new Error('No LLM provider available.');
  }

  return scorePersonalityFromBank(questions, answers);
}

export async function generateBurnoutTest(userName, demographics, personality) {
  const useBank = () => getBurnoutBankQuestions();

  if (!llmFeatures.burnoutQuestions) {
    const { questions, source } = await useBank();
    return { questions, count: questions.length, source };
  }

  if (!hasAnyLlmProvider()) {
    if (bankFallbackEnabled()) {
      const { questions, source } = await useBank();
      return { questions, count: questions.length, source };
    }
    throw new Error('No LLM provider available. Burnout test requires a live connection.');
  }

  const ctx = buildQuestionPromptContext({ userName, demographics });
  const name = firstName(userName);
  const p = personality ?? {};

  const prompt = `Design a burnout and energy check-in for ${name || 'this person'}.

${ctx}

Their personality profile:
- Type: ${p.typeCode ?? ''} — ${p.type?.title ?? ''}
- Summary: ${p.summary ?? p.type?.desc ?? ''}

Create ${ASSESSMENT_QUESTION_MIN} to ${ASSESSMENT_QUESTION_MAX} varied burnout check-in questions — mix "I ..." agreement statements and "How often..." frequency items as each topic needs.
- Cover exhaustion, cynicism, overwhelm, recovery, and sense of accomplishment
- Tailor to their work situation and age only — no place names
- Build on their personality — e.g. social vs solo stress patterns

${BURNOUT_MIXED_SCALE_RULES}

Return JSON only:
{"questions":[{"id":"b1","text":"...","scale":"agreement","options":[{"value":0,"label":"..."},{"value":1,"label":"..."},{"value":2,"label":"..."},{"value":3,"label":"..."},{"value":4,"label":"..."}]},{"id":"b2","text":"How often...","scale":"frequency","options":[{"value":0,"label":"..."},{"value":1,"label":"..."},{"value":2,"label":"..."},{"value":3,"label":"..."},{"value":4,"label":"..."}]}]}`;

  try {
    const parsed = await generateJson(prompt);
    const questions = normalizeQuestions(parsed, 'burnout');
    return { questions, count: questions.length, source: llmSource() };
  } catch (err) {
    console.warn('Burnout test LLM failed:', err.message);
    if (!bankFallbackEnabled()) throw err;
    const { questions, source } = await useBank();
    return { questions, count: questions.length, source };
  }
}

export async function scoreBurnoutTest(userName, demographics, personality, questions, answers) {
  const ctx = buildUserPromptContext({ userName, demographics });
  const qa = formatQaBlock(questions, answers);

  const prompt = `You are a burnout specialist. Assess burnout risk from these check-in responses.

${ctx}

Personality context: ${personality?.typeCode ?? ''} — ${personality?.summary ?? ''}

${qa}

Determine burnout level. pct is 0 (healthy) to 100 (severe depletion).
cls must be one of: healthy, mild, moderate, severe

Return JSON only:
{"pct":42,"cls":"moderate","level":"Moderate Burnout","summary":"2-3 sentences explaining what you see and why"}`;

  if (hasAnyLlmProvider()) {
    try {
      const parsed = await generateJson(prompt);
      return { burnout: normalizeBurnoutResult(parsed), source: llmSource() };
    } catch (err) {
      console.warn('Burnout score LLM failed:', err.message);
      if (!bankFallbackEnabled()) throw err;
    }
  } else if (!bankFallbackEnabled()) {
    throw new Error('No LLM provider available.');
  }

  return scoreBurnoutFromAnswers(questions, answers);
}

export async function completeAssessment({
  userName,
  demographics,
  personality,
  burnout,
  burnoutQuestions,
  personalityQuestions,
}) {
  const { recommendations, source } = await generateRecommendations(
    burnout.level,
    personality,
    userName,
    demographics,
  );

  return {
    burnout,
    personality,
    recommendations,
    aiSource: source,
    burnoutQuestions,
    personalityQuestions,
  };
}
