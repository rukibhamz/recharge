/** Likert scale for personality / trait statements ("I prefer…", "I stay calm…") */
export const AGREEMENT_OPTIONS = [
  { value: 0, label: 'Strongly disagree' },
  { value: 1, label: 'Disagree' },
  { value: 2, label: 'Neutral' },
  { value: 3, label: 'Agree' },
  { value: 4, label: 'Strongly agree' },
];

/** Frequency scale for burnout / "how often" items (matches burnout_options in Supabase) */
export const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Always' },
];

/** @deprecated Use FREQUENCY_OPTIONS or AGREEMENT_OPTIONS */
export const SCALE_OPTIONS = FREQUENCY_OPTIONS;

export const MOTIVATOR_OPTIONS = [
  { value: 0, label: 'Hitting goals and seeing measurable results' },
  { value: 1, label: 'Creating something original or expressive' },
  { value: 2, label: 'Deep connection with people I care about' },
  { value: 3, label: 'Stability, reliability, and clear structure' },
];

export const BURNOUT_QUESTIONS = [
  {
    id: 'b01',
    text: 'I feel emotionally drained from my work or daily responsibilities.',
    dimension: 'emotional_exhaustion',
    scale: 'agreement',
  },
  {
    id: 'b02',
    text: 'How often have you felt physically exhausted before the workday even begins?',
    dimension: 'emotional_exhaustion',
    scale: 'frequency',
  },
  {
    id: 'b03',
    text: 'I feel used up at the end of the workday.',
    dimension: 'emotional_exhaustion',
    scale: 'agreement',
  },
  {
    id: 'b04',
    text: 'How often do you feel emotionally drained by your work?',
    dimension: 'emotional_exhaustion',
    scale: 'frequency',
  },
  {
    id: 'b05',
    text: 'I feel I treat some people as if they were impersonal objects.',
    dimension: 'depersonalisation',
    scale: 'agreement',
  },
  {
    id: 'b06',
    text: "I feel I've become more callous toward people.",
    dimension: 'depersonalisation',
    scale: 'agreement',
  },
  {
    id: 'b07',
    text: 'I worry that my work is hardening me emotionally.',
    dimension: 'depersonalisation',
    scale: 'agreement',
  },
  {
    id: 'b08',
    text: 'I feel detached from the people I work with or live around.',
    dimension: 'depersonalisation',
    scale: 'agreement',
  },
  {
    id: 'b09',
    text: 'I feel I am working too hard on things.',
    dimension: 'emotional_exhaustion',
    scale: 'agreement',
  },
  {
    id: 'b10',
    text: 'I feel stressed by my responsibilities.',
    dimension: 'emotional_exhaustion',
    scale: 'agreement',
  },
  {
    id: 'b11',
    text: 'I feel overwhelmed by the pace of my life.',
    dimension: 'emotional_exhaustion',
    scale: 'agreement',
  },
  {
    id: 'b12',
    text: 'I feel a strong sense of accomplishment in what I do.',
    dimension: 'personal_accomplishment',
    reverseScored: true,
    scale: 'agreement',
  },
];

export const PERSONALITY_QUESTIONS = [
  {
    id: 'p01',
    text: 'I prefer to plan my week in advance rather than decide day by day.',
    scale: 'agreement',
  },
  {
    id: 'p02',
    text: 'After a long day with others, I need quiet time alone to recharge.',
    scale: 'agreement',
  },
  {
    id: 'p03',
    text: "I feel most alive when I'm trying something completely new.",
    scale: 'agreement',
  },
  {
    id: 'p04',
    text: 'I make important decisions quickly, trusting my instincts.',
    scale: 'agreement',
  },
  {
    id: 'p05',
    text: "I bounce back quickly when things don't go as planned.",
    scale: 'agreement',
  },
  {
    id: 'p06',
    text: 'I prefer collaborating with others over working independently.',
    scale: 'agreement',
  },
  {
    id: 'p07',
    text: 'I feel uneasy when my routine is disrupted unexpectedly.',
    scale: 'agreement',
  },
  {
    id: 'p08',
    text: 'Under pressure, I tend to withdraw rather than reach out.',
    scale: 'agreement',
  },
  {
    id: 'p09',
    text: 'I gain energy from being around people and social settings.',
    scale: 'agreement',
  },
  {
    id: 'p10',
    text: 'When stressed, I become irritable or short with people close to me.',
    scale: 'agreement',
  },
  {
    id: 'p11',
    text: 'What motivates me most right now is…',
    scale: 'choice',
    options: MOTIVATOR_OPTIONS,
  },
  {
    id: 'p12',
    text: 'I stay calm and focused even when multiple demands compete for my attention.',
    scale: 'agreement',
  },
];

export function inferQuestionScale(text) {
  const t = String(text ?? '').trim();
  if (!t) return 'agreement';
  if (/^how often\b/i.test(t)) return 'frequency';
  if (/\bhow often (do|have|does|did) you\b/i.test(t)) return 'frequency';
  return 'agreement';
}

/** Explicit scale from DB/LLM wins; infer from text only when missing. */
export function resolveQuestionScale(question, phase = 'personality') {
  const raw = question?.scale ?? question?.response_scale;
  if (raw === 'frequency' || raw === 'agreement') return raw;
  if (question?.text) return inferQuestionScale(question.text);
  return phase === 'burnout' ? 'agreement' : 'agreement';
}

export function optionsForScale(scale) {
  return scale === 'frequency' ? FREQUENCY_OPTIONS : AGREEMENT_OPTIONS;
}

export function optionsForQuestion(question, phase = 'personality') {
  if (question.typeSelector || question.scale === 'choice') {
    return MOTIVATOR_OPTIONS;
  }

  const scale = resolveQuestionScale(question, phase);
  const fallback = optionsForScale(scale);

  if (Array.isArray(question.options) && question.options.length > 0) {
    const labels = question.options.map((o) => String(o?.label ?? '').toLowerCase()).join(' ');
    const isFrequencyLabels = /\bnever\b/.test(labels) && /\balways\b/.test(labels);
    const isAgreementLabels =
      /\bstrongly disagree\b/.test(labels) ||
      (/\bagree\b/.test(labels) && /\bdisagree\b/.test(labels));
    if (scale === 'agreement' && isFrequencyLabels) return AGREEMENT_OPTIONS;
    if (scale === 'frequency' && isAgreementLabels) return FREQUENCY_OPTIONS;
    return question.options;
  }

  return fallback;
}

export const BURNOUT_LEVEL_COPY = {
  healthy:
    'Your responses suggest you are in a healthy range right now. Keep protecting the habits that sustain you.',
  mild: 'You may be carrying more than usual. This is useful information — not a verdict — and a signal to pay attention early.',
  moderate:
    'Your answers point to sustained depletion. Many people at this level benefit from small, deliberate recovery steps starting this week.',
  severe:
    'What you are feeling is real and significant. This result is information that can guide your next step — not a label you have to carry alone.',
};
