export const PERSONALITY_TYPES = [
  {
    id: 'achiever',
    name: 'The Achiever',
    icon: '🎯',
    desc: 'Driven by results and measurable progress. You recharge best when effort connects to visible outcomes.',
  },
  {
    id: 'creator',
    name: 'The Creator',
    icon: '🎨',
    desc: 'Energised by novelty and self-expression. You recharge best when you have room to explore and create.',
  },
  {
    id: 'connector',
    name: 'The Connector',
    icon: '🤝',
    desc: 'Finds purpose through meaningful relationships. You recharge best through trusted connection, not isolation.',
  },
  {
    id: 'anchor',
    name: 'The Anchor',
    icon: '🏛️',
    desc: 'Values stability, reliability, and structure. You recharge best when life feels predictable and grounded.',
  },
];

export const TRAIT_LABELS = {
  introversion_extraversion: 'Introversion / Extraversion',
  planful_spontaneous: 'Planful / Spontaneous',
  resilience: 'Resilience',
  stress_response: 'Stress Response',
};

const LEGACY_REVERSE_SCORED = [11];
const LEGACY_TRAIT_MAP = [
  { name: TRAIT_LABELS.introversion_extraversion, questionIndices: [1, 8] },
  { name: TRAIT_LABELS.planful_spontaneous, questionIndices: [0, 3] },
  { name: TRAIT_LABELS.resilience, questionIndices: [4, 11] },
  { name: TRAIT_LABELS.stress_response, questionIndices: [7, 9] },
];

export function maxAnswerValue(questions) {
  if (!questions?.length) return 3;
  return Math.max(...questions.map((q) => (q.options?.length ?? 4) - 1));
}

export function scoreBurnout(answers, questions = null) {
  const maxPerQ = maxAnswerValue(questions);
  const MAX = answers.length * maxPerQ;
  const raw = answers.reduce((sum, val, i) => {
    const reverse = questions?.[i]?.reverseScored ?? LEGACY_REVERSE_SCORED.includes(i);
    const score = reverse ? maxPerQ - val : val;
    return sum + score;
  }, 0);
  const pct = Math.round((raw / MAX) * 100);

  if (pct >= 70) return { pct, level: 'Severe Burnout', cls: 'severe' };
  if (pct >= 45) return { pct, level: 'Moderate Burnout', cls: 'moderate' };
  if (pct >= 25) return { pct, level: 'Mild Burnout', cls: 'mild' };
  return { pct, level: 'Healthy Range', cls: 'healthy' };
}

export function scorePersonality(answers, questions = null) {
  if (!questions?.length) {
    const typeIndex = answers[10] ?? 0;
    const type = PERSONALITY_TYPES[typeIndex] ?? PERSONALITY_TYPES[0];
    const traits = LEGACY_TRAIT_MAP.map((t) => {
      const vals = t.questionIndices.map((i) => answers[i] ?? 0);
      const pct = Math.round((vals.reduce((a, v) => a + v, 0) / (vals.length * 3)) * 100);
      return { name: t.name, pct };
    });
    return { type, traits };
  }

  const typeIndex = questions.findIndex((q) => q.typeSelector);
  const typeAnswer = answers[typeIndex >= 0 ? typeIndex : 10] ?? 0;
  const type = PERSONALITY_TYPES[typeAnswer] ?? PERSONALITY_TYPES[0];

  const traits = Object.entries(TRAIT_LABELS).map(([traitKey, name]) => {
    const indices = questions
      .map((q, i) => (q.trait === traitKey ? i : -1))
      .filter((i) => i >= 0);
    const vals = indices.map((i) => answers[i] ?? 0);
    const pct =
      vals.length > 0
        ? Math.round((vals.reduce((a, v) => a + v, 0) / (vals.length * 3)) * 100)
        : 0;
    return { name, pct };
  });

  return { type, traits };
}

export function validateAnswers(answers, expectedLength = 12, maxValue = 3) {
  if (!Array.isArray(answers) || answers.length !== expectedLength) {
    return { valid: false, error: `Expected ${expectedLength} answers` };
  }
  if (answers.some((v) => !Number.isInteger(v) || v < 0 || v > maxValue)) {
    return { valid: false, error: `Each answer must be an integer from 0 to ${maxValue}` };
  }
  return { valid: true };
}
