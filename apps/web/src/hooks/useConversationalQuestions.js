import { useEffect } from 'react';
import {
  fetchNextBurnoutQuestion,
} from '../services/api.js';
import { buildConversationThread } from '../lib/conversationThread.js';
import { runOnceKeyed } from '../lib/fetchGuards.js';

const TOTAL = 12;

export function useConversationalQuestions({
  phase,
  index,
  questions,
  answers,
  userName,
  demographics,
  personalityAnswers,
  personalityQuestions,
  setQuestion,
  setError,
}) {
  const isBurnout = phase === 'burnout';
  const active = isBurnout;

  useEffect(() => {
    if (!active || index < 0 || index >= TOTAL) return;
    if (questions[index]) return;

    const key = `${phase}:${index}`;
    runOnceKeyed(key, async () => {
      try {
        const thread = buildConversationThread(questions, answers, 'burnout');

        const data = await fetchNextBurnoutQuestion({
          index,
          thread,
          userName,
          demographics,
          personalityAnswers,
          personalityQuestions,
        });

        setQuestion(index, data.question);
      } catch (err) {
        setError(err.message);
      }
    });
  }, [
    active,
    phase,
    index,
    questions,
    answers,
    userName,
    demographics,
    personalityAnswers,
    personalityQuestions,
    setQuestion,
    setError,
    isBurnout,
  ]);

  useEffect(() => {
    if (!active) return;

    const nextIndex = index + 1;
    if (nextIndex >= TOTAL) return;
    if (answers[index] == null) return;
    if (questions[nextIndex]) return;

    const key = `${phase}:prefetch:${nextIndex}`;
    runOnceKeyed(key, async () => {
      try {
        const thread = buildConversationThread(questions, answers, 'burnout');

        const data = await fetchNextBurnoutQuestion({
          index: nextIndex,
          thread,
          userName,
          demographics,
          personalityAnswers,
          personalityQuestions,
        });

        setQuestion(nextIndex, data.question);
      } catch {
        /* prefetch failure — current-index effect will retry when user advances */
      }
    });
  }, [
    active,
    phase,
    index,
    answers,
    questions,
    userName,
    demographics,
    personalityAnswers,
    personalityQuestions,
    setQuestion,
    isBurnout,
  ]);
}
