import { llmFeatures } from '../config/llm.js';
import { personalityRecoveryProfile } from '@recharge/shared/promptCoaching';
import { generateJson, getLastLlmProvider, hasAnyLlmProvider } from './llmProvider.js';
import { buildUserPromptContext } from './promptContext.js';
import { COACH_VOICE_RULES, LOCATION_RULES } from '@recharge/shared/promptCoaching';

export const STATIC_FALLBACK = {
  'Healthy Range': [
    { icon: '🌿', title: 'Protect your rhythm', tip: 'Block one non-negotiable recovery slot each day this week.' },
    { icon: '🚶', title: 'Move with intention', tip: 'Take a ten-minute walk without your phone after lunch.' },
    { icon: '📝', title: 'Name what works', tip: 'List three habits that keep you steady and keep doing them.' },
    { icon: '🤝', title: 'Stay connected', tip: 'Reach out to one person who helps you feel grounded.' },
  ],
  'Mild Burnout': [
    { icon: '🛑', title: 'Pause one commitment', tip: 'Drop or defer one non-essential task before Friday.' },
    { icon: '😴', title: 'Guard your sleep', tip: 'Set a screens-off time thirty minutes before bed tonight.' },
    { icon: '🧘', title: 'Reset between tasks', tip: 'Take three slow breaths before switching to your next task.' },
    { icon: '☀️', title: 'Morning buffer', tip: 'Start tomorrow with fifteen quiet minutes before messages.' },
  ],
  'Moderate Burnout': [
    { icon: '📅', title: 'Schedule recovery', tip: 'Block thirty minutes daily for rest with no productivity goal.' },
    { icon: '🔕', title: 'Reduce input noise', tip: 'Turn off non-urgent notifications for the next forty-eight hours.' },
    { icon: '💬', title: 'Ask for support', tip: 'Tell one trusted person you are depleted and need help.' },
    { icon: '🎯', title: 'Shrink the list', tip: 'Pick only three priorities for this week and let the rest wait.' },
  ],
  'Severe Burnout': [
    { icon: '🆘', title: 'Seek real support', tip: 'Talk to a manager, coach, or professional about your load this week.' },
    { icon: '🛑', title: 'Stop adding', tip: 'Say no to one new request before taking on anything else.' },
    { icon: '🏠', title: 'Minimum viable day', tip: 'Define the smallest version of a good day and aim for only that.' },
    { icon: '💤', title: 'Recovery first', tip: 'Treat rest as required maintenance, not a reward you earn.' },
  ],
};

function buildPrompt(burnoutLevel, personality, userName, demographics) {
  const userContext = buildUserPromptContext({ userName, demographics });
  const recoveryProfile = personalityRecoveryProfile(personality);

  return `You are a culturally aware wellbeing coach speaking privately to one person.

${userContext}

${recoveryProfile}

Burnout level: ${burnoutLevel}

Write exactly 4 recovery recommendations as JSON array.
Rules:
- Match their personality type for HOW they recharge (social vs solo, lively vs calm venues, practical vs reflective)
- Use their city ONLY if provided; never invent cities
- Specific enough to act on this week — not generic wellness advice
- Never mention app or product names

${COACH_VOICE_RULES}
${LOCATION_RULES}

Return JSON only: [{"icon":"emoji","title":"max 5 words","tip":"max 32 words"}]`;
}

function normalizeRecommendations(parsed) {
  if (Array.isArray(parsed)) return parsed.slice(0, 4);
  if (parsed?.recommendations && Array.isArray(parsed.recommendations)) {
    return parsed.recommendations.slice(0, 4);
  }
  throw new Error('Invalid recommendation format');
}

export async function generateRecommendations(
  burnoutLevel,
  personality,
  userName = null,
  demographics = null,
) {
  const fallback = STATIC_FALLBACK[burnoutLevel] ?? STATIC_FALLBACK['Moderate Burnout'];

  if (!llmFeatures.recommendations || !(await hasAnyLlmProvider())) {
    return { recommendations: fallback, source: 'static' };
  }

  try {
    const parsed = await generateJson(
      buildPrompt(burnoutLevel, personality, userName, demographics),
    );
    const recommendations = normalizeRecommendations(parsed);
    return { recommendations, source: getLastLlmProvider() ?? 'llm' };
  } catch (err) {
    console.error('Recommendations LLM failed:', err.message);
    return { recommendations: fallback, source: 'static' };
  }
}
