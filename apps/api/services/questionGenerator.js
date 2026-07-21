import { inferQuestionScale, optionsForScale, resolveQuestionScale } from '@recharge/shared/questions';
import {
  BURNOUT_MIXED_SCALE_RULES,
  COACH_VOICE_RULES,
  PERSONALITY_OPTIONS_FORMAT,
  BURNOUT_OPTIONS_FORMAT,
  burnoutSlot,
  conversationThreadPrompt,
} from '@recharge/shared/promptCoaching';
import { coerceOptionsToScale, optionLabelForValue } from '@recharge/shared/questionOptions';
import { scoreMbti } from '@recharge/shared/mbtiScoring';
import {
  getBurnoutBankQuestions,
  getPersonalityBankQuestions,
} from './questionBank.js';
import { llmFeatures } from '../config/llm.js';
import { generateJson, getLastLlmProvider, hasAnyLlmProvider } from './llmProvider.js';
import { buildQuestionPromptContext } from './promptContext.js';

const TOTAL = 12;

function llmSource() {
  return getLastLlmProvider() ?? 'llm';
}

function normalizeThread(thread) {
  if (!Array.isArray(thread)) return [];
  return thread
    .filter((t) => t?.question)
    .map((t) => ({
      question: String(t.question),
      answer: String(t.answer ?? ''),
      answerValue: t.answerValue,
    }));
}

async function bankBurnoutQuestion(index) {
  const { questions } = await getBurnoutBankQuestions();
  return questions[index] ?? questions[0];
}

/** Personality uses the curated MBTI bank — instant load, standard agreement scale, no LLM. */
export async function generatePersonalityQuestions() {
  return getPersonalityBankQuestions();
}

export async function generateNextBurnoutQuestion({
  index,
  thread,
  userName,
  demographics,
  personalityAnswers,
  personalityQuestions,
}) {
  const slot = burnoutSlot(index);
  const userContext = buildQuestionPromptContext({ userName, demographics });
  const conversation = conversationThreadPrompt(normalizeThread(thread), userName);

  let personalitySummary = '';
  try {
    const mbti = scoreMbti(personalityAnswers, personalityQuestions);
    personalitySummary = `Their personality: ${mbti.typeCode}. Let this colour your tone, not dominate it.`;
  } catch {
    personalitySummary = '';
  }

  if (!llmFeatures.burnoutQuestions || !hasAnyLlmProvider()) {
    const q = await bankBurnoutQuestion(index);
    return { question: q, source: 'bank' };
  }

  const prompt = `You are continuing a private check-in about stress and energy (question ${index + 1} of ${TOTAL}).

${userContext}
${personalitySummary}

${conversation}

Dimension focus: ${slot.dimension}${slot.needsReverse ? ' — this final question should be positively worded (reverse-scored: feeling capable or accomplished)' : ''}.

Write ONE burnout check-in question (number ${index + 1} of ${TOTAL}). Choose the scale that fits how you phrase it:
- "I ..." statement → scale "agreement" (${PERSONALITY_OPTIONS_FORMAT})
- "How often..." → scale "frequency" (${BURNOUT_OPTIONS_FORMAT})

${BURNOUT_MIXED_SCALE_RULES}

${COACH_VOICE_RULES}

Return JSON only:
{"text":"...","scale":"agreement","dimension":"${slot.dimension}","reverseScored":${slot.needsReverse},"options":[{"value":0,"label":"..."},{"value":1,"label":"..."},{"value":2,"label":"..."},{"value":3,"label":"..."},{"value":4,"label":"..."}]}`;

  try {
    const parsed = await generateJson(prompt);
    const text = String(parsed.text);
    const scale = resolveQuestionScale({ scale: parsed.scale, text }, 'burnout');
    const question = {
      id: `llm-b${index + 1}`,
      text,
      dimension: parsed.dimension ?? slot.dimension,
      reverseScored: slot.needsReverse ? true : Boolean(parsed.reverseScored),
      scale,
      options: coerceOptionsToScale(parsed.options, scale),
    };

    return { question, source: llmSource() };
  } catch (err) {
    console.error(`Burnout Q${index + 1} LLM failed:`, err.message);
    const q = await bankBurnoutQuestion(index);
    return { question: q, source: 'bank' };
  }
}

export async function generateBurnoutQuestions(
  userName,
  demographics,
  personalityAnswers,
  personalityQuestions,
) {
  const questions = [];
  let source = 'bank';
  const thread = [];

  for (let i = 0; i < TOTAL; i++) {
    const { question, source: s } = await generateNextBurnoutQuestion({
      index: i,
      thread,
      userName,
      demographics,
      personalityAnswers,
      personalityQuestions,
    });
    questions.push(question);
    if (s !== 'bank') source = s;
    thread.push({
      question: question.text,
      answer: optionLabelForValue(question.options, 2),
      answerValue: 2,
    });
  }

  return { questions, source };
}
