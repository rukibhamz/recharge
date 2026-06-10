export default function OptionButton({ label, selected, onClick, justSelected = false }) {
  const radio = (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ease-out lg:h-7 lg:w-7 ${
        selected ? 'scale-100 border-primary bg-primary' : 'border-outline-variant bg-white'
      }`}
      aria-hidden="true"
    >
      {selected && (
        <span className="h-2.5 w-2.5 scale-100 rounded-full bg-on-primary transition-transform duration-300 lg:h-3 lg:w-3" />
      )}
    </span>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-interactive flex w-full items-center gap-4 text-left active:scale-[0.99] lg:justify-between lg:gap-6 lg:border-b lg:border-outline-variant/25 lg:px-1 lg:py-5 lg:last:border-b-0 rounded-2xl border border-outline-variant/20 bg-white px-5 py-4 shadow-soft lg:rounded-none lg:border-0 lg:bg-transparent lg:px-2 lg:shadow-none lg:active:scale-100 ${
        selected
          ? 'border-primary/30 bg-secondary-container/25 lg:bg-secondary-container/10'
          : 'hover:border-primary/15 hover:bg-secondary-container/10'
      } ${justSelected ? 'option-selected-pulse' : ''}`}
      aria-pressed={selected}
    >
      <span className="lg:hidden">{radio}</span>
      <span
        className={`flex-1 font-sans text-body-md transition-colors duration-300 ${
          selected ? 'font-medium text-primary' : 'text-on-surface'
        }`}
      >
        {label}
      </span>
      <span className="hidden lg:block">{radio}</span>
    </button>
  );
}
