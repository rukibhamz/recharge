export default function TraitBars({ traits }) {
  return (
    <div className="space-y-4">
      {traits.map((trait) => (
        <div key={trait.name}>
          <div className="mb-1.5 flex justify-between gap-3">
            <span className="font-sans text-[14px] text-ink-soft">{trait.name}</span>
            <span className="font-mono text-[12px] font-medium text-canopy">
              {trait.poleA && trait.poleB
                ? `${trait.pct}% ${trait.poleA}`
                : `${trait.pct}%`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-pill bg-linen-sunken">
            <div
              className="h-full rounded-pill bg-fern transition-all duration-base ease-calm"
              style={{ width: `${trait.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
