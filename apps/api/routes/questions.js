import { Router } from 'express';
import {
  generateNextBurnoutQuestion,
  generateBurnoutQuestions,
  generatePersonalityQuestions,
} from '../services/questionGenerator.js';
import { maxAnswerValue, validateAnswers } from '@recharge/shared/scoring';
import { isValidName, sanitizeName } from '@recharge/shared/name';
import { isValidDemographics, sanitizeDemographics } from '@recharge/shared/demographics';

const router = Router();

function parseThread(body) {
  const thread = body?.thread ?? body?.conversation ?? [];
  return Array.isArray(thread) ? thread : [];
}

router.post('/burnout/next', async (req, res) => {
  const { personalityAnswers, personalityQuestions } = req.body ?? {};
  const userName = sanitizeName(req.body?.userName);
  const demographics = sanitizeDemographics(req.body?.demographics);
  const index = Number(req.body?.index ?? 0);
  const thread = parseThread(req.body);

  if (!isValidName(userName)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }
  if (!isValidDemographics(demographics)) {
    return res.status(400).json({ error: 'Profile data is required.' });
  }
  if (!Number.isInteger(index) || index < 0 || index > 11) {
    return res.status(400).json({ error: 'Invalid question index.' });
  }

  const priorQuestions = Array.isArray(personalityQuestions) ? personalityQuestions : [];
  const personalityMax = maxAnswerValue(priorQuestions);
  const personalityCheck = validateAnswers(personalityAnswers, 12, personalityMax);
  if (!personalityCheck.valid) {
    return res.status(400).json({ error: 'Complete personality phase first.' });
  }
  if (priorQuestions.filter(Boolean).length !== 12) {
    return res.status(400).json({ error: 'Personality questions required.' });
  }

  const { question, source } = await generateNextBurnoutQuestion({
    index,
    thread,
    userName,
    demographics,
    personalityAnswers: personalityAnswers ?? [],
    personalityQuestions: personalityQuestions ?? [],
  });

  res.json({ question, index, source });
});

router.post('/personality', async (req, res) => {
  const userName = sanitizeName(req.body?.userName);
  const demographics = sanitizeDemographics(req.body?.demographics);

  if (!isValidName(userName)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }
  if (!isValidDemographics(demographics)) {
    return res.status(400).json({ error: 'A complete profile is required.' });
  }

  const { questions, source } = await generatePersonalityQuestions();
  res.json({ questions, source });
});

router.post('/burnout', async (req, res) => {
  const { personalityAnswers, personalityQuestions } = req.body ?? {};
  const userName = sanitizeName(req.body?.userName);
  const demographics = sanitizeDemographics(req.body?.demographics);

  if (!isValidName(userName)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }
  if (!isValidDemographics(demographics)) {
    return res.status(400).json({ error: 'Profile data is required.' });
  }

  const priorQuestions = Array.isArray(personalityQuestions) ? personalityQuestions : [];
  const personalityMax = maxAnswerValue(priorQuestions);
  if (!validateAnswers(personalityAnswers, 12, personalityMax).valid) {
    return res.status(400).json({ error: 'Complete personality phase first.' });
  }

  const { questions, source } = await generateBurnoutQuestions(
    userName,
    demographics,
    personalityAnswers,
    priorQuestions,
  );
  res.json({ questions, source });
});

export default router;
