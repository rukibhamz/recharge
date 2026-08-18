import {
  buildFallbackOceanQuestions,
  OCEAN_IPIP_POOL,
} from './oceanQuestions.js';
import { selectBalancedOceanQuestions } from './oceanSelection.js';

/** @deprecated Use buildFallbackOceanQuestions for new assessments. */
export function buildFallbackPersonalityQuestions() {
  return buildFallbackOceanQuestions();
}

export { buildFallbackOceanQuestions, OCEAN_IPIP_POOL, selectBalancedOceanQuestions };
