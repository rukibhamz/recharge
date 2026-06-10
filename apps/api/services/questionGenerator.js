import { FREQUENCY_OPTIONS } from '@recharge/shared/questions';
import { getBurnoutBankQuestions, getPersonalityBankQuestions } from './questionBank.js';
import { scoreMbti, formatMbtiType } from '@recharge/shared/mbtiScoring';
import { firstName } from '@recharge/shared/name';
import { geminiApiKey, geminiFeatures } from '../config/gemini.js';
import { generateJson, isCircuitOpen } from './geminiClient.js';

function validateBurnoutQuestions(questions) {
  if (!Array.isArray(questions) || questions.length !== 12) return false;
  return questions.filter((q) => q.reverseScored).length === 1;
}

/** Personality uses MBTI question bank from Supabase (120-question pool). */
export async function generatePersonalityQuestions(_userName) {
  return getPersonalityBankQuestions();
}

export async function generateBurnoutQuestions(userName, personalityAnswers, personalityQuestions) {
  if (!geminiFeatures.burnoutQuestions || !geminiApiKey() || isCircuitOpen()) {
    return getBurnoutBankQuestions();
  }

  const who = firstName(userName) ?? 'there';
  let personalitySummary = 'Unknown profile';
  try {
    const mbti = scoreMbti(personalityAnswers, personalityQuestions);
    personalitySummary = `${mbti.typeCode} (${formatMbtiType({ code: mbti.typeCode, title: mbti.typeCode }).name})`;
  } catch {
    /* use default */
  }

  const prompt = `Create 12 burnout questions for ${who} (${personalitySummary}) on Recharge.
Frequency: Never | Rarely | Sometimes | Often | Always (0–4). One reverseScored:true.

JSON: {"questions":[{"id":"b1","text":"...","dimension":"emotional_exhaustion","reverseScored":false}]}`;

  try {
    const parsed = await generateJson(prompt);
    const questions = (parsed.questions ?? parsed).map((q, i) => ({
      id: q.id ?? `b${i + 1}`,
      text: String(q.text),
      dimension: q.dimension ?? 'emotional_exhaustion',
      reverseScored: Boolean(q.reverseScored),
      scale: 'frequency',
      options: FREQUENCY_OPTIONS,
    }));

    if (!validateBurnoutQuestions(questions)) {
      throw new Error('Invalid burnout question structure');
    }

    return { questions, source: 'gemini' };
  } catch (err) {
    console.error('Burnout question generation failed:', err.message);
    return getBurnoutBankQuestions();
  }
}
