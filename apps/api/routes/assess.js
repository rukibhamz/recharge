import { Router } from 'express';
import { validateAnswersForQuestions } from '@recharge/shared/scoring';
import { isValidName, sanitizeName } from '@recharge/shared/name';
import {
  demographicsLabels,
  isValidDemographics,
  sanitizeDemographics,
} from '@recharge/shared/demographics';
import {
  isValidRecoveryPreferences,
  sanitizeRecoveryPreferences,
} from '@recharge/shared/recoveryPreferences';
import { teaseRecoveryRoadmap } from '@recharge/shared/recoveryRoadmap';
import { optionalAuth } from '../middleware/requireAuth.js';
import { saveSession, getLatestPersonalityTypeForUser } from '../services/sessions.js';
import { ingestAssessmentKnowledge } from '../services/knowledgeBank.js';
import {
  completeAssessment,
  generateBurnoutTest,
  generatePersonalityTest,
  normalizeBurnoutResult,
  scoreBurnoutTest,
  scorePersonalityTest,
} from '../services/llmAssessment.js';

const router = Router();

function sanitizePriorTypeCode(value) {
  const code = String(value ?? '')
    .toUpperCase()
    .replace(/[^EISNTFJP]/g, '');
  return code.length === 4 ? code : null;
}

async function resolvePriorTypeCode(req, bodyPrior) {
  const fromBody = sanitizePriorTypeCode(bodyPrior);
  if (req.user?.id) {
    const { typeCode } = await getLatestPersonalityTypeForUser(req.user.id);
    const fromAccount = sanitizePriorTypeCode(typeCode);
    if (fromAccount) return fromAccount;
  }
  return fromBody;
}

function parseQuestions(body) {
  return Array.isArray(body?.questions) ? body.questions : body?.personalityQuestions ?? body?.burnoutQuestions ?? [];
}

router.post('/personality/test', optionalAuth, async (req, res) => {
  const name = sanitizeName(req.body?.userName);
  const demographics = sanitizeDemographics(req.body?.demographics);

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }
  if (!isValidDemographics(demographics)) {
    return res.status(400).json({ error: 'A complete profile is required.' });
  }

  try {
    const { questions, count, source } = await generatePersonalityTest(name, demographics);
    res.json({ questions, count, source });
  } catch (err) {
    console.error('Personality test generation failed:', err.message);
    res.status(503).json({ error: err.message || 'Could not generate personality test.' });
  }
});

router.post('/personality/score', optionalAuth, async (req, res) => {
  const name = sanitizeName(req.body?.userName);
  const demographics = sanitizeDemographics(req.body?.demographics);
  const { answers, questions } = req.body ?? {};
  const questionList = parseQuestions({ questions });

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }

  const check = validateAnswersForQuestions(answers, questionList);
  if (!check.valid) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const priorTypeCode = await resolvePriorTypeCode(req, req.body?.priorTypeCode);
    const { personality, source } = await scorePersonalityTest(
      name,
      demographics,
      questionList,
      answers,
      priorTypeCode,
    );
    res.json({ personality, source });
  } catch (err) {
    console.error('Personality scoring failed:', err.message);
    res.status(503).json({ error: err.message || 'Could not analyze personality responses.' });
  }
});

router.post('/burnout/test', optionalAuth, async (req, res) => {
  const name = sanitizeName(req.body?.userName);
  const demographics = sanitizeDemographics(req.body?.demographics);
  const { personality } = req.body ?? {};

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }
  if (!isValidDemographics(demographics)) {
    return res.status(400).json({ error: 'A complete profile is required.' });
  }
  if (!personality?.typeCode) {
    return res.status(400).json({ error: 'Personality result is required first.' });
  }

  try {
    const { questions, count, source } = await generateBurnoutTest(name, demographics, personality);
    res.json({ questions, count, source });
  } catch (err) {
    console.error('Burnout test generation failed:', err.message);
    res.status(503).json({ error: err.message || 'Could not generate burnout test.' });
  }
});

