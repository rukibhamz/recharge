import { useEffect, useMemo, useState } from 'react';
import { Funnel } from '../../lib/analytics.js';
import {
  ensurePlanStarted,
  loadRoadmapProgress,
  phaseDayKey,
  resolveRoadmapFocus,
  toggleDayComplete,
  unlockedPhases,
} from '../../lib/roadmapProgress.js';
import SaveResultsSection from './SaveResultsSection.jsx';

function ProtocolStep({ step }) {
  if (!step) return null;

  return (
    <article className="rounded-md border border-linen-sunken bg-white/80 p-4 sm:p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-fern">
        <span aria-hidden="true">{step.icon}</span> {step.when || 'Recovery step'}
      </p>
      <h5 className="mt-1 font-display text-[1.08rem] font-normal text-ink">{step.title}</h5>
      {step.tip ? (
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-ink">{step.tip}</p>
      ) : null}

      {step.how ? (
        <div className="mt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">How</p>
          <p className="mt-1 font-sans text-[14px] leading-relaxed text-ink-soft">{step.how}</p>
        </div>
      ) : null}

      {step.script ? (
        <blockquote className="mt-3 rounded-md border-l-2 border-canopy/30 bg-fern-tint/40 px-3 py-2 font-sans text-[14px] leading-relaxed text-ink">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-canopy">Say / send this</p>
          <p className="mt-1">{step.script}</p>
        </blockquote>
      ) : null}

      {step.why ? (
        <div className="mt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">Why this</p>
          <p className="mt-1 font-sans text-[14px] leading-relaxed text-ink-soft">{step.why}</p>
        </div>
      ) : null}

      {step.check ? (
        <p className="mt-3 font-sans text-[13px] text-ink">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">Done when </span>
          {step.check}
        </p>
      ) : null}

      {step.trap ? (
        <p className="mt-3 font-sans text-[13px] text-signal-amber">{step.trap}</p>
      ) : null}
    </article>
  );
}

