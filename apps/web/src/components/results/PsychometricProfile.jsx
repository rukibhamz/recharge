export default function PsychometricProfile({ profile, className = '' }) {
  if (!profile?.diagnostic_summary) return null;

  const { diagnostic_summary: diag, actionable_protocol: protocols } = profile;

  return (
    <div className={`space-y-6 text-left ${className}`}>
      <section className="rounded-md border border-canopy/20 bg-fern-tint/40 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
          Cross-correlated profile
        </p>
        <h3 className="mt-2 font-display text-xl font-medium text-ink">
          {diag.primary_archetype}
        </h3>
        <p className="mt-1 font-mono text-[12px] text-canopy-700">{diag.burnout_stage}</p>
        <p className="mt-4 font-sans text-body-md leading-relaxed text-ink-soft">
          {diag.core_conflict}
        </p>
      </section>

      {diag.accelerators?.length ? (
        <section>
          <h4 className="font-display text-lg font-medium text-ink">Accelerators</h4>
          <p className="mt-1 font-sans text-body-md text-ink-soft">
            Personality traits that are currently amplifying strain:
          </p>
          <ul className="mt-3 space-y-3">
            {diag.accelerators.map((item) => (
              <li
                key={`${item.trait}-${item.dimension}`}
                className="rounded-md border border-linen-sunken bg-surface px-4 py-3 font-sans text-body-md text-ink-soft"
              >
                {item.mechanism}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {diag.buffers?.length ? (
        <section>
          <h4 className="font-display text-lg font-medium text-ink">Buffers</h4>
          <p className="mt-1 font-sans text-body-md text-ink-soft">
            Traits that can absorb load when used deliberately:
          </p>
          <ul className="mt-3 space-y-3">
            {diag.buffers.map((item) => (
              <li
                key={`buf-${item.trait}-${item.dimension}`}
                className="rounded-md border border-linen-sunken bg-surface px-4 py-3 font-sans text-body-md text-ink-soft"
              >
                {item.mechanism}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {protocols?.length ? (
        <section>
          <h4 className="font-display text-lg font-medium text-ink">Your protocols</h4>
          <p className="mt-1 font-sans text-body-md text-ink-soft">
            Micro-rules tied to your trait traps — not generic wellness tips:
          </p>
          <ol className="mt-4 space-y-4">
            {protocols.map((p, i) => (
              <li key={p.trigger} className="rounded-md border border-linen-sunken bg-surface p-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                  Protocol {i + 1}
                </span>
                <p className="mt-2 font-sans text-[15px] font-semibold text-ink">{p.trigger}</p>
                <p className="mt-2 font-sans text-body-md text-signal-amber">{p.personality_trap}</p>
                <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">
                  <span className="font-semibold text-ink">Rule: </span>
                  {p.protocol_rule}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
