import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import LoadingDots from '../components/shared/LoadingDots.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';

export default function QuestionLoading({ phase, messages, badge = 'Crafting your questions' }) {
  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="processing-mobile" />
      <div className="hidden lg:block">
        <Header />
      </div>

      {phase ? (
        <div className="pt-6">
          <AssessmentFlowBar phase={phase} />
        </div>
      ) : null}

      <section className="mx-auto flex max-w-landing flex-1 items-center px-margin-mobile py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="text-center lg:text-left">
            <LoadingDots />
            <h1 className="mt-10 max-w-lg font-display text-headline-lg-mobile text-primary lg:text-headline-lg">
              {messages[0]}
            </h1>
            <p className="mt-3 font-sans text-body-md text-on-surface-variant">{messages[1]}</p>
            <span className="ai-badge mt-8">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3l1.2 3.6L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z" fill="currentColor" />
              </svg>
              {badge}
            </span>
          </div>

          <div className="glass-card hidden p-5 lg:block">
            <EditorialArtwork variant="hero" className="aspect-[1.1/1] w-full" />
          </div>
        </div>
      </section>

      <Footer compact />
    </div>
  );
}
