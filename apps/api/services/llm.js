import { llmFeatures } from '../config/llm.js';
import { personalityRecoveryProfile } from '@recharge/shared/promptCoaching';
import { recoveryPreferencesPromptContext } from '@recharge/shared/recoveryPreferences';
import {
  hasDisplayableRecommendations,
  normalizeRecommendationsList,
} from '@recharge/shared/recommendations';
import {
  buildRecoveryRoadmap,
  mergeRoadmapCopy,
  roadmapToRecommendations,
} from '@recharge/shared/recoveryRoadmap';
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
- If protocol rules are listed above, at least 2 recommendations must extend those protocols (same trigger situation)
- Match their OCEAN profile for HOW they recharge (social vs solo, structure vs flexibility)
- If stated unwind preferences are present, prioritize them over personality assumptions when they conflict
- Use their city ONLY if provided; never invent cities
- Never mention app or product names
- FORBIDDEN: "take a break", "meditate", "drink water", "practice self-care", "be mindful" without a specific constraint

${COACH_VOICE_RULES}
${LOCATION_RULES}

Return JSON only as an object with a recommendations array:
{"recommendations":[{"icon":"emoji","when":"Today|Tonight|This week|Protect energy","title":"max 6 words","tip":"1-2 concrete sentences, max 55 words"}]}
Each item MUST include non-empty icon, when, title, and tip fields.`;
}

function skeletonPhaseBlock(roadmap) {
  return (roadmap.phases ?? [])
    .map((phase) => {
      const steps = (phase.steps ?? [])
        .map((s, i) => {
          const lines = [`    ${i + 1}. [${s.when}] ${s.title}`, `       what: ${s.tip}`];
          if (s.how) lines.push(`       how: ${s.how}`);
          if (s.why) lines.push(`       why: ${s.why}`);
          if (s.script) lines.push(`       script: ${s.script}`);
          if (s.check) lines.push(`       done_when: ${s.check}`);
          return lines.join('\n');
        })
        .join('\n');
      return `- id: ${phase.id}\n  label: ${phase.label}\n  title: ${phase.title}\n  focus: ${phase.focus}\n  outcome: ${phase.outcome || ''}\n  steps:\n${steps}`;
    })
    .join('\n');
}

function buildRoadmapPrompt(burnout, personality, userName, demographics, recoveryPreferences, skeleton, knowledgeContext = '') {
  const userContext = buildUserPromptContext({ userName, demographics });
  const recoveryProfile = personalityRecoveryProfile(personality);
  const explicitRecoveryStyle = recoveryPreferencesPromptContext(recoveryPreferences);
  const learned = knowledgeContext ? `\n${knowledgeContext}\n` : '';
  const phaseIds = skeleton.phases.map((p) => p.id).join(', ');

  return `You are a culturally aware wellbeing coach writing a ${skeleton.horizonDays}-day recovery plan for one person.

${userContext}
${learned}

${recoveryProfile}

${explicitRecoveryStyle}

Burnout level: ${burnout?.level || skeleton.cls} (${skeleton.horizonLabel})
Plan intent: ${skeleton.intent}

LOCKED phase skeleton (keep every phase id and the same number of steps). Personalise the copy for THIS person. Expand detail. Do not shorten.

${skeletonPhaseBlock(skeleton)}

Rules:
- Keep every phase id exactly: ${phaseIds}
- Keep the same number of steps in each phase, in the same order
- This is a protocol, not four tips. Keep how / why / script / done_when on every step
- tip = what to do (2-4 sentences, specific)
- how = numbered procedure (1) (2) (3)
- why = one or two sentences tying the step to THEIR trait trap or burnout load
- script = a sendable or speakable line when the step involves another person; omit only if truly solo
- check = observable "done when" test
- outcome = what this phase looks like when it worked
- If protocol rules appear in the skeleton, keep them as constraints. Do not replace them with vague wellness
- Title should sound like an action ("Mute work chat after 7pm"), max 8 words
- Match OCEAN / recovery preferences for HOW they recharge
- Use their city ONLY if provided; never invent cities
- Never mention app or product names
- FORBIDDEN: "take a break", "meditate", "drink water", "practice self-care", "be mindful" without a specific constraint
- Do not compress. If the skeleton is detailed, your rewrite must stay at least as detailed

${COACH_VOICE_RULES}
${LOCATION_RULES}

Return JSON only:
{"intent":"2-3 sentences","phases":[{"id":"${skeleton.phases[0]?.id || 'stabilize'}","title":"...","focus":"...","outcome":"...","steps":[{"icon":"emoji","when":"...","title":"...","tip":"...","how":"...","why":"...","script":"...","check":"..."}]}]}`;
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
  burnout = null,
) {
  const skeleton = buildRecoveryRoadmap({
    burnout: burnout ?? { level: burnoutLevel, cls: String(burnoutLevel || '').toLowerCase() },
    personality,
    psychometricProfile: personality?.psychometricProfile,
    recoveryPreferences,
  });
  const fallbackCards =
    STATIC_FALLBACK[burnoutLevel] ??
    STATIC_FALLBACK['Moderate Burnout'] ??
    roadmapToRecommendations(skeleton);

  if (!llmFeatures.recommendations || !(await hasAnyLlmProvider())) {
    return {
      recommendations: roadmapToRecommendations(skeleton),
      recoveryRoadmap: skeleton,
      source: 'static',
    };
  }

  try {
    const level = String(burnoutLevel || '').toLowerCase();
    const burnoutCls = ['severe', 'moderate', 'mild', 'healthy'].find((c) => level.includes(c)) || skeleton.cls;
    const { block } = await retrieveKnowledgeContext({
      kinds: ['advice_pattern', 'quality_rule'],
      burnoutCls,
      typeCode: personality?.typeCode,
      workContext: demographics?.workContext,
      queryText: `${burnoutLevel} ${personality?.typeCode || ''} ${skeleton.horizonLabel} recovery`,
    });
    const parsed = await generateJson(
      buildRoadmapPrompt(
        burnout ?? { level: burnoutLevel },
        personality,
        userName,
        demographics,
        recoveryPreferences,
        skeleton,
        block,
      ),
    );
    const recoveryRoadmap = mergeRoadmapCopy(skeleton, parsed);
    const recommendations = roadmapToRecommendations(recoveryRoadmap);
    if (!hasDisplayableRecommendations(recommendations)) {
      throw new Error('Roadmap copy was empty');
    }
    return { recommendations, recoveryRoadmap, source: getLastLlmProvider() ?? 'llm' };
  } catch (err) {
    console.error('Recommendations LLM failed:', err.message);
    try {
      const parsed = await generateJson(
        buildPrompt(burnoutLevel, personality, userName, demographics, recoveryPreferences, ''),
      );
      const recommendations = normalizeRecommendations(parsed, fallbackCards);
      return {
        recommendations,
        recoveryRoadmap: skeleton,
        source: getLastLlmProvider() ?? 'llm',
      };
    } catch {
      return {
        recommendations: roadmapToRecommendations(skeleton),
        recoveryRoadmap: skeleton,
        source: 'static',
      };
    }
  }
}
