import {
  AGREEMENT_OPTIONS,
  BURNOUT_QUESTIONS,
  inferQuestionScale,
  optionsForScale,
} from './questions.js';
import { selectPoleBalancedPersonalityQuestions } from './personalitySelection.js';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MBTI_FALLBACK_POOL = [
  { text: 'I feel energised after spending time with a large group of people.', scoredPole: 'E', dichotomy: 'E/I', question_number: 1 },
  { text: 'I enjoy being the centre of attention in social situations.', scoredPole: 'E', dichotomy: 'E/I', question_number: 2 },
  { text: 'I need time alone to recharge after socialising, even if I enjoyed it.', scoredPole: 'I', dichotomy: 'E/I', question_number: 9 },
  { text: 'I prefer deep one-on-one conversations over group discussions.', scoredPole: 'I', dichotomy: 'E/I', question_number: 10 },
  { text: 'I focus on what is real and present rather than what could be.', scoredPole: 'S', dichotomy: 'S/N', question_number: 16 },
  { text: 'I trust experience and proven methods over untested theories.', scoredPole: 'S', dichotomy: 'S/N', question_number: 17 },
  { text: 'I enjoy thinking about future possibilities and hypothetical scenarios.', scoredPole: 'N', dichotomy: 'S/N', question_number: 25 },
  { text: 'I often notice patterns and connections that others miss.', scoredPole: 'N', dichotomy: 'S/N', question_number: 26 },
  { text: 'I make decisions based on logic and objective analysis rather than feelings.', scoredPole: 'T', dichotomy: 'T/F', question_number: 31 },
  { text: 'I am more persuaded by a well-reasoned argument than by an emotional appeal.', scoredPole: 'T', dichotomy: 'T/F', question_number: 34 },
  { text: 'I consider how decisions will affect other people before making them.', scoredPole: 'F', dichotomy: 'T/F', question_number: 38 },
  { text: 'I place a high value on empathy and compassion when evaluating situations.', scoredPole: 'F', dichotomy: 'T/F', question_number: 39 },
  { text: 'I like to have a clear plan before I start a project.', scoredPole: 'J', dichotomy: 'J/P', question_number: 46 },
  { text: 'I keep an organised calendar and rarely miss deadlines.', scoredPole: 'J', dichotomy: 'J/P', question_number: 47 },
  { text: 'I enjoy keeping my options open rather than committing to a fixed plan.', scoredPole: 'P', dichotomy: 'J/P', question_number: 53 },
  { text: 'I like to adapt and improvise rather than follow a set schedule.', scoredPole: 'P', dichotomy: 'J/P', question_number: 54 },
];

export function buildFallbackPersonalityQuestions() {
  return selectPoleBalancedPersonalityQuestions(MBTI_FALLBACK_POOL, {
    stable: true,
    scoredPoleKey: 'scoredPole',
    dichotomyKey: 'dichotomy',
  }).map((q, i) => ({
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
    const scale = q.scale ?? inferQuestionScale(q.text);
    return {
      id: `fb${i + 1}`,
      text: q.text,
      dimension: q.dimension,
      reverseScored: Boolean(q.reverseScored),
      scale,
      options: optionsForScale(scale),
    };
  });
}
