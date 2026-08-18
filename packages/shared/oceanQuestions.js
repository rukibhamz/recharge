import { AGREEMENT_OPTIONS } from './questions.js';
import { selectBalancedOceanQuestions } from './oceanSelection.js';

/**
 * IPIP-style Big Five items (public-domain stems), phrased as first-person agreement.
 * scoredTrait: O/C/E/A/N; reverseScored when agreement indicates LOW on the trait.
 */
export const OCEAN_IPIP_POOL = [
  { text: 'I have a vivid imagination.', scoredTrait: 'O', reverseScored: false, question_number: 1 },
  { text: 'I am not interested in abstract ideas.', scoredTrait: 'O', reverseScored: true, question_number: 2 },
  { text: 'I am full of ideas.', scoredTrait: 'O', reverseScored: false, question_number: 3 },
  { text: 'I have difficulty understanding abstract concepts.', scoredTrait: 'O', reverseScored: true, question_number: 4 },
  { text: 'I am always prepared.', scoredTrait: 'C', reverseScored: false, question_number: 5 },
  { text: 'I leave my belongings around.', scoredTrait: 'C', reverseScored: true, question_number: 6 },
  { text: 'I pay attention to details.', scoredTrait: 'C', reverseScored: false, question_number: 7 },
  { text: 'I make a mess of things.', scoredTrait: 'C', reverseScored: true, question_number: 8 },
  { text: 'I am the life of the party.', scoredTrait: 'E', reverseScored: false, question_number: 9 },
  { text: 'I do not talk a lot.', scoredTrait: 'E', reverseScored: true, question_number: 10 },
  { text: 'I feel comfortable around people.', scoredTrait: 'E', reverseScored: false, question_number: 11 },
  { text: 'I keep in the background.', scoredTrait: 'E', reverseScored: true, question_number: 12 },
  { text: 'I sympathize with others feelings.', scoredTrait: 'A', reverseScored: false, question_number: 13 },
  { text: 'I am not really interested in other peoples problems.', scoredTrait: 'A', reverseScored: true, question_number: 14 },
  { text: 'I feel others emotions.', scoredTrait: 'A', reverseScored: false, question_number: 15 },
  { text: 'I am not interested in other people.', scoredTrait: 'A', reverseScored: true, question_number: 16 },
  { text: 'I get stressed out easily.', scoredTrait: 'N', reverseScored: false, question_number: 17 },
  { text: 'I am relaxed most of the time.', scoredTrait: 'N', reverseScored: true, question_number: 18 },
  { text: 'I worry about things.', scoredTrait: 'N', reverseScored: false, question_number: 19 },
  { text: 'I seldom feel blue.', scoredTrait: 'N', reverseScored: true, question_number: 20 },
];

export function buildFallbackOceanQuestions() {
  return selectBalancedOceanQuestions(OCEAN_IPIP_POOL, { stable: true }).map((q, i) => ({
    id: `fo${i + 1}`,
    text: q.text,
    scoredTrait: q.scoredTrait,
    reverseScored: Boolean(q.reverseScored),
    scale: 'agreement',
    options: AGREEMENT_OPTIONS,
  }));
}
