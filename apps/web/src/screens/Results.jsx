import { BURNOUT_LEVEL_COPY } from '@recharge/shared/questions';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import ScoreRing from '../components/results/ScoreRing.jsx';
import TraitBars from '../components/results/TraitBars.jsx';
import RecommendationCard from '../components/results/RecommendationCard.jsx';
import ShareCard from '../components/results/ShareCard.jsx';
import { useShareCard } from '../hooks/useShareCard.js';
import SaveResultsSection from '../components/results/SaveResultsSection.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';

export default function Results({ data, error, onRetake, showSaveSection = true }) {
  const shareToken = data?.shareToken ?? null;
  const shareCardPayload =
    data?.burnout && data?.personality
      ? {
          displayName: data.displayName,
          burnout: data.burnout,
          personality: data.personality,
        }
      : null;
  const { downloading, copied, downloadError, downloadCard, copyLink } = useShareCard(
    shareToken,
    shareCardPayload,
  );

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

  const {
    displayName,
    burnout,
    personality,
    recommendations,
    aiSource,
    persisted,
    persistError,
    sessionId,
    linked,
  } = data;
  const copy = burnout.summary || BURNOUT_LEVEL_COPY[burnout.cls];
  const isPersonalised = aiSource && !['static', 'bank'].includes(aiSource);
  const cloudSaved = persisted !== false;
  const personalityTitle = personality.type?.title || personality.type?.name || 'Your profile';
  const personalitySubtitle = personality.type?.archetype || 'Personality archetype';

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />

      <main className="mx-auto w-full max-w-container flex-1 space-y-stack-gap px-margin-mobile py-stack-gap sm:px-gutter">
        {persisted === false ? (
          <div className="rounded-xl border border-severe/30 bg-severe/5 px-4 py-3 text-center font-sans text-body-md text-on-surface-variant">
            Your results could not be saved to the cloud
            {persistError ? ` (${persistError})` : ''}. Share links and account history will not work
            until database setup is complete.
          </div>
        ) : null}

        <section className="relative overflow-hidden rounded-xl border border-outline-variant/20 bg-white/70 p-6 backdrop-blur-glass">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="hero-badge">Your reset portrait</span>
              <h1 className="mt-5 font-display text-headline-lg text-primary">
                {displayName ? `${displayName}, here is what your energy looks like right now.` : 'Here is what your energy looks like right now.'}
              </h1>
              <p className="mt-4 max-w-xl font-sans text-body-md text-on-surface-variant">
                Your burnout pattern, personality profile, and recovery plan are shown together so the
                advice feels more personal and easier to act on.
              </p>
            </div>
            <EditorialArtwork variant="recovery" className="aspect-[4/3] lg:aspect-[1.1/1]" />
          </div>
        </section>

        <section className="glass-card p-gutter text-center">
          <ScoreRing pct={burnout.pct} cls={burnout.cls} level={burnout.level} />
          <h2 className="mt-6 font-display text-headline-lg text-primary">{burnout.level}</h2>
          {burnout.rawPct != null && burnout.rawPct !== burnout.pct ? (
            <p className="mt-2 font-sans text-label-sm text-on-surface-variant">
              Relative to your personality profile
              {burnout.calibrationNote ? ` · ${burnout.calibrationNote}` : ''}
            </p>
          ) : null}
          <p className="mx-auto mt-4 max-w-md font-sans text-body-md text-on-surface-variant">
            {copy}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card p-gutter">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-2xl text-primary">
                {personality.type?.icon ?? '✨'}
              </div>
              <div>
                <h3 className="font-display text-headline-md text-primary">{personalityTitle}</h3>
                <span className="font-sans text-label-sm text-on-surface-variant">
                  {personalitySubtitle}
                </span>
              </div>
            </div>
            <p className="mb-8 font-sans text-body-md text-on-surface-variant">
              {personality.summary || personality.type?.desc}
            </p>
            <TraitBars traits={personality.traits} />
          </div>

          <div className="glass-card p-4 sm:p-5">
            <EditorialArtwork variant="reflection" className="aspect-[4/3] w-full" />
            <div className="px-2 pb-2 pt-5">
              <p className="font-sans text-label-sm uppercase tracking-[0.08em] text-primary/70">
                Profile moodboard
              </p>
              <p className="mt-2 font-sans text-body-md text-on-surface-variant">
                A visual layer for your result: reflective, calm, and shaped around how you process
                energy, people, pressure, and recovery.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-gutter">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-headline-md text-primary">Strategic recovery</h3>
            <span className="ai-badge">{isPersonalised ? 'Personalised' : 'Curated'}</span>
          </div>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            {recommendations.map((rec, i) => (
              <RecommendationCard
                key={i}
                {...rec}
                className="glass-card p-6 transition-transform hover:scale-[1.02]"
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {shareToken && cloudSaved ? (
            <Button className="w-full" size="lg" onClick={copyLink}>
              {copied ? 'Link copied!' : 'Share results'}
            </Button>
          ) : null}

          <Button variant="secondary" className="w-full" onClick={onRetake}>
            Retake assessment
          </Button>

          {shareToken && cloudSaved ? (
            <>
              <Button variant="ghost" className="w-full" onClick={downloadCard} disabled={downloading}>
                {downloading ? 'Preparing image…' : 'Download share card'}
              </Button>
              {downloadError ? (
                <p className="text-center font-sans text-body-md text-severe">{downloadError}</p>
              ) : null}
            </>
          ) : null}

          {showSaveSection && sessionId ? (
            <SaveResultsSection
              sessionId={sessionId}
              initiallyLinked={linked}
              cloudSaved={cloudSaved}
            />
          ) : null}
        </section>

        {shareToken && cloudSaved ? (
          <div className="flex justify-center overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-soft p-4">
            <ShareCard displayName={displayName} burnout={burnout} personality={personality} />
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
