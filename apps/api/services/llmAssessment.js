import { optionLabelForValue } from '@recharge/shared/questionOptions';
import { scoreMbti, formatMbtiType } from '@recharge/shared/mbtiScoring';
import {
  calibrateBurnout,
  scoreBurnoutByDimension,
} from '@recharge/shared/burnoutCalibration';
import { resolveBurnoutSummary } from '@recharge/shared/resultNarratives';
import { llmFeatures } from '../config/llm.js';
import {
  buildQuestionPromptContext,
  buildPersonalityInsightPromptContext,
  buildUserPromptContext,
} from './promptContext.js';
import { generateRecommendations } from './llm.js';
import {
  getBurnoutBankQuestions,
  getMbtiTypeProfile,
  getPersonalityBankQuestions,
  selectBurnoutAnchors,
  selectPersonalityAnchors,
} from './questionBank.js';
import { personalizeAnchorBatch, runAgentTask } from './assessmentAgent.js';
import { retrieveKnowledgeContext } from './knowledgeBank.js';

function bankFallbackEnabled() {
  const raw = process.env.LLM_ASSESSMENT_BANK_FALLBACK;
  if (raw === 'false' || raw === '0') return false;
  return true;
}

function questionsSupportMbtiScoring(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  return questions.every((q) => q.scoredPole ?? q.scored_pole);
}

function formatQaBlock(questions, answers) {
  return questions
    .map((q, i) => {
      const label = optionLabelForValue(q.options, answers[i]);
      return `Q${i + 1}: ${q.text}\nAnswer: ${label}`;
    })
    .join('\n\n');
}

function formatPersonalityQuestions(items) {
  return items.map((item, i) => ({
    id: `p${i + 1}`,
    bankId: item.anchor?.bankId ?? null,
    text: item.text,
    scoredPole: item.scoredPole ?? item.anchor?.scoredPole,
    dichotomy: item.dichotomy ?? item.anchor?.dichotomy,
    scale: 'agreement',
    options: item.anchor?.options ?? [],
  }));
}

function formatBurnoutQuestions(items) {
  return items.map((item, i) => ({
    id: `b${i + 1}`,
    bankId: item.anchor?.bankId ?? null,
    text: item.text,
    dimension: item.dimension ?? item.anchor?.dimension,
    dimensionName: item.anchor?.dimensionName ?? item.dimension,
    reverseScored: Boolean(item.reverseScored ?? item.anchor?.reverseScored),
    scale: item.scale ?? item.anchor?.scale,
    response_scale: item.scale ?? item.anchor?.scale,
    options: item.anchor?.options ?? [],
  }));
}

export function normalizePersonalityResult(parsed) {
  const typeCode = String(parsed.typeCode ?? parsed.type_code ?? 'INTJ')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4) || 'INTJ';
  const t = parsed.type ?? {};

  return {
    typeCode,
    type: {
      id: typeCode.toLowerCase(),
      code: typeCode,
      name: t.title ? `${typeCode} — ${t.title}` : typeCode,
      title: t.title ?? '',
      archetype: t.archetype ?? '',
      desc: t.desc ?? t.description ?? parsed.summary ?? '',
      strengths: t.strengths ?? '',
      growthAreas: t.growthAreas ?? t.growth_areas ?? '',
      icon: t.icon ?? '✨',
    },
    traits: Array.isArray(parsed.traits)
      ? parsed.traits.map((tr) => ({
          name: tr.name ?? '',
          pct: Math.min(100, Math.max(0, Number(tr.pct ?? 50))),
          poleA: tr.poleA ?? tr.pole_a ?? 'E',
          poleB: tr.poleB ?? tr.pole_b ?? 'I',
        }))
      : [],
    summary: parsed.summary ?? '',
  };
}

export function normalizeBurnoutResult(parsed) {
  const rawPct = Number(parsed?.pct ?? parsed?.score ?? 50);
  const pct = Number.isFinite(rawPct)
    ? Math.min(100, Math.max(0, Math.round(rawPct)))
    : 50;
  let cls = String(parsed?.cls ?? parsed?.level_class ?? '').toLowerCase();
  const levelMap = {
    healthy: 'Healthy Range',
    mild: 'Mild Burnout',
    moderate: 'Moderate Burnout',
    severe: 'Severe Burnout',
  };

  if (!['healthy', 'mild', 'moderate', 'severe'].includes(cls)) {
    if (pct >= 70) cls = 'severe';
    else if (pct >= 45) cls = 'moderate';
    else if (pct >= 25) cls = 'mild';
    else cls = 'healthy';
  }

  return {
    pct,
    rawPct: parsed?.rawPct != null ? Number(parsed.rawPct) : pct,
    level: parsed.level ?? levelMap[cls],
    cls,
    summary: parsed.summary ?? '',
    calibrationNote: parsed.calibrationNote ?? null,
    dimensions: parsed.dimensions ?? undefined,
  };
}

