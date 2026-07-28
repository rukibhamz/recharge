export default function OptionButton({ label, selected, onClick, justSelected = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-interactive flex w-full items-center gap-3 rounded-[10px] border-[1.5px] px-4 py-3 text-left text-[14px] transition-colors duration-instant ease-out ${
        selected
          ? 'border-canopy-600 bg-fern-tint font-semibold text-canopy'
          : 'border-linen-sunken bg-transparent font-normal text-ink-soft hover:border-fern/50'
      } ${justSelected ? 'option-selected-pulse' : ''}`}
      aria-pressed={selected}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          selected ? 'border-canopy-600' : 'border-current'
        }`}
        aria-hidden="true"
      >
        {selected ? <span className="h-[7px] w-[7px] rounded-full bg-canopy-600" /> : null}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
