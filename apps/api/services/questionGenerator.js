import { optionLabelForValue } from '@recharge/shared/questionOptions';
import { scoreMbti, formatMbtiType } from '@recharge/shared/mbtiScoring';
import { llmFeatures } from '../config/llm.js';
import {
  getBurnoutBankQuestions,
  getPersonalityBankQuestions,
  selectBurnoutAnchors,
  getMbtiTypeProfile,
} from './questionBank.js';
import { runAgentTask } from './assessmentAgent.js';
import { buildQuestionPromptContext } from './promptContext.js';

const TOTAL = 12;

/** Personality uses anchored bank (agent personalizes via /assess flow). */
export async function generatePersonalityQuestions() {
  return getPersonalityBankQuestions();
}

/**
 * Single next burnout question — uses Assessment Agent rewrite of an anchor slot.
 * Falls back to bank text when LLM is off or fails.
 */
export async function generateNextBurnoutQuestion({
  index,
  userName,
  demographics,
  personalityAnswers,
  personalityQuestions,
  personality,
}) {
  const anchors = await selectBurnoutAnchors();
  const anchor = anchors[index % anchors.length] ?? anchors[0];

  let personalityProfile = personality;
  if (!personalityProfile?.typeCode && personalityAnswers && personalityQuestions) {
    try {
      const mbti = scoreMbti(personalityAnswers, personalityQuestions);
      const profile = await getMbtiTypeProfile(mbti.typeCode).catch(() => null);
      const type = formatMbtiType(profile ?? { code: mbti.typeCode });
      personalityProfile = {
        typeCode: mbti.typeCode,
        type,
        traits: mbti.traits,
        summary: type.desc,
      };
    } catch {
      personalityProfile = null;
    }
  }

  if (!llmFeatures.burnoutQuestions) {
    const { questions } = await getBurnoutBankQuestions();
    return { question: questions[index] ?? questions[0], source: 'bank' };
  }

  const userContext = buildQuestionPromptContext({ userName, demographics });
  const { result, source } = await runAgentTask('rewriteBurnoutQuestion', {
    anchor,
    userContext,
    userName,
    personality: personalityProfile,
    workContext: demographics?.workContext,
  });

  const question = {
    id: `agent-b${index + 1}`,
    bankId: anchor.bankId,
    text: result.text,
    dimension: result.dimension ?? anchor.dimension,
    reverseScored: Boolean(result.reverseScored ?? anchor.reverseScored),
    scale: result.scale ?? anchor.scale,
    options: anchor.options,
  };

  return { question, source };
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
    if (s !== 'bank' && s !== 'bank-fallback') source = s;
    thread.push({
      question: question.text,
      answer: optionLabelForValue(question.options, 2),
      answerValue: 2,
    });
  }

  return { questions, source };
}
