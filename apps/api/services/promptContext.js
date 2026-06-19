import { demographicsPromptContext, demographicsLabels } from '@recharge/shared/demographics';
import {
  COACH_VOICE_RULES,
  LOCATION_RULES,
  locationContext,
} from '@recharge/shared/promptCoaching';
import { firstName } from '@recharge/shared/name';

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
