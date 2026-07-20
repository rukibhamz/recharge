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
        <Header />
        <p className="flex flex-1 items-center justify-center font-sans text-body-md text-on-surface-variant">
          Loading shared profile…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center sm:px-gutter">
          <h1 className="font-display text-headline-lg text-primary">Link not found</h1>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">{error}</p>
          <Button className="mt-8" onClick={() => { window.location.href = '/'; }}>
            Take the assessment
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  const { burnout, personality, recommendations } = data;
  const burnoutCopy = burnout.summary || BURNOUT_LEVEL_COPY[burnout.cls];
  const personalitySummary = personality.summary || personality.type?.desc;

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />

      <main className="mx-auto w-full max-w-container flex-1 space-y-stack-gap px-margin-mobile py-stack-gap sm:px-gutter">
        <header className="text-center">
          <p className="font-sans text-label-sm uppercase tracking-[0.14em] text-primary">
            Shared Recharge profile
          </p>
        </header>

        <section className="glass-card p-gutter text-center">
          <ScoreRing pct={burnout.pct ?? 0} cls={burnout.cls} level={burnout.level} />
          <h1 className="mt-6 font-display text-headline-lg text-primary">{burnout.level}</h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-body-md text-on-surface-variant">
            {burnoutCopy}
          </p>
        </section>

        <section className="glass-card p-gutter">
          <PersonalityCard type={personality.type} />
          {personalitySummary ? (
            <p className="mt-6 font-sans text-body-md leading-relaxed text-on-surface-variant">
              {personalitySummary}
            </p>
          ) : null}
          {personality.traits?.length > 0 ? (
            <div className="mt-8">
              <h3 className="mb-4 font-display text-headline-md text-on-surface">Your leanings</h3>
              <TraitBars traits={personality.traits} />
            </div>
          ) : null}
        </section>

        {recommendations?.length > 0 ? (
          <section className="space-y-gutter">
            <h3 className="font-display text-headline-md text-primary">Strategic recovery</h3>
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} {...rec} className="glass-card p-6" />
              ))}
            </div>
          </section>
        ) : null}

        <div className="text-center">
          <Button onClick={() => { window.location.href = '/'; }}>
            Discover your own profile
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
