import { llmFeatures } from '../config/llm.js';
import { personalityRecoveryProfile } from '@recharge/shared/promptCoaching';
import { recoveryPreferencesPromptContext } from '@recharge/shared/recoveryPreferences';
import {
  hasDisplayableRecommendations,
  normalizeRecommendationsList,
} from '@recharge/shared/recommendations';
import { generateJson, getLastLlmProvider, hasAnyLlmProvider } from './llmProvider.js';
import { buildUserPromptContext } from './promptContext.js';
import { COACH_VOICE_RULES, LOCATION_RULES } from '@recharge/shared/promptCoaching';
import { retrieveKnowledgeContext } from './knowledgeBank.js';

export const STATIC_FALLBACK = {
  'Healthy Range': [
    {
      icon: '🌿',
      when: 'Today',
      title: 'Keep one recovery slot',
      tip: 'Block one non-negotiable recovery slot today. Put it on your calendar and protect it the way you would a meeting.',
    },
    {
      icon: '🚶',
      when: 'This week',
      title: 'Move without your phone',
      tip: 'Take a ten-minute walk after lunch without your phone three times this week. Notice how your energy shifts afterward.',
    },
    {
      icon: '📝',
      when: 'Protect energy',
      title: 'Name what works',
      tip: 'List three habits that keep you steady. Keep doing them on purpose this week instead of waiting until you crash.',
    },
    {
      icon: '🤝',
      when: 'This week',
      title: 'Stay connected',
      tip: 'Reach out to one person who helps you feel grounded. Suggest a specific time this week, even if it is short.',
    },
  ],
  'Mild Burnout': [
    {
      icon: '🛑',
      when: 'Today',
      title: 'Pause one commitment',
      tip: 'Drop or defer one non-essential task before the end of today. Tell the relevant person what you are moving, then stop negotiating with yourself.',
    },
    {
      icon: '😴',
      when: 'Tonight',
      title: 'Guard your sleep',
      tip: 'Set a screens-off time thirty minutes before bed tonight. Put the phone outside the bedroom if you can.',
    },
    {
      icon: '🧘',
      when: 'This week',
      title: 'Reset between tasks',
      tip: 'Before each big switch this week, take three slow breaths and name the next task out loud. Keep transitions short and intentional.',
    },
    {
      icon: '☀️',
      when: 'Protect energy',
      title: 'Morning buffer',
      tip: 'Start tomorrow with fifteen quiet minutes before messages. No inbox until that buffer is done.',
    },
  ],
  'Moderate Burnout': [
    {
      icon: '📅',
      when: 'Today',
      title: 'Schedule recovery',
      tip: 'Block thirty minutes today for rest with no productivity goal. Treat it as required maintenance, not optional.',
    },
    {
      icon: '🔕',
      when: 'This week',
      title: 'Reduce input noise',
      tip: 'Turn off non-urgent notifications for the next forty-eight hours. Check messages in two short windows only.',
    },
    {
      icon: '🎯',
      when: 'Protect energy',
      title: 'Shrink the list',
      tip: 'Pick only three priorities for this week and write them where you will see them. Let the rest wait or get deferred.',
    },
    {
      icon: '💬',
      when: 'This week',
      title: 'Ask for support',
      tip: 'Tell one trusted person you are depleted. Ask for one concrete form of help before Friday.',
    },
  ],
  'Severe Burnout': [
    {
      icon: '🆘',
      when: 'Today',
      title: 'Seek real support',
      tip: 'Talk today to a manager, coach, trusted person, or professional about your load. Ask for one concrete change this week.',
    },
    {
      icon: '🛑',
      when: 'This week',
      title: 'Stop adding',
      tip: 'Say no to one new request before taking on anything else. Use a short script: "I cannot take that on right now."',
    },
    {
      icon: '🏠',
      when: 'Protect energy',
      title: 'Minimum viable day',
      tip: 'Define the smallest version of a good day and aim for only that. Everything beyond it is optional until you stabilize.',
    },
    {
      icon: '💤',
      when: 'Tonight',
      title: 'Recovery first',
      tip: 'Choose one recovery action for tonight, such as earlier sleep or a quiet hour. Do it before extra work or scrolling.',
    },
  ],
};

function buildPrompt(burnoutLevel, personality, userName, demographics, recoveryPreferences, knowledgeContext = '') {
  const userContext = buildUserPromptContext({ userName, demographics });
  const recoveryProfile = personalityRecoveryProfile(personality);
  const explicitRecoveryStyle = recoveryPreferencesPromptContext(recoveryPreferences);
  const learned = knowledgeContext ? `\n${knowledgeContext}\n` : '';

  return `You are a culturally aware wellbeing coach speaking privately to one person.

${userContext}
${learned}

${recoveryProfile}

${explicitRecoveryStyle}

Burnout level: ${burnoutLevel}

Write exactly 4 recovery recommendations that form a practical this-week roadmap.
Order them as a sequence:
1) Today — one immediate action they can do within 24 hours
2) This week — one load, boundary, or schedule change
3) Protect energy — one habit that reduces drain
4) Support or reset — one social, environment, or longer cushion step

Rules:
- Each tip must be a concrete action with when/how (timebox, place, or script), not a vague wellness slogan
- Title should sound like an action ("Mute work chat after 7pm"), not a theme ("Protect your rhythm")
- Match their personality type for HOW they recharge (social vs solo, lively vs calm venues, practical vs reflective)
- If stated unwind preferences are present, prioritize them over personality assumptions when they conflict
- Use their city ONLY if provided; never invent cities
- Never mention app or product names
- Avoid generic lines like "practice self-care", "be mindful", or "listen to your body" without a specific next step

${COACH_VOICE_RULES}
${LOCATION_RULES}

Return JSON only as an object with a recommendations array:
{"recommendations":[{"icon":"emoji","when":"Today|Tonight|This week|Protect energy","title":"max 6 words","tip":"1-2 concrete sentences, max 55 words"}]}
Each item MUST include non-empty icon, when, title, and tip fields.`;
}

function normalizeRecommendations(parsed, fallback) {
  const recommendations = normalizeRecommendationsList(parsed, fallback);
  if (!recommendations.length || !hasDisplayableRecommendations(recommendations)) {
    throw new Error('Invalid recommendation format');
  }
  return recommendations;
}

export async function generateRecommendations(
  burnoutLevel,
  personality,
  userName = null,
  demographics = null,
  recoveryPreferences = null,
) {
  const fallback = STATIC_FALLBACK[burnoutLevel] ?? STATIC_FALLBACK['Moderate Burnout'];

  if (!llmFeatures.recommendations || !(await hasAnyLlmProvider())) {
    return { recommendations: fallback, source: 'static' };
  }

  try {
    const level = String(burnoutLevel || '').toLowerCase();
    const burnoutCls = ['severe', 'moderate', 'mild', 'healthy'].find((c) => level.includes(c)) || '';
    const { block } = await retrieveKnowledgeContext({
      kinds: ['advice_pattern', 'quality_rule'],
      burnoutCls,
      typeCode: personality?.typeCode,
      workContext: demographics?.workContext,
      queryText: `${burnoutLevel} ${personality?.typeCode || ''} recovery`,
    });
    const parsed = await generateJson(
      buildPrompt(burnoutLevel, personality, userName, demographics, recoveryPreferences, block),
    );
    const recommendations = normalizeRecommendations(parsed, fallback);
    return { recommendations, source: getLastLlmProvider() ?? 'llm' };
  } catch (err) {
    console.error('Recommendations LLM failed:', err.message);
    return { recommendations: fallback, source: 'static' };
  }
}
