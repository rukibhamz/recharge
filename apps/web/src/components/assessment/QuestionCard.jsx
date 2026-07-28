import OptionButton from './OptionButton.jsx';

export default function QuestionCard({ question, options, selected, onSelect, isExiting }) {
  return (
    <div className={isExiting ? 'question-exit' : 'question-enter'}>
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.08em] text-fern">
        Answer instinctively
      </p>
      <h2 className="mt-3 text-center font-display text-headline-lg-mobile font-normal leading-snug text-ink lg:text-[1.75rem]">
        {question}
      </h2>
      <div className="mt-8 flex flex-col gap-2 lg:mt-10">
        {options.map((opt, i) => (
          <div
            key={opt.value}
            className="option-enter"
            style={{ animationDelay: isExiting ? '0ms' : `${60 + i * 40}ms` }}
          >
            <OptionButton
              label={opt.label}
              selected={selected === opt.value}
              onClick={() => onSelect(opt.value)}
              justSelected={selected === opt.value && isExiting}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
