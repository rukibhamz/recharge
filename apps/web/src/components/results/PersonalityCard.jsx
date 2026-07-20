export default function PersonalityCard({ type }) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-start gap-4">
        <span className="text-4xl" aria-hidden="true">
          {type.icon}
        </span>
        <div>
          <h3 className="font-display text-headline-md text-on-surface">{type.name}</h3>
          {type.archetype ? (
            <p className="mt-1 font-sans text-label-sm uppercase tracking-wide text-primary">
              {type.archetype}
            </p>
          ) : null}
          <p className="mt-2 font-sans text-body-md text-on-surface-variant">{type.desc}</p>
          {type.strengths ? (
            <p className="mt-3 font-sans text-body-md text-on-surface">
              <span className="font-medium text-on-surface-variant">What seems to sustain you: </span>
              {type.strengths}
            </p>
          ) : null}
          {type.growthAreas ? (
            <p className="mt-2 font-sans text-body-md text-on-surface-variant">
              <span className="font-medium">Where to be gentle with yourself: </span>
              {type.growthAreas}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