router.post('/complete', optionalAuth, async (req, res) => {
  const name = sanitizeName(req.body?.userName);
  const demographics = sanitizeDemographics(req.body?.demographics);
  const {
    personality,
    recoveryPreferences: rawRecoveryPreferences,
    personalityAnswers,
    personalityQuestions,
    burnoutAnswers,
    burnoutQuestions,
  } = req.body ?? {};
  const recoveryPreferences = sanitizeRecoveryPreferences(rawRecoveryPreferences);

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }
  if (!isValidDemographics(demographics)) {
    return res.status(400).json({ error: 'A complete profile is required.' });
  }
  if (!isValidRecoveryPreferences(recoveryPreferences)) {
    return res.status(400).json({ error: 'Recovery preferences are required.' });
  }
  if (!personality?.traits?.length && !personality?.ocean?.scores) {
    return res.status(400).json({ error: 'Personality result is required.' });
  }

  const burnoutCheck = validateAnswersForQuestions(burnoutAnswers, burnoutQuestions);
  if (!burnoutCheck.valid) {
    return res.status(400).json({ error: burnoutCheck.error });
  }

  try {
    const { burnout, source: burnoutSource } = await scoreBurnoutTest(
      name,
      demographics,
      personality,
      burnoutQuestions,
      burnoutAnswers,
    );

    const { recommendations, aiSource, personality: enrichedPersonality, recoveryRoadmap } = await completeAssessment({
      userName: name,
      demographics,
      recoveryPreferences,
      personality,
      burnout,
      burnoutQuestions,
      personalityQuestions,
    });

    const safeBurnout = normalizeBurnoutResult(burnout);
    const profileForStorage = { ...demographics, recoveryPreferences };

    const { sessionId, shareToken, persisted, linked, persistError, reused } = await saveSession({
      displayName: name,
      demographics: profileForStorage,
      burnout: safeBurnout,
      personality: enrichedPersonality ?? personality,
      recommendations,
      recoveryRoadmap,
      userId: req.user?.id,
      email: req.user?.email,
    });

    if (!reused) {
      ingestAssessmentKnowledge({
        burnout: safeBurnout,
        personality: enrichedPersonality ?? personality,
        burnoutQuestions,
        burnoutAnswers,
        personalityQuestions,
        recommendations,
        workContext: demographics?.workContext,
        aiSource,
      });
    }

    const signedIn = Boolean(linked);
    const publicRoadmap = recoveryRoadmap
      ? signedIn
        ? recoveryRoadmap
        : teaseRecoveryRoadmap(recoveryRoadmap)
      : null;
    const publicRecommendations = signedIn
      ? recommendations
      : (publicRoadmap?.phases?.[0]?.steps ?? recommendations).slice(0, 4).map((s) => ({
          icon: s.icon,
          when: s.when,
          title: s.title,
          tip: s.tip,
        }));

    res.json({
      sessionId,
      shareToken,
      persisted,
      persistError: persistError ?? null,
      linked: signedIn,
      displayName: name,
      profileContext: demographicsLabels(demographics),
      burnout: safeBurnout,
      personality: enrichedPersonality ?? personality,
      recommendations: publicRecommendations,
      recoveryRoadmap: publicRoadmap,
      roadmapLocked: Boolean(publicRoadmap?.guestPreview),
      aiSource: aiSource ?? burnoutSource,
    });
  } catch (err) {
    console.error('Assessment completion failed:', err.message);
    res.status(503).json({ error: err.message || 'Could not complete assessment.' });
  }
});

/** @deprecated Use /personality/test → /personality/score → /burnout/test → /complete */
router.post('/', optionalAuth, async (req, res) => {
  res.status(410).json({
    error: 'This endpoint is deprecated. Use the step-by-step assessment flow.',
  });
});

export default router;
