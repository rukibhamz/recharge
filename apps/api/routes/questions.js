import { Router } from 'express';
import {
  generateBurnoutQuestions,
  generatePersonalityQuestions,
} from '../services/questionGenerator.js';
import { maxAnswerValue, validateAnswers } from '@recharge/shared/scoring';
import { isValidName, sanitizeName } from '@recharge/shared/name';

const router = Router();

router.post('/personality', async (req, res) => {
  const userName = sanitizeName(req.body?.userName);
  if (!isValidName(userName)) {
    return res.status(400).json({ error: 'A valid name is required before generating questions.' });
  }

  const { questions, source } = await generatePersonalityQuestions(userName);
  res.json({ questions, source });
});

router.post('/burnout', async (req, res) => {
  const { personalityAnswers, personalityQuestions } = req.body ?? {};
  const userName = sanitizeName(req.body?.userName);
  if (!isValidName(userName)) {
    return res.status(400).json({ error: 'A valid name is required.' });
  }

  const personalityMax = maxAnswerValue(personalityQuestions);
  const check = validateAnswers(personalityAnswers, 12, personalityMax);
  if (!check.valid) {
    return res.status(400).json({ error: 'Complete personality phase before burnout questions.' });
  }

  if (!Array.isArray(personalityQuestions) || personalityQuestions.length !== 12) {
    return res.status(400).json({ error: 'Personality questions metadata required.' });
  }

  const { questions, source } = await generateBurnoutQuestions(
    userName,
    personalityAnswers,
    personalityQuestions,
  );
  res.json({ questions, source });
});

export default router;
