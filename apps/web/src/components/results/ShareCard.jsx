export default function ShareCard({ displayName, burnout, personality }) {
  const first = displayName?.split(' ')[0];

  return (
    <div
      id="share-card"
      className="overflow-hidden rounded-2xl bg-warm p-8 text-on-surface"
      style={{ width: 400 }}
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold text-primary">Recharge</p>
        <p className="font-sans text-xs uppercase tracking-widest text-on-surface-variant">
          Profile
        </p>
      </div>

      {first && (
        <p className="mt-6 font-sans text-body-md text-on-surface-variant">
          {first}&apos;s snapshot
        </p>
      )}

      <div className="mt-4 rounded-xl bg-white p-5 shadow-card">
        <p className="text-center font-sans text-label-sm uppercase tracking-wide text-on-surface-variant">
          Burnout check
        </p>
        <p className="mt-2 text-center font-display text-xl text-primary">{burnout.level}</p>
      </div>

      <div className="mt-4 rounded-xl bg-white p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">
            {personality.type.icon}
          </span>
          <div>
            <p className="font-display text-lg text-on-surface">{personality.type.name}</p>
            <p className="mt-1 font-sans text-sm text-on-surface-variant">{personality.type.desc}</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center font-sans text-[11px] text-on-surface-variant/80">
        recharge.app · Not medical advice
      </p>
    </div>
  );
}
