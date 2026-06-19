import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';

const RETRY_HINTS = {
  'loading-personality-test': 'We could not build your personality interview. Check your connection and try again.',
  'scoring-personality': 'We could not analyse your personality answers. Please try again.',
  'loading-burnout-test': 'We could not build your burnout check-in. Please try again.',
  processing: 'We could not finish your assessment. Please try again.',
};

export default function AssessmentError({ error, errorPhase, onRetry, onStartOver }) {
  const hint = RETRY_HINTS[errorPhase] ?? 'Something interrupted your assessment.';

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />
      <section className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-margin-mobile py-16 text-center sm:px-gutter">
        <div className="surface-card p-8">
          <h2 className="font-display text-headline-lg text-primary">Let&apos;s try that again</h2>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">{hint}</p>
          {error ? (
            <p className="mt-3 font-sans text-[13px] text-on-surface-variant/70">{error}</p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {errorPhase && onRetry ? (
              <Button onClick={onRetry}>Retry</Button>
            ) : null}
            <Button variant="secondary" onClick={onStartOver}>
              Start over
            </Button>
          </div>
        </div>
      </section>
      <Footer compact />
    </div>
  );
}
