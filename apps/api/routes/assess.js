import { Router } from 'express';
import { validateAnswersForQuestions } from '@recharge/shared/scoring';
import { isValidName, sanitizeName } from '@recharge/shared/name';
import {
  demographicsLabels,
  isValidDemographics,
  sanitizeDemographics,
} from '@recharge/shared/demographics';
import { optionalAuth } from '../middleware/requireAuth.js';
import { saveSession } from '../services/sessions.js';
import {
  completeAssessment,
  generateBurnoutTest,
  generatePersonalityTest,
  scoreBurnoutTest,
  scorePersonalityTest,
} from '../services/llmAssessment.js';

const router = Router();

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
    const { personality, source } = await scorePersonalityTest(
      name,
      demographics,
      questionList,
      answers,
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
    personalityAnswers,
    personalityQuestions,
    burnoutAnswers,
    burnoutQuestions,
  } = req.body ?? {};

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }
  if (!isValidDemographics(demographics)) {
    return res.status(400).json({ error: 'A complete profile is required.' });
  }
  if (!personality?.typeCode) {
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

    const { recommendations, aiSource } = await completeAssessment({
      userName: name,
      demographics,
      personality,
      burnout,
      burnoutQuestions,
      personalityQuestions,
    });

    const { sessionId, shareToken, persisted, linked } = await saveSession({
      displayName: name,
      demographics,
      burnout,
      personality,
      recommendations,
      userId: req.user?.id,
      email: req.user?.email,
    });

    res.json({
      sessionId,
      shareToken,
      persisted,
      linked: Boolean(linked),
      displayName: name,
      profileContext: demographicsLabels(demographics),
      burnout,
      personality,
      recommendations,
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
