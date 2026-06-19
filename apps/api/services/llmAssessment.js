import {
  ASSESSMENT_QUESTION_MAX,
  ASSESSMENT_QUESTION_MIN,
} from '@recharge/shared/assessmentConstants';
import { AGREEMENT_OPTIONS, FREQUENCY_OPTIONS } from '@recharge/shared/questions';
import { COACH_VOICE_RULES, LOCATION_RULES } from '@recharge/shared/promptCoaching';
import { normalizeLlmOptions, optionLabelForValue } from '@recharge/shared/questionOptions';
import { firstName } from '@recharge/shared/name';
import { hasAnyLlmProvider, generateJson, getLastLlmProvider } from './llmProvider.js';
import { buildUserPromptContext } from './promptContext.js';
import { generateRecommendations } from './llm.js';

function llmSource() {
  return getLastLlmProvider() ?? 'llm';
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
  const fallback = phase === 'personality' ? AGREEMENT_OPTIONS : FREQUENCY_OPTIONS;
  const list = Array.isArray(raw) ? raw : raw?.questions;
  if (!Array.isArray(list)) throw new Error('Invalid question list from LLM');

  const questions = list
    .map((q, i) => ({
      id: String(q.id ?? `${phase[0]}${i + 1}`),
      text: String(q.text ?? q.question ?? '').trim(),
      scale: phase === 'personality' ? 'agreement' : 'frequency',
      options: normalizeLlmOptions(q.options, fallback),
    }))
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
  const pct = Math.min(100, Math.max(0, Math.round(Number(parsed.pct ?? parsed.score ?? 50))));
  let cls = String(parsed.cls ?? parsed.level_class ?? '').toLowerCase();
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
  if (!hasAnyLlmProvider()) {
    throw new Error('No LLM provider available. Personality test requires AI.');
  }

  const ctx = buildUserPromptContext({ userName, demographics });
  const name = firstName(userName);

  const prompt = `Design a unique personality interview for ${name || 'this person'}.

${ctx}

Create exactly ${ASSESSMENT_QUESTION_MIN} to ${ASSESSMENT_QUESTION_MAX} questions that reveal how they gain energy, process information, make decisions, and organise life.
- Each question: one clear "I ..." statement they can rate
- Exactly 5 options per question (value 0–4, labels must fit THAT statement — not generic Likert text)
- Personalise tone to their age and work context; mention city lightly at most once or twice
- All questions must be answerable on a single 5-point scale

${COACH_VOICE_RULES}
${LOCATION_RULES}

Return JSON only:
{"questions":[{"id":"p1","text":"I ...","options":[{"value":0,"label":"..."},{"value":1,"label":"..."},{"value":2,"label":"..."},{"value":3,"label":"..."},{"value":4,"label":"..."}]}]}`;

  const parsed = await generateJson(prompt);
  const questions = normalizeQuestions(parsed, 'personality');

  return { questions, count: questions.length, source: llmSource() };
}

export async function scorePersonalityTest(userName, demographics, questions, answers) {
  if (!hasAnyLlmProvider()) {
    throw new Error('No LLM provider available.');
  }

  const ctx = buildUserPromptContext({ userName, demographics });
  const qa = formatQaBlock(questions, answers);

  const prompt = `You are an expert personality psychologist. Analyze these interview responses.

${ctx}

${qa}

From their actual answers, infer:
- Best-fit 4-letter personality type code (MBTI-style)
- Four trait dimensions with percentage lean (0–100 toward poleA)
- Personalised description, strengths, growth areas — specific to what they said

Return JSON only:
{"typeCode":"ENFP","type":{"title":"Campaigner","archetype":"...","desc":"...","strengths":"...","growthAreas":"...","icon":"🌟"},"traits":[{"name":"Extraversion / Introversion","pct":72,"poleA":"E","poleB":"I"},{"name":"Sensing / Intuition","pct":40,"poleA":"S","poleB":"N"},{"name":"Thinking / Feeling","pct":55,"poleA":"T","poleB":"F"},{"name":"Judging / Perceiving","pct":35,"poleA":"J","poleB":"P"}],"summary":"..."}`;

  const parsed = await generateJson(prompt);
  return { personality: normalizePersonalityResult(parsed), source: llmSource() };
}

export async function generateBurnoutTest(userName, demographics, personality) {
  if (!hasAnyLlmProvider()) {
    throw new Error('No LLM provider available. Burnout test requires AI.');
  }

  const ctx = buildUserPromptContext({ userName, demographics });
  const name = firstName(userName);
  const p = personality ?? {};

  const prompt = `Design a burnout and energy check-in for ${name || 'this person'}.

${ctx}

Their personality profile:
- Type: ${p.typeCode ?? ''} — ${p.type?.title ?? ''}
- Summary: ${p.summary ?? p.type?.desc ?? ''}

Create ${ASSESSMENT_QUESTION_MIN} to ${ASSESSMENT_QUESTION_MAX} "how often" questions about exhaustion, cynicism, overwhelm, recovery, and sense of accomplishment.
- Tailor to their work situation, age, and location (use their city only if provided)
- Exactly 5 frequency options per question (value 0=never → 4=always, labels must match the question)
- Build on their personality — e.g. social vs solo stress patterns

${COACH_VOICE_RULES}
${LOCATION_RULES}

Return JSON only:
{"questions":[{"id":"b1","text":"How often...","options":[{"value":0,"label":"..."},{"value":1,"label":"..."},{"value":2,"label":"..."},{"value":3,"label":"..."},{"value":4,"label":"..."}]}]}`;

  const parsed = await generateJson(prompt);
  const questions = normalizeQuestions(parsed, 'burnout');

  return { questions, count: questions.length, source: llmSource() };
}

export async function scoreBurnoutTest(userName, demographics, personality, questions, answers) {
  if (!hasAnyLlmProvider()) {
    throw new Error('No LLM provider available.');
  }

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

  const parsed = await generateJson(prompt);
  return { burnout: normalizeBurnoutResult(parsed), source: llmSource() };
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
