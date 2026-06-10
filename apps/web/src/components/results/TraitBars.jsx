export default function TraitBars({ traits }) {
  return (
    <div className="space-y-4">
      {traits.map((trait) => (
        <div key={trait.name}>
          <div className="mb-1 flex justify-between font-sans text-body-md">
            <span className="text-on-surface-variant">{trait.name}</span>
            <span className="personality-chip">
              {trait.poleA && trait.poleB
                ? `${trait.pct}% ${trait.poleA}`
                : `${trait.pct}%`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
            <div
              className="h-full rounded-full bg-primary/70 transition-all duration-500"
              style={{ width: `${trait.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
