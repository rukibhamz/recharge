import {
  demographicsPromptContext,
  demographicsQuestionContext,
  demographicsLabels,
} from '@recharge/shared/demographics';
import {
  COACH_VOICE_RULES,
  LOCATION_RULES,
  PERSONALITY_INSIGHT_RULES,
  QUESTION_NO_LOCATION_RULES,
  locationContext,
} from '@recharge/shared/promptCoaching';
import { firstName } from '@recharge/shared/name';

/** Profile context for recommendations and scoring — may use location. */
export function buildUserPromptContext({ userName, demographics }) {
  const name = firstName(userName);
  const labels = demographicsLabels(demographics);
  const parts = [];

  if (name) parts.push(`Name: ${name}`);
  parts.push(demographicsPromptContext(demographics));
  if (labels) parts.push(locationContext({ ...demographics, countryLabel: labels.country }));

  parts.push(COACH_VOICE_RULES);
  parts.push(LOCATION_RULES);

  return parts.join('\n\n');
}

/** Personality scoring — therapist-style read; no place names in output. */
export function buildPersonalityInsightPromptContext({ userName, demographics }) {
  const name = firstName(userName);
  const parts = [];

  if (name) parts.push(`Name: ${name}`);
  parts.push(demographicsQuestionContext(demographics));
  parts.push(COACH_VOICE_RULES);
  parts.push(PERSONALITY_INSIGHT_RULES);

  return parts.join('\n\n');
}

/** Profile context for question generation — no place names in output. */
export function buildQuestionPromptContext({ userName, demographics }) {
  const name = firstName(userName);
  const parts = [];

  if (name) parts.push(`Name: ${name}`);
  parts.push(demographicsQuestionContext(demographics));
  parts.push(COACH_VOICE_RULES);
  parts.push(QUESTION_NO_LOCATION_RULES);

  return parts.join('\n\n');
}
