import { optionsForQuestion } from '@recharge/shared/questions';
import AssessmentShell from '../components/assessment/AssessmentShell.jsx';
import QuestionCard from '../components/assessment/QuestionCard.jsx';
import { useAutoAdvance } from '../hooks/useAutoAdvance.js';

export default function PersonalityPhase({
  questions,
  index,
  answers,
  onAnswer,
  onNext,
  onBack,
  onClose,
  onComplete,
}) {
  const q = questions[index];
  const selected = answers[index];
  const isLast = index === questions.length - 1;

  const { handleSelect, isExiting } = useAutoAdvance({
    questionIndex: index,
    onAnswer,
    onNext,
    onComplete,
    isLast,
  });

  if (!q) return null;

  return (
    <AssessmentShell
      partLabel="Part 1: Personality Profile"
      questionIndex={index}
      totalQuestions={questions.length}
      onBack={onBack}
      onClose={onClose}
    >
      <QuestionCard
        key={index}
        question={q.text}
        options={optionsForQuestion(q, 'personality')}
        selected={selected}
        onSelect={handleSelect}
        isExiting={isExiting}
      />
    </AssessmentShell>
  );
}
