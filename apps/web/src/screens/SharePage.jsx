import { useEffect, useState } from 'react';
import { fetchSharedSession } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import PersonalityCard from '../components/results/PersonalityCard.jsx';
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
  const copy = BURNOUT_LEVEL_COPY[burnout.cls];

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />

      <section className="mx-auto w-full max-w-container flex-1 px-margin-mobile py-12 sm:px-gutter">
        <header className="text-center">
          <p className="font-sans text-label-sm uppercase tracking-[0.14em] text-primary">
            Shared Recharge profile
          </p>
          <h1 className="mt-2 font-display text-headline-lg text-primary">{burnout.level}</h1>
          <p className="mt-3 font-sans text-body-md text-on-surface-variant">{copy}</p>
        </header>

        <div className="mt-8">
          <PersonalityCard type={personality.type} />
        </div>

        {recommendations?.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-4 font-display text-headline-md text-primary">Recovery ideas</h3>
            <div className="flex flex-col gap-4">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} {...rec} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Button onClick={() => { window.location.href = '/'; }}>
            Discover your own profile
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