async function scorePersonalityFromBank(questions, answers, priorTypeCode = null) {
  const mbti = scoreMbti(answers, questions, { priorTypeCode });
  let profile = null;
  try {
    profile = await getMbtiTypeProfile(mbti.typeCode);
  } catch (err) {
    console.warn('MBTI profile load failed:', err.message);
  }
  const type = formatMbtiType(
    profile ?? {
      code: mbti.typeCode,
      title: '',
      archetype: '',
      description: '',
      strengths: '',
      growth_areas: '',
    },
  );
  const personality = normalizePersonalityResult({
    typeCode: mbti.typeCode,
    type: {
      title: type.title,
      archetype: type.archetype,
      desc: type.desc,
      strengths: type.strengths,
      growthAreas: type.growthAreas,
      icon: type.icon,
    },
    traits: mbti.traits,
    summary: type.desc,
  });
  return { personality, source: profile ? 'bank' : 'scoring' };
}

/** Anchored + agent-personalized personality questions (metadata locked). */
export async function generatePersonalityTest(userName, demographics) {
  if (!llmFeatures.personalityQuestions) {
    const { questions, source } = await getPersonalityBankQuestions();
    return { questions, count: questions.length, source };
  }

  const anchors = await selectPersonalityAnchors();
  const userContext = buildQuestionPromptContext({ userName, demographics });
  const { block: knowledgeContext } = await retrieveKnowledgeContext({
    kinds: ['question_pattern'],
    workContext: demographics?.workContext,
    queryText: 'personality interview statement',
  });

  try {
    const { items, source } = await personalizeAnchorBatch(
      'rewritePersonalityQuestion',
      anchors,
      { userContext, userName, workContext: demographics?.workContext, knowledgeContext },
    );
    const questions = formatPersonalityQuestions(items);
    return { questions, count: questions.length, source };
  } catch (err) {
    console.warn('Personality test agent failed:', err.message);
    if (!bankFallbackEnabled()) throw err;
    const { questions, source } = await getPersonalityBankQuestions();
    return { questions, count: questions.length, source };
  }
}

/**
 * Always score with scoreMbti when poles exist.
 * Agent writes narrative only around the locked type.
 * @param {string|null} [priorTypeCode] Previous type for unclear-band stability.
 */
export async function scorePersonalityTest(
  userName,
  demographics,
  questions,
  answers,
  priorTypeCode = null,
) {
  if (!questionsSupportMbtiScoring(questions)) {
    if (!bankFallbackEnabled()) {
      throw new Error('Personality questions missing scoring metadata (scoredPole).');
    }
    // Legacy LLM-invented questions without poles — cannot guarantee consistency
    console.warn('Personality questions lack scoredPole — falling back to bank-style if possible');
  }

  if (questionsSupportMbtiScoring(questions)) {
    const mbti = scoreMbti(answers, questions, { priorTypeCode });
    let profile = null;
    try {
      profile = await getMbtiTypeProfile(mbti.typeCode);
    } catch (err) {
      console.warn('MBTI profile load failed:', err.message);
    }

    const typeFormatted = formatMbtiType(
      profile ?? {
        code: mbti.typeCode,
        title: '',
        archetype: '',
        description: '',
        strengths: '',
        growth_areas: '',
      },
    );

    let narrative = {
      type: {
        title: typeFormatted.title,
        archetype: typeFormatted.archetype,
        desc: typeFormatted.desc,
        strengths: typeFormatted.strengths,
        growthAreas: typeFormatted.growthAreas,
        icon: typeFormatted.icon,
      },
      summary: typeFormatted.desc,
    };
    let source = profile ? 'scoring' : 'scoring';

    if (llmFeatures.personalityNarrative) {
      const insightContext = buildPersonalityInsightPromptContext({
        userName,
        demographics,
      });
      const qaBlock = formatQaBlock(questions, answers);
      const { result, source: narrativeSource } = await runAgentTask(
        'writePersonalityNarrative',
        {
          insightContext,
          qaBlock,
          typeCode: mbti.typeCode,
          traits: mbti.traits,
          typeProfile: profile ?? { code: mbti.typeCode, title: typeFormatted.title },
          knowledgeContext: (
            await retrieveKnowledgeContext({
              kinds: ['quality_rule', 'question_pattern'],
              typeCode: mbti.typeCode,
              queryText: `${mbti.typeCode} personality reflection`,
            })
          ).block,
        },
      );
      narrative = result;
      source = narrativeSource === 'bank-fallback' ? 'scoring' : narrativeSource;
    }

    const personality = normalizePersonalityResult({
      typeCode: mbti.typeCode,
      type: narrative.type,
      traits: mbti.traits,
      summary: narrative.summary,
    });

    return { personality, source };
  }

  return scorePersonalityFromBank(questions, answers, priorTypeCode);
}

