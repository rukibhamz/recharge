import { useEffect, useState } from 'react';
import { fetchSharedSession } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import ScoreRing from '../components/results/ScoreRing.jsx';
import PersonalityCard from '../components/results/PersonalityCard.jsx';
import TraitBars from '../components/results/TraitBars.jsx';
import RecommendationCard from '../components/results/RecommendationCard.jsx';
import { BURNOUT_LEVEL_COPY } from '@recharge/shared/questions';
import {
  DEFAULT_RECOVERY_TIPS,
  normalizeRecommendationsList,
} from '@recharge/shared/recommendations';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';
import PageLoadingState from '../components/shared/PageLoadingState.jsx';

export default function SharePage({ shareToken }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedSession(shareToken)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="share" />
        <PageLoadingState message="Loading shared profile…" artworkVariant="recovery" />
        <Footer compact />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="share" />
        <section className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <EditorialArtwork variant="reflection" className="mx-auto mb-8 aspect-[4/3] w-full max-w-xs rounded-xl" />
          <h1 className="font-display text-headline-md text-primary sm:text-headline-lg">
            Link not found
          </h1>
          <p className="mt-3 font-sans text-body-md text-on-surface-variant">
            {error || 'This shared result may have expired or the link might be incorrect.'}{' '}
            Try asking for a new link, or take your own assessment.
          </p>
          <Button className="mt-8" onClick={() => { window.location.href = '/'; }}>
            Take the assessment
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  const { burnout, personality, recommendations: rawRecommendations } = data;
  const recommendations = normalizeRecommendationsList(rawRecommendations ?? [], DEFAULT_RECOVERY_TIPS);
  const burnoutCopy = burnout.summary || BURNOUT_LEVEL_COPY[burnout.cls];
  const personalitySummary = personality.summary || personality.type?.desc;

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="share" />

      <main className="mx-auto w-full max-w-container flex-1 space-y-6 px-4 py-6 sm:space-y-stack-gap sm:px-gutter sm:py-stack-gap">
        {/* Hero banner — stacked on mobile, side-by-side on large */}
        <section className="relative overflow-hidden rounded-xl border border-outline-variant/20 bg-white/70 p-4 backdrop-blur-glass sm:p-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <header className="text-center lg:text-left">
              <span className="hero-badge">Shared profile</span>
              <h1 className="mt-4 font-display text-headline-md text-primary sm:mt-5 sm:text-headline-lg">
                A snapshot of someone&apos;s energy and recovery fit.
              </h1>
              <p className="mt-2 font-sans text-body-md text-on-surface-variant sm:mt-3 sm:text-body-md">
                Burnout level, personality pattern, and recovery ideas — shared with care.
              </p>
            </header>
            <EditorialArtwork variant="recovery" className="hidden aspect-[4/3] sm:block lg:aspect-[1.1/1]" />
          </div>
        </section>

        {/* Burnout score */}
        <section className="glass-card p-4 text-center sm:p-gutter">
          <ScoreRing pct={burnout.pct ?? 0} cls={burnout.cls} level={burnout.level} />
          <h1 className="mt-4 font-display text-headline-md text-primary sm:mt-6 sm:text-headline-lg">
            {burnout.level}
          </h1>
          <p className="mx-auto mt-3 max-w-md font-sans text-body-md text-on-surface-variant sm:mt-4 sm:text-body-md">
            {burnoutCopy}
          </p>
        </section>

        {/* Personality */}
        <section className="glass-card p-4 sm:p-gutter">
          <PersonalityCard type={personality.type} />
          {personalitySummary ? (
            <p className="mt-4 font-sans text-body-md leading-relaxed text-on-surface-variant sm:mt-6 sm:text-body-md">
              {personalitySummary}
            </p>
          ) : null}
          {personality.traits?.length > 0 ? (
            <div className="mt-6 sm:mt-8">
              <h3 className="mb-3 font-display text-body-lg font-medium text-on-surface sm:mb-4 sm:text-headline-md">
                Your leanings
              </h3>
              <TraitBars traits={personality.traits} />
            </div>
          ) : null}
        </section>

        {/* Recommendations */}
        {recommendations?.length > 0 ? (
          <section className="space-y-4 sm:space-y-gutter">
            <h3 className="font-display text-body-lg font-medium text-primary sm:text-headline-md">
              Recovery roadmap
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-gutter md:grid-cols-2">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} {...rec} className="glass-card p-4 sm:p-6" />
              ))}
            </div>
          </section>
        ) : null}

        <div className="pb-2 text-center">
          <Button onClick={() => { window.location.href = '/'; }}>
            Discover your own profile
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
