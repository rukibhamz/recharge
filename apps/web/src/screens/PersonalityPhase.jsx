import { optionsForQuestion } from '@recharge/shared/questions';
import AssessmentShell from '../components/assessment/AssessmentShell.jsx';
import QuestionCard from '../components/assessment/QuestionCard.jsx';
import { useAutoAdvance } from '../hooks/useAutoAdvance.js';

export default function PersonalityPhase({
  phase,
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
  const total = questions.length;
  const isLast = index === total - 1;

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
      phase={phase}
      partLabel="Personality interview"
      questionIndex={index}
      totalQuestions={total}
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