/** Anchored burnout questions personalized with locked personality. */
export async function generateBurnoutTest(userName, demographics, personality) {
  if (!llmFeatures.burnoutQuestions) {
    const { questions, source } = await getBurnoutBankQuestions();
    return { questions, count: questions.length, source };
  }

  const anchors = await selectBurnoutAnchors();
  const userContext = buildQuestionPromptContext({ userName, demographics });
  const { block: knowledgeContext } = await retrieveKnowledgeContext({
    kinds: ['question_pattern'],
    typeCode: personality?.typeCode,
    workContext: demographics?.workContext,
    queryText: 'burnout check-in energy drain support',
  });

  try {
    const { items, source } = await personalizeAnchorBatch(
      'rewriteBurnoutQuestion',
      anchors,
      { userContext, userName, personality, workContext: demographics?.workContext, knowledgeContext },
    );
    const questions = formatBurnoutQuestions(items);
    return { questions, count: questions.length, source };
  } catch (err) {
    console.warn('Burnout test agent failed:', err.message);
    if (!bankFallbackEnabled()) throw err;
    const { questions, source } = await getBurnoutBankQuestions();
    return { questions, count: questions.length, source };
  }
}

/**
 * Deterministic raw + trait calibration, then agent narrative only.
 */
export async function scoreBurnoutTest(
  userName,
  demographics,
  personality,
  questions,
  answers,
) {
  const raw = scoreBurnoutByDimension(answers, questions);
  const calibrated = calibrateBurnout(raw, personality);

  let summary = resolveBurnoutSummary(
    {
      pct: calibrated.pct,
      cls: calibrated.cls,
      level: calibrated.level,
      dimensions: calibrated.dimensions,
      summary: null,
      calibrationNote: calibrated.calibrationNote,
    },
    personality,
  );
  let source = 'scoring';

  if (llmFeatures.burnoutNarrative) {
    const userContext = buildUserPromptContext({ userName, demographics });
    const qaBlock = formatQaBlock(questions, answers);
    const { result, source: narrativeSource } = await runAgentTask('writeBurnoutSummary', {
      userContext,
      qaBlock,
      personality,
      calibrated,
      knowledgeContext: (
        await retrieveKnowledgeContext({
          kinds: ['quality_rule', 'advice_pattern'],
          burnoutCls: calibrated.cls,
          typeCode: personality?.typeCode,
          queryText: `${calibrated.level} burnout explanation`,
        })
      ).block,
    });
    // Replace KPI-style or empty LLM output with structured narrative
    summary = resolveBurnoutSummary(
      {
        pct: calibrated.pct,
        cls: calibrated.cls,
        level: calibrated.level,
        dimensions: calibrated.dimensions,
        summary: result?.summary,
        calibrationNote: calibrated.calibrationNote,
      },
      personality,
    );
    source = narrativeSource === 'bank-fallback' ? 'scoring' : narrativeSource;
  }

  return {
    burnout: normalizeBurnoutResult({
      pct: calibrated.pct,
      rawPct: calibrated.rawPct,
      cls: calibrated.cls,
      level: calibrated.level,
      summary,
      calibrationNote: calibrated.calibrationNote,
      dimensions: calibrated.dimensions,
    }),
    source,
  };
}

export async function completeAssessment({
  userName,
  demographics,
  recoveryPreferences,
  personality,
  burnout,
  burnoutQuestions,
  personalityQuestions,
}) {
  const { recommendations, source } = await generateRecommendations(
    burnout.level,
    personality,
    userName,
    demographics,
    recoveryPreferences,
  );

  return {
    burnout,
    personality,
    recommendations,
    aiSource: source,
    burnoutQuestions,
    personalityQuestions,
  };
}
