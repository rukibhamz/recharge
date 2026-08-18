import {
  BURNOUT_QUESTIONS,
  inferQuestionScale,
  optionsForScale,
} from './questions.js';
import {
  buildFallbackOceanQuestions,
  OCEAN_IPIP_POOL,
} from './oceanQuestions.js';
import { selectBalancedOceanQuestions } from './oceanSelection.js';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** @deprecated Use buildFallbackOceanQuestions for new assessments. */
export function buildFallbackPersonalityQuestions() {
  return buildFallbackOceanQuestions();
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

export { buildFallbackOceanQuestions, OCEAN_IPIP_POOL, selectBalancedOceanQuestions };
