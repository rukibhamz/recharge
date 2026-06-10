import Header from '../shared/Header.jsx';
import Footer from '../shared/Footer.jsx';
import Logo from '../shared/Logo.jsx';

export default function AssessmentShell({
  partLabel,
  questionIndex,
  totalQuestions,
  onBack,
  onClose,
  children,
}) {
  const pct = Math.round(((questionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="assessment-mobile" onBack={onBack} onClose={onClose} />

      <header className="hidden border-b border-outline-variant/30 lg:block">
        <div className="mx-auto flex max-w-landing items-center justify-between px-12 py-6">
          <Logo />
          <div className="text-right font-sans">
            <p className="text-body-md font-medium text-primary">{partLabel}</p>
            <p className="text-body-md text-on-surface-variant">{pct}% Complete</p>
          </div>
        </div>
      </header>

      <div className="hidden lg:block">
        <div className="h-1 bg-surface-soft">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mx-auto max-w-landing px-12 pt-4">
          <p className="font-sans text-label-sm uppercase tracking-[0.14em] text-primary">
            Question {questionIndex + 1} of {totalQuestions}
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-container flex-1 flex-col justify-center px-margin-mobile pb-12 pt-5 sm:px-gutter lg:max-w-assess lg:px-8 lg:pb-20 lg:pt-8">
        <div className="mb-6 lg:hidden">
          <div className="mb-2 flex items-center justify-between font-sans text-label-sm text-on-surface-variant">
            <span>
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            <span>{partLabel}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-soft">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-4 text-center font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
            Adaptive path active
          </p>
        </div>

        <div className="surface-card rounded-xl p-6 lg:rounded-xl lg:p-12">{children}</div>

        <p className="mt-6 flex items-center justify-center gap-2 font-sans text-body-md text-on-surface-variant/80 lg:mt-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 10v5M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          This data helps us calibrate your recovery journey.
        </p>

        <p className="mt-3 text-center font-sans text-[13px] text-on-surface-variant/70 lg:hidden">
          Your progress is saved automatically
        </p>
      </div>

      <div className="hidden lg:block">
        <Footer compact />
      </div>
    </div>
  );
}
