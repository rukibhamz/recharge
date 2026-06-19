import { FLOW_STEPS, flowStepIndex } from '../../lib/assessmentFlow.js';

export default function AssessmentFlowBar({ phase, className = '' }) {
  const current = flowStepIndex(phase);
  if (current < 0) return null;

  return (
    <nav
      aria-label="Assessment progress"
      className={`mx-auto w-full max-w-container px-margin-mobile sm:px-gutter ${className}`}
    >
      <ol className="flex items-center justify-between gap-1">
        {FLOW_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-sans text-[11px] font-semibold transition-colors ${
                  done
                    ? 'bg-primary text-on-primary'
                    : active
                      ? 'bg-primary text-on-primary ring-4 ring-primary/15'
                      : 'bg-surface-soft text-on-surface-variant'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`hidden text-center font-sans text-[10px] font-medium uppercase tracking-wide sm:block ${
                  active ? 'text-primary' : 'text-on-surface-variant/70'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center font-sans text-[11px] text-on-surface-variant sm:hidden">
        Step {current + 1} of {FLOW_STEPS.length}: {FLOW_STEPS[current].label}
      </p>
    </nav>
  );
}
