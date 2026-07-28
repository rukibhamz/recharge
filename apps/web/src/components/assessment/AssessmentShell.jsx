import Header from '../shared/Header.jsx';
import Footer from '../shared/Footer.jsx';
import Logo from '../shared/Logo.jsx';
import EditorialArtwork from '../shared/EditorialArtwork.jsx';
import EditorialMobileBand from '../shared/EditorialMobileBand.jsx';

import AssessmentFlowBar from './AssessmentFlowBar.jsx';
import { phaseLabel } from '../../lib/assessmentFlow.js';

export default function AssessmentShell({
  phase,
  partLabel,
  questionIndex,
  totalQuestions,
  onBack,
  onClose,
  children,
}) {
  const pct = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const footerNote = phaseLabel(phase);

  return (
    <div className="flex min-h-screen flex-col bg-linen">
      <Header variant="assessment-mobile" onBack={onBack} onClose={onClose} />

      {phase ? (
        <div className="pt-4 lg:pt-6">
          <AssessmentFlowBar phase={phase} />
        </div>
      ) : null}

      <header className="hidden border-b border-linen-sunken lg:block">
        <div className="mx-auto flex max-w-landing items-center justify-between px-12 py-6">
          <Logo />
          <div className="text-right">
            <p className="font-sans text-[15px] font-semibold text-ink">{partLabel}</p>
            <p className="font-mono text-[12px] text-ink-faint">{pct}% complete</p>
          </div>
        </div>
      </header>

      <div className="hidden lg:block">
        <div className="h-1 bg-linen-sunken">
          <div
            className="h-full bg-canopy-600 transition-all duration-base ease-calm"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mx-auto max-w-landing px-12 pt-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-fern">
            Question {questionIndex + 1} / {totalQuestions}
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-container flex-1 flex-col justify-center px-margin-mobile pb-12 pt-5 sm:px-gutter lg:max-w-landing lg:px-8 lg:pb-20 lg:pt-8">
        <div className="mb-6 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[12px] text-ink-faint">
              Question {questionIndex + 1} / {totalQuestions}
            </span>
            <span className="font-sans text-[12px] font-semibold text-ink-soft">{partLabel}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-pill bg-linen-sunken">
            <div
              className="h-full rounded-pill bg-canopy-600 transition-all duration-base ease-calm"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-4 text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            {footerNote || 'Answer at your own pace'}
          </p>
        </div>

        <EditorialMobileBand
          variant="reflection"
          badge="Take your time"
          title={partLabel}
          text="There are no right answers — choose what feels most true to you."
          compact
        />

        <div className="lg:grid lg:grid-cols-[0.95fr_0.85fr] lg:items-center lg:gap-8">
          <div className="surface-card p-6 lg:p-12">{children}</div>

          <aside className="hidden lg:block">
            <div className="demo-card">
              <EditorialArtwork variant="reflection" className="relative z-[1] aspect-[4/4.4] w-full rounded-md" />
              <div className="relative z-[1] px-1 pb-1 pt-5">
                <p className="card-eyebrow">Take your time</p>
                <p className="font-display text-headline-md font-normal text-ink">{partLabel}</p>
                <p className="mt-3 font-sans text-body-md leading-relaxed text-ink-soft">
                  There are no right answers here. Choose the option that feels most true to how you
                  naturally move through work, people, pressure, and recovery.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 font-mono text-[12px] text-ink-faint lg:mt-8">
          {questionIndex + 1} / {totalQuestions} — pick the option that fits best
        </p>

        <p className="mt-3 text-center font-sans text-[13px] text-ink-faint lg:hidden">
          Your progress is saved automatically
        </p>
      </div>

      <div className="hidden lg:block">
        <Footer compact />
      </div>
    </div>
  );
}
