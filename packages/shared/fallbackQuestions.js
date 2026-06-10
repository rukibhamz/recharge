import {
  AGREEMENT_OPTIONS,
  BURNOUT_QUESTIONS,
  FREQUENCY_OPTIONS,
} from './questions.js';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MBTI_FALLBACK_POOL = [
  { text: 'I feel energised after spending time with a large group of people.', scoredPole: 'E', dichotomy: 'E/I' },
  { text: 'I enjoy being the centre of attention in social situations.', scoredPole: 'E', dichotomy: 'E/I' },
  { text: 'I need time alone to recharge after socialising, even if I enjoyed it.', scoredPole: 'I', dichotomy: 'E/I' },
  { text: 'I prefer deep one-on-one conversations over group discussions.', scoredPole: 'I', dichotomy: 'E/I' },
  { text: 'I focus on what is real and present rather than what could be.', scoredPole: 'S', dichotomy: 'S/N' },
  { text: 'I trust experience and proven methods over untested theories.', scoredPole: 'S', dichotomy: 'S/N' },
  { text: 'I enjoy thinking about future possibilities and hypothetical scenarios.', scoredPole: 'N', dichotomy: 'S/N' },
  { text: 'I often notice patterns and connections that others miss.', scoredPole: 'N', dichotomy: 'S/N' },
  { text: 'I make decisions based on logic and objective analysis rather than feelings.', scoredPole: 'T', dichotomy: 'T/F' },
  { text: 'I am more persuaded by a well-reasoned argument than by an emotional appeal.', scoredPole: 'T', dichotomy: 'T/F' },
  { text: 'I consider how decisions will affect other people before making them.', scoredPole: 'F', dichotomy: 'T/F' },
  { text: 'I place a high value on empathy and compassion when evaluating situations.', scoredPole: 'F', dichotomy: 'T/F' },
  { text: 'I like to have a clear plan before I start a project.', scoredPole: 'J', dichotomy: 'J/P' },
  { text: 'I keep an organised calendar and rarely miss deadlines.', scoredPole: 'J', dichotomy: 'J/P' },
  { text: 'I enjoy keeping my options open rather than committing to a fixed plan.', scoredPole: 'P', dichotomy: 'J/P' },
  { text: 'I like to adapt and improvise rather than follow a set schedule.', scoredPole: 'P', dichotomy: 'J/P' },
];

const DICHOTOMY_CODES = ['E/I', 'S/N', 'T/F', 'J/P'];

function selectBalancedMbtiFallback(pool) {
  const byDichotomy = new Map();
  for (const q of pool) {
    if (!byDichotomy.has(q.dichotomy)) byDichotomy.set(q.dichotomy, []);
    byDichotomy.get(q.dichotomy).push(q);
  }

  const selected = [];
  for (const code of DICHOTOMY_CODES) {
    selected.push(...shuffle(byDichotomy.get(code) ?? []).slice(0, 3));
  }
  return shuffle(selected);
}

export function buildFallbackPersonalityQuestions() {
  return selectBalancedMbtiFallback(MBTI_FALLBACK_POOL).map((q, i) => ({
    id: `fp${i + 1}`,
    text: q.text,
    scoredPole: q.scoredPole,
    dichotomy: q.dichotomy,
    scale: 'agreement',
    options: AGREEMENT_OPTIONS,
  }));
}

export function buildFallbackBurnoutQuestions() {
  return shuffle(BURNOUT_QUESTIONS).map((q, i) => {
    const base = {
      id: `fb${i + 1}`,
      text: q.text,
      dimension: q.dimension,
      reverseScored: Boolean(q.reverseScored),
      scale: 'frequency',
    };
    return {
      ...base,
      options: FREQUENCY_OPTIONS,
    };
  });
}