function PhaseCard({
  phase,
  index,
  defaultOpen = true,
  completed = false,
  onToggleComplete,
  badge = null,
}) {
  const [open, setOpen] = useState(defaultOpen);

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

  const steps = phase.steps ?? [];
  const stepPreview = steps
    .slice(0, 2)
    .map((s) => s.title)
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={`rounded-md border bg-surface/60 ${
        completed ? 'border-canopy/25 opacity-90' : 'border-linen-sunken'
      }`}
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        {typeof onToggleComplete === 'function' ? (
          <label className="mt-1 flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              className="h-4 w-4 accent-canopy"
              checked={completed}
              onChange={(e) => onToggleComplete(e.target.checked)}
              aria-label={`Mark ${phase.label || 'day'} complete`}
            />
          </label>
        ) : null}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
              {phase.label}
              {badge ? ` · ${badge}` : null}
              {completed ? ' · Done' : null}
            </p>
            <h4 className="mt-1 font-display text-[1.05rem] font-normal text-ink sm:text-headline-md">
              {phase.title}
            </h4>
            {!open && stepPreview ? (
              <p className="mt-2 truncate font-sans text-[14px] text-ink-soft">{stepPreview}</p>
            ) : null}
          </div>
          <span className="mt-1 shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-canopy">
            {steps.length} step{steps.length === 1 ? '' : 's'} {open ? '−' : '+'}
          </span>
        </button>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-linen-sunken px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          {phase.focus ? (
            <p className="font-sans text-body-md text-ink-soft">{phase.focus}</p>
          ) : null}
          {phase.outcome ? (
            <p className="font-sans text-[14px] text-ink">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-fern">
                Day is done when{' '}
              </span>
              {phase.outcome}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-3">
            {steps.map((item, i) => (
              <ProtocolStep key={`${phase.id}-${item.title}-${i}`} step={item} />
            ))}
          </div>
          {typeof onToggleComplete === 'function' && !completed ? (
            <button
              type="button"
              className="font-mono text-[12px] uppercase tracking-[0.06em] text-canopy underline-offset-2 hover:underline"
              onClick={() => onToggleComplete(true)}
            >
              Mark this day done
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'done', label: 'Done' },
];

export default function RecoveryRoadmap({
  roadmap,
  locked = false,
  sessionId,
  linked = false,
  cloudSaved = true,
  isPersonalised = false,
  onUnlocked,
}) {
  const progressKey = sessionId || 'local';
  const [tab, setTab] = useState('today');
  const [completedDayKeys, setCompletedDayKeys] = useState([]);

  useEffect(() => {
    const progress = ensurePlanStarted(progressKey);
    setCompletedDayKeys(progress.completedDayKeys);
  }, [progressKey]);

  const focus = useMemo(
    () => resolveRoadmapFocus(roadmap, completedDayKeys),
    [roadmap, completedDayKeys],
  );

  if (!roadmap?.phases?.length) return null;

  const phases = (roadmap.phases ?? []).filter(Boolean);
  const unlocked = unlockedPhases(roadmap);
  const lockedCount = roadmap.lockedPhaseCount || phases.filter((p) => p.locked).length;
  const showGate = locked || roadmap.guestPreview;
  const stepCount = phases.reduce((n, p) => n + (p.steps?.length || 0), 0);
  const dayCount = roadmap.horizonDays || phases.length;
  const allUnlocked = unlocked.length > 0 && lockedCount === 0 && !showGate;

  const handleToggle = (phase, index, completed) => {
    const next = toggleDayComplete(progressKey, phase, index, completed);
    setCompletedDayKeys(next.completedDayKeys);
    if (completed) {
      Funnel.roadmapDayCompleted(phaseDayKey(phase, index), sessionId);
    }
  };

  const listForTab =
    tab === 'today'
      ? focus.today
        ? [focus.today]
        : []
      : tab === 'upcoming'
        ? focus.upcoming
        : focus.done;

  return (
    <section className="space-y-gutter">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-headline-md font-normal text-ink">Your recovery roadmap</h3>
          <p className="mt-2 font-sans text-body-md text-ink-soft">
            {roadmap.intent || `${roadmap.horizonLabel} shaped around how you actually operate.`}
          </p>
          {allUnlocked && focus.totalCount > 0 ? (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
              {focus.completedCount}/{focus.totalCount} days checked off
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="ai-badge">{isPersonalised ? 'Personalised' : 'Curated'}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            {roadmap.horizonLabel}
            {stepCount > 0 && !showGate ? ` · ${dayCount} days · ${stepCount} steps` : ''}
          </span>
        </div>
      </div>

      {allUnlocked ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Roadmap view">
          {TABS.map((item) => {
            const count =
              item.id === 'today'
                ? focus.today
                  ? 1
                  : 0
                : item.id === 'upcoming'
                  ? focus.upcoming.length
                  : focus.done.length;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] ${
                  active
                    ? 'border-canopy/40 bg-fern-tint/60 text-canopy'
                    : 'border-linen-sunken bg-white/70 text-ink-soft'
                }`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {count > 0 ? ` · ${count}` : ''}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-3">
        {allUnlocked ? (
          listForTab.length ? (
            listForTab.map((phase) => {
              const index = unlocked.findIndex((p) => p === phase);
              const key = phaseDayKey(phase, index);
              const completed = completedDayKeys.includes(key);
              return (
                <PhaseCard
                  key={key}
                  phase={phase}
                  index={index}
                  defaultOpen={tab === 'today'}
                  completed={completed}
                  badge={tab === 'today' ? 'Focus' : null}
                  onToggleComplete={(done) => handleToggle(phase, index, done)}
                />
              );
            })
          ) : (
            <p className="rounded-md border border-linen-sunken bg-white/70 p-4 font-sans text-body-md text-ink-soft">
              {tab === 'done'
                ? 'No days checked off yet — start with Today.'
                : tab === 'upcoming'
                  ? 'Nothing queued after today. You are on the last open day.'
                  : 'Your plan will show here once days unlock.'}
            </p>
          )
        ) : (
          phases.map((phase, i) => (
            <PhaseCard
              key={phase.id || phase.label || i}
              phase={phase}
              index={i}
              defaultOpen={i === 0}
            />
          ))
        )}
      </div>

      {showGate && lockedCount > 0 ? (
        <div className="rounded-md border border-canopy/20 bg-fern-tint/50 p-5 sm:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-canopy">
            {lockedCount} more day{lockedCount === 1 ? '' : 's'} locked
          </p>
          <h4 className="mt-2 font-display text-xl font-medium text-ink">
            {roadmap.unlockLabel || `Sign in to unlock the rest of your ${roadmap.horizonLabel}`}
          </h4>
          <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
            Day 1 is yours to start now. Each remaining day is its own checklist: what to do, how to
            do it, what to say, and when that day is actually done.
          </p>
          {sessionId ? (
            <SaveResultsSection
              sessionId={sessionId}
              initiallyLinked={linked}
              cloudSaved={cloudSaved}
              heading="Unlock the full plan"
              description="Sign in with a magic link. We will attach this roadmap to your account and open the rest of the days."
              onUnlocked={(session) => {
                Funnel.roadmapUnlocked();
                if (onUnlocked) onUnlocked(session);
              }}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
