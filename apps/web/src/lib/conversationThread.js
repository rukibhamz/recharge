import { AGREEMENT_OPTIONS, FREQUENCY_OPTIONS, optionsForQuestion } from '@recharge/shared/questions';
import { optionLabelForValue } from '@recharge/shared/questionOptions';

export function buildConversationThread(questions, answers, phase = 'personality') {
  const thread = [];

  for (let i = 0; i < questions.length; i++) {
    if (!questions[i]?.text || answers[i] == null) break;
    const options = optionsForQuestion(questions[i], phase);
    thread.push({
      question: questions[i].text,
      answer: optionLabelForValue(options, answers[i]),
      answerValue: answers[i],
    });
  }

  return thread;
}
