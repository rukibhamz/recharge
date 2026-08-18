import RecommendationCard from './RecommendationCard.jsx';
import SaveResultsSection from './SaveResultsSection.jsx';

function PhaseCard({ phase, index }) {
  if (!phase) return null;
  if (phase.locked) {
    return (
      <div className="relative overflow-hidden rounded-md border border-linen-sunken bg-surface/80 p-4">
        <div className="pointer-events-none select-none blur-[6px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            {phase.label}
          </p>
          <h4 className="mt-1 font-display text-[1.05rem] text-ink">{phase.title}</h4>
          <p className="mt-2 font-sans text-[14px] text-ink-soft">{phase.focus}</p>
          <div className="mt-3 h-16 rounded-md bg-linen-sunken/80" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-linen/40">
          <span className="rounded-full border border-canopy/20 bg-white/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-canopy">
            Locked · {phase.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <article className="space-y-3">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          {phase.label}
          {index === 0 ? ' · Start here' : ''}
        </p>
        <h4 className="mt-1 font-display text-headline-md font-normal text-ink">{phase.title}</h4>
        {phase.focus ? (
          <p className="mt-1 font-sans text-body-md text-ink-soft">{phase.focus}</p>
        ) : null}
      </header>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {(phase.steps ?? []).map((step) => (
          <div key={`${phase.id}-${step.title}`}>
            <RecommendationCard {...step} />
            {step.trap ? (
              <p className="mt-2 px-1 font-sans text-[13px] text-signal-amber">{step.trap}</p>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

export default function RecoveryRoadmap({
  roadmap,
  locked = false,
  sessionId,
  linked = false,
  cloudSaved = true,
  isPersonalised = false,
  onUnlocked,
}) {
  if (!roadmap?.phases?.length) return null;

  const phases = (roadmap.phases ?? []).filter(Boolean);
  const lockedCount = roadmap.lockedPhaseCount || phases.filter((p) => p.locked).length;
  const showGate = locked || roadmap.guestPreview;

  return (
    <section className="space-y-gutter">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-headline-md font-normal text-ink">Your recovery roadmap</h3>
          <p className="mt-2 font-sans text-body-md text-ink-soft">
            {roadmap.intent || `${roadmap.horizonLabel} shaped around how you actually operate.`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="ai-badge">{isPersonalised ? 'Personalised' : 'Curated'}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            {roadmap.horizonLabel}
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {phases.map((phase, i) => (
          <PhaseCard key={phase.id || phase.label || i} phase={phase} index={i} />
        ))}
      </div>

      {showGate && lockedCount > 0 ? (
        <div className="rounded-md border border-canopy/20 bg-fern-tint/50 p-5 sm:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-canopy">
            {lockedCount} more phase{lockedCount === 1 ? '' : 's'} locked
          </p>
          <h4 className="mt-2 font-display text-xl font-medium text-ink">
            {roadmap.unlockLabel || `Sign in to unlock the rest of your ${roadmap.horizonLabel}`}
          </h4>
          <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
            Day 1 is yours to start now. The remaining days are a sequenced plan with your trait
            traps and protocol rules — saved to your account so you can come back to it.
          </p>
          {sessionId ? (
            <SaveResultsSection
              sessionId={sessionId}
              initiallyLinked={linked}
              cloudSaved={cloudSaved}
              heading="Unlock the full plan"
              description="Sign in with a magic link. We will attach this roadmap to your account and open the rest of the days."
              onUnlocked={onUnlocked}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
