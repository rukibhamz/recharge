import { Router } from 'express';
import { maxAnswerValue, scoreBurnout, validateAnswers } from '@recharge/shared/scoring';
import { scoreMbti, formatMbtiType } from '@recharge/shared/mbtiScoring';
import { isValidName, sanitizeName, firstName } from '@recharge/shared/name';
import { generateRecommendations } from '../services/llm.js';
import { saveSession } from '../services/sessions.js';
import { getMbtiTypeProfile } from '../services/questionBank.js';
import { optionalAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/', optionalAuth, async (req, res) => {
  const {
    userName,
    burnoutAnswers,
    personalityAnswers,
    burnoutQuestions,
    personalityQuestions,
  } = req.body ?? {};

  const name = sanitizeName(userName);
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }

  const burnoutMax = maxAnswerValue(burnoutQuestions);
  const burnoutCheck = validateAnswers(burnoutAnswers, 12, burnoutMax);
  if (!burnoutCheck.valid) {
    return res.status(400).json({ error: burnoutCheck.error });
  }

  const personalityMax = maxAnswerValue(personalityQuestions);
  const personalityCheck = validateAnswers(personalityAnswers, 12, personalityMax);
  if (!personalityCheck.valid) {
    return res.status(400).json({ error: personalityCheck.error });
  }

  const burnout = scoreBurnout(burnoutAnswers, burnoutQuestions);
  const mbti = scoreMbti(personalityAnswers, personalityQuestions);
  const profile = await getMbtiTypeProfile(mbti.typeCode);
  const personality = {
    typeCode: mbti.typeCode,
    type: formatMbtiType(
      profile ?? {
        code: mbti.typeCode,
        title: mbti.typeCode,
        archetype: '',
        description: '',
        strengths: '',
        growth_areas: '',
      },
    ),
    traits: mbti.traits,
    poles: mbti.poles,
  };

  const { recommendations, source } = await generateRecommendations(
    burnout.level,
    personality.type,
    firstName(name),
  );

  const { sessionId, shareToken, persisted, linked } = await saveSession({
    displayName: name,
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
    burnout,
    personality,
    recommendations,
    aiSource: source,
  });
});

export default router;
