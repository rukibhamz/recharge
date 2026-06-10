import OptionButton from './OptionButton.jsx';

export default function QuestionCard({ question, options, selected, onSelect, isExiting }) {
  return (
    <div className={isExiting ? 'question-exit' : 'question-enter'}>
      <h2 className="text-center font-display text-headline-lg-mobile leading-snug text-on-surface lg:text-[1.75rem] lg:font-medium">
        {question}
      </h2>
      <div className="mt-8 flex flex-col gap-3 lg:mt-10 lg:gap-0">
        {options.map((opt, i) => (
          <div
            key={opt.value}
            className="option-enter"
            style={{ animationDelay: isExiting ? '0ms' : `${80 + i * 55}ms` }}
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
