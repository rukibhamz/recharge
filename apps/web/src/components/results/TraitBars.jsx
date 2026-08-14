import { displayTraitLean } from '@recharge/shared/mbtiScoring';

export default function TraitBars({ traits }) {
  return (
    <div className="space-y-4">
      {(traits ?? []).map((trait) => {
        const lean = displayTraitLean(trait);
        return (
          <div key={lean.name}>
            <div className="mb-1.5 flex justify-between gap-3">
              <span className="font-sans text-[14px] text-ink-soft">{lean.name}</span>
              <span className="font-mono text-[12px] font-medium text-canopy">
                {lean.poleA && lean.poleB ? `${lean.pct}% ${lean.letter}` : `${lean.pct}%`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-pill bg-linen-sunken">
              <div
                className="h-full rounded-pill bg-fern transition-all duration-base ease-calm"
                style={{ width: `${lean.pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
