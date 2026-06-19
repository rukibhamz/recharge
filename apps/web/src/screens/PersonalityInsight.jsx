import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';
import PersonalityCard from '../components/results/PersonalityCard.jsx';
import TraitBars from '../components/results/TraitBars.jsx';

export default function PersonalityInsight({ personality, userName, onContinue, onBack, onClose }) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="assessment-mobile" onBack={onBack} onClose={onClose} />

      <div className="mx-auto w-full max-w-container flex-1 px-margin-mobile pb-12 pt-6 sm:px-gutter lg:max-w-assess lg:px-8">
        <AssessmentFlowBar phase="personality-insight" className="mb-8" />

        <div className="text-center">
          <span className="ai-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l1.2 3.6L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z" fill="currentColor" />
            </svg>
            AI personality read
          </span>
          <h1 className="mt-6 font-display text-headline-lg-mobile text-primary lg:text-headline-lg">
            {firstName ? `${firstName}, here's what we learned` : "Here's what we learned"}
          </h1>
          <p className="mt-3 font-sans text-body-md text-on-surface-variant">
            This shapes your burnout check-in next — answer honestly, and we&apos;ll tailor what
            follows.
          </p>
        </div>

        <div className="mt-8">
          <PersonalityCard type={personality.type} />
        </div>

        {personality.summary ? (
          <p className="mt-6 text-center font-sans text-body-md leading-relaxed text-on-surface-variant">
            {personality.summary}
          </p>
        ) : null}

        {personality.traits?.length > 0 ? (
          <div className="surface-card mt-8 p-6">
            <h3 className="mb-4 font-display text-headline-md text-on-surface">Your leanings</h3>
            <TraitBars traits={personality.traits} />
          </div>
        ) : null}

        <Button className="mt-10 w-full" size="lg" onClick={onContinue}>
          Continue to burnout check-in
        </Button>
      </div>

      <Footer compact />
    </div>
  );
}
