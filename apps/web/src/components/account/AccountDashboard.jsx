import Button from '../shared/Button.jsx';
import ScoreRing from '../results/ScoreRing.jsx';
import TraitBars from '../results/TraitBars.jsx';
import { normalizeRecommendationsList, DEFAULT_RECOVERY_TIPS } from '@recharge/shared/recommendations';
import { resolveBurnoutReport } from '@recharge/shared/resultNarratives';
import { relativeAssessmentTime } from '../../lib/formatDate.js';
import StructuredCopy from '../results/StructuredCopy.jsx';

function needsAction(cls) {
  const c = String(cls || '').toLowerCase();
  return c === 'moderate' || c === 'severe';
}

function daysUntilMilestone(lastAssessmentIso, reminderDays) {
  if (!lastAssessmentIso) return null;
  const last = new Date(lastAssessmentIso).getTime();
  if (Number.isNaN(last)) return null;
  const due = last + reminderDays * 86400000;
  const days = Math.ceil((due - Date.now()) / 86400000);
  return days;
}

/**
 * Account Overview recovery pulse — mock layout with live assessment data.
 * Sidebar / shell provided by parent.
 */
export default function AccountDashboard({
  displayName,
  latest,
  reminderDays = 30,
  onOpenCoach,
  onViewFull,
}) {
  if (!latest) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
            Hello, {displayName}.
          </h1>
          <p className="mt-2 font-sans text-lg text-ink-soft">
            Here is your current recovery pulse.
          </p>
        </header>

        <section className="glass-card p-8 text-center sm:p-12">
          <p className="font-sans text-body-md text-ink-soft">
            Complete an assessment and save it to your account to unlock your burnout score,
            personality profile, and recovery roadmap here.
          </p>
          <Button className="mt-6" onClick={() => { window.location.href = '/'; }}>
            Take assessment
          </Button>
        </section>
      </div>
    );
  }

  const burnout = latest.burnout || {};
  const personality = latest.personality || {};
  const typeName = personality.type?.name || personality.typeCode || 'Your profile';
  const typeDesc =
    personality.type?.desc ||
    'Your profile reflects how you typically restore energy and respond to load. Use it to shape recovery, not as a label.';
  const traits = Array.isArray(personality.traits) ? personality.traits : [];
  const recommendations = normalizeRecommendationsList(
    latest.recommendations ?? [],
    DEFAULT_RECOVERY_TIPS,
  ).slice(0, 4);
  const action = needsAction(burnout.cls);
  const daysLeft = daysUntilMilestone(latest.createdAt, reminderDays);
  const milestoneLabel =
    daysLeft == null
      ? 'Set a re-check cadence below'
      : daysLeft > 0
        ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} until your next check-in`
        : 'Check-in is due. Retake when ready';
  const progressPct =
    daysLeft == null
      ? 33
      : daysLeft <= 0
        ? 100
        : Math.max(8, Math.min(92, Math.round(((reminderDays - daysLeft) / reminderDays) * 100)));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Hello, {displayName}.
        </h1>
        <p className="mt-2 font-sans text-lg text-ink-soft">
          Here is your current recovery pulse.
          {latest.createdAt ? (
            <span className="mt-1 block font-sans text-sm text-ink-faint">
              Last assessment {relativeAssessmentTime(latest.createdAt)}
            </span>
          ) : null}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Burnout score */}
          <section className="glass-card relative overflow-hidden p-8 sm:p-10">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fern-tint/50 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row md:items-center">
              <div className="shrink-0 drop-shadow-sm">
                <ScoreRing
                  pct={burnout.pct ?? 0}
                  cls={burnout.cls}
                  size="lg"
                  showRiskLabel
                />
              </div>
              <div className="min-w-0 flex-1 space-y-4 text-center md:text-left">
                <h2 className="font-display text-2xl font-medium text-ink sm:text-3xl">
                  Latest Burnout Score:{' '}
                  <span className="text-canopy">{burnout.level || 'Moderate'}</span>
                </h2>
                <StructuredCopy report={resolveBurnoutReport(burnout, personality)} />
                {action ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-signal-amber/30 bg-signal-amber-tint/80 px-4 py-2 font-sans text-sm font-semibold text-signal-amber">
                    <span aria-hidden="true">⚠</span>
                    Action recommended
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-fern/30 bg-fern-tint px-4 py-2 font-sans text-sm font-semibold text-canopy">
                    <span aria-hidden="true">✓</span>
                    Keep protecting your baseline
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* AI recommendations */}
          <section className="space-y-5">
            <h2 className="font-display text-2xl font-medium text-ink">AI Recommendations</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recommendations.map((rec, i) => (
                <button
                  key={`${rec.title}-${i}`}
                  type="button"
                  onClick={onOpenCoach}
                  className="glass-card group flex cursor-pointer gap-4 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-fern-tint bg-white text-xl shadow-sm transition-colors group-hover:bg-canopy group-hover:text-white">
                    <span aria-hidden="true">{rec.icon || '✨'}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans text-[16px] font-semibold text-ink transition-colors group-hover:text-canopy">
                      {rec.title}
                    </h3>
                    <p className="mt-1 font-sans text-[13px] leading-relaxed text-ink-soft">
                      {rec.tip}
                    </p>
                    {rec.when ? (
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-fern">
                        {rec.when}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <section className="glass-card flex flex-1 flex-col overflow-hidden p-0">
            <div className="relative h-28 bg-gradient-to-r from-canopy to-canopy-600 sm:h-32">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
              <div className="absolute bottom-5 left-6">
                <span className="rounded-full bg-black/20 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                  Profile analysis
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <h3 className="font-display text-3xl font-medium text-ink">{typeName}</h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">{typeDesc}</p>
              {traits.length > 0 ? (
                <div className="mt-8 flex-1">
                  <TraitBars traits={traits.slice(0, 4)} />
                </div>
              ) : (
                <p className="mt-8 font-sans text-sm text-ink-faint">
                  Trait detail will appear after your next full assessment save.
                </p>
              )}
              <button
                type="button"
                onClick={onViewFull}
                className="btn-interactive mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/70 py-3.5 font-sans text-sm font-semibold text-canopy shadow-sm transition hover:bg-white"
              >
                View full analysis
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <section className="glass-card bg-gradient-to-br from-fern-tint/40 to-transparent p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/70 bg-white text-canopy shadow-sm">
                <span aria-hidden="true">✨</span>
              </div>
              <div>
                <h4 className="font-sans text-lg font-semibold text-ink">Next milestone</h4>
                <p className="font-sans text-sm text-ink-soft">{milestoneLabel}</p>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full bg-canopy/80 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
