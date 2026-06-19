import { BURNOUT_LEVEL_COPY } from '@recharge/shared/questions';
import { firstName } from '@recharge/shared/name';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import ScoreRing from '../components/results/ScoreRing.jsx';
import PersonalityCard from '../components/results/PersonalityCard.jsx';
import TraitBars from '../components/results/TraitBars.jsx';
import RecommendationCard from '../components/results/RecommendationCard.jsx';
import ShareCard from '../components/results/ShareCard.jsx';
import { useShareCard } from '../hooks/useShareCard.js';
import SaveResultsSection from '../components/results/SaveResultsSection.jsx';
import AssessmentFlowBar from '../components/assessment/AssessmentFlowBar.jsx';

export default function Results({ data, error, onRetake, showSaveSection = true }) {
  const shareToken = data?.shareToken;
  const { downloading, copied, downloadCard, copyLink } = useShareCard(shareToken);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center sm:px-gutter">
          <h2 className="font-display text-headline-lg text-primary">Something went wrong</h2>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">{error}</p>
          <Button className="mt-8" onClick={onRetake}>
            Try again
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center sm:px-gutter">
          <h2 className="font-display text-headline-lg text-primary">Session expired</h2>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">
            Your results aren&apos;t available anymore. Please retake the assessment.
          </p>
          <Button className="mt-8" onClick={onRetake}>
            Begin assessment
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  const { displayName, profileContext, burnout, personality, recommendations, aiSource } = data;
  const copy = burnout.summary || BURNOUT_LEVEL_COPY[burnout.cls];
  const greeting = firstName(displayName);
  const isPersonalised = aiSource && !['static', 'bank'].includes(aiSource);

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />

      <section className="mx-auto w-full max-w-container flex-1 px-margin-mobile py-12 sm:px-gutter">
        <AssessmentFlowBar phase="results" className="mb-10" />
        <header className="text-center">
          <h1 className="font-display text-headline-lg text-primary">
            {greeting ? `${greeting}, your Recharge profile` : 'Your Recharge profile'}
          </h1>
          <p className="mt-2 font-sans text-body-md text-on-surface-variant">
            Personalised read — information to guide your next step, not a verdict.
          </p>
          {profileContext ? (
            <p className="mt-2 font-sans text-label-sm text-on-surface-variant/80">
              Personalized for {profileContext.city ? `${profileContext.city}, ` : ''}
              {profileContext.country}
              {profileContext.workContext ? ` · ${profileContext.workContext}` : ''}
              {profileContext.ageBand ? ` · ${profileContext.ageBand}` : ''}
            </p>
          ) : null}
        </header>

        <div className="surface-card mt-10 p-8">
          <ScoreRing pct={burnout.pct} cls={burnout.cls} level={burnout.level} />
          <p className="mt-6 text-center font-sans text-body-md text-on-surface-variant">{copy}</p>
        </div>

        {personality.summary ? (
          <p className="mt-4 text-center font-sans text-body-md leading-relaxed text-on-surface-variant">
            {personality.summary}
          </p>
        ) : null}

        <div className="mt-8">
          <PersonalityCard type={personality.type} />
        </div>

        <div className="surface-card mt-8 p-6">
          <h3 className="mb-4 font-display text-headline-md text-on-surface">Trait dimensions</h3>
          <TraitBars traits={personality.traits} />
        </div>

        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display text-headline-md text-primary">
              Recommendations for {personality.type.name}
            </h3>
            <span className="ai-badge">
              {isPersonalised ? 'Personalised' : 'Curated'}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} {...rec} />
            ))}
          </div>
        </div>

        {showSaveSection && data?.sessionId ? (
          <SaveResultsSection sessionId={data.sessionId} initiallyLinked={data.linked} />
        ) : null}

        {shareToken && (
          <div className="mt-12">
            <h3 className="text-center font-display text-headline-md text-primary">Share your snapshot</h3>
            <p className="mt-2 text-center font-sans text-body-md text-on-surface-variant">
              Download a card or copy a link — your name and exact score stay private.
            </p>

            <div className="mt-6 flex justify-center overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-soft p-4">
              <ShareCard
                displayName={displayName}
                burnout={burnout}
                personality={personality}
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={downloadCard} disabled={downloading}>
                {downloading ? 'Preparing…' : 'Download image'}
              </Button>
              <Button variant="secondary" onClick={copyLink}>
                {copied ? 'Link copied!' : 'Copy share link'}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Button variant="secondary" onClick={onRetake}>
            Retake assessment
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
