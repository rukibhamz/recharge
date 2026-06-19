import { FREQUENCY_OPTIONS } from '@recharge/shared/questions';
import {
  BURNOUT_OPTIONS_FORMAT,
  COACH_VOICE_RULES,
  burnoutSlot,
  conversationThreadPrompt,
} from '@recharge/shared/promptCoaching';
import { normalizeLlmOptions, optionLabelForValue } from '@recharge/shared/questionOptions';
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

Write ONE frequency question ("How often..." or similar). It must:
- Follow conversationally from what they already shared
- Reference their work and daily rhythm — never cities, countries, or named places
- No survey jargon; sound like a caring friend checking in

${BURNOUT_OPTIONS_FORMAT}

${COACH_VOICE_RULES}

Return JSON only:
{"text":"...","dimension":"${slot.dimension}","reverseScored":${slot.needsReverse},"options":[{"value":0,"label":"..."},{"value":1,"label":"..."},{"value":2,"label":"..."},{"value":3,"label":"..."},{"value":4,"label":"..."}]}`;

  try {
    const parsed = await generateJson(prompt);
    const question = {
      id: `llm-b${index + 1}`,
      text: String(parsed.text),
      dimension: parsed.dimension ?? slot.dimension,
      reverseScored: slot.needsReverse ? true : Boolean(parsed.reverseScored),
      scale: 'frequency',
      options: normalizeLlmOptions(parsed.options, FREQUENCY_OPTIONS),
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
