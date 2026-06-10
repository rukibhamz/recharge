import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchHistory } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import { BURNOUT_LEVEL_COPY } from '@recharge/shared/questions';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HistoryPage() {
  const { user, loading: authLoading, getAccessToken, isConfigured } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const token = await getAccessToken();
        const { sessions: items } = await fetchHistory(token);
        if (mounted) setSessions(items ?? []);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, getAccessToken]);

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="account" />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center">
          <p className="font-sans text-body-md text-on-surface-variant">
            Account features are not configured.
          </p>
        </section>
        <Footer compact />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="account" />
        <p className="flex flex-1 items-center justify-center font-sans text-body-md text-on-surface-variant">
          Loading your results…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="account" />

      <section className="mx-auto w-full max-w-container flex-1 px-margin-mobile py-12 sm:px-gutter">
        <header>
          <h1 className="font-display text-headline-lg text-primary">Your saved results</h1>
          <p className="mt-2 font-sans text-body-md text-on-surface-variant">
            Signed in as {user.email}
          </p>
        </header>

        {error ? (
          <p className="mt-8 font-sans text-body-md text-severe" role="alert">
            {error}
          </p>
        ) : null}

        {sessions.length === 0 && !error ? (
          <div className="surface-card mt-10 p-8 text-center">
            <p className="font-sans text-body-md text-on-surface-variant">
              No saved assessments yet. Complete the assessment and save your results to build
              history.
            </p>
            <Button className="mt-6" onClick={() => { window.location.href = '/'; }}>
              Take assessment
            </Button>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {sessions.map((item) => (
              <li key={item.sessionId}>
                <a
                  href={`/history/${item.sessionId}`}
                  className="surface-card block p-6 transition hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-headline-md text-on-surface">
                        {item.personality?.type?.name ?? 'Your profile'}
                      </p>
                      <p className="mt-1 font-sans text-body-md text-on-surface-variant">
                        {item.burnout?.level}
                      </p>
                      <p className="mt-2 font-sans text-body-md text-on-surface-variant">
                        {BURNOUT_LEVEL_COPY[item.burnout?.cls] ?? ''}
                      </p>
                    </div>
                    <time
                      className="font-sans text-label-sm text-on-surface-variant"
                      dateTime={item.createdAt}
                    >
                      {formatDate(item.createdAt)}
                    </time>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 text-center">
          <Button variant="secondary" onClick={() => { window.location.href = '/'; }}>
            New assessment
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
