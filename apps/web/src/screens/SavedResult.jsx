import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchSavedSession } from '../services/api.js';
import Results from './Results.jsx';
import Header from '../components/shared/Header.jsx';
import LoadingDots from '../components/shared/LoadingDots.jsx';
import Button from '../components/shared/Button.jsx';
import Footer from '../components/shared/Footer.jsx';

export default function SavedResult({ sessionId }) {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const linkedBanner = useMemo(
    () => new URLSearchParams(window.location.search).get('linked') === '1',
    [],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.replace(`/login?sessionId=${sessionId}`);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const token = await getAccessToken();
        const saved = await fetchSavedSession(sessionId, token);
        if (mounted) {
          setData({
            ...saved,
            linked: true,
            aiSource: 'static',
          });
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, getAccessToken, sessionId]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="account" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <LoadingDots />
          <p className="font-sans text-body-md text-on-surface-variant">Loading your result…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="account" />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center">
          <h2 className="font-display text-headline-lg text-primary">Result not found</h2>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">{error}</p>
          <Button className="mt-8" onClick={() => { window.location.href = '/account'; }}>
            Back to account
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  return (
    <>
      {linkedBanner ? (
        <div className="border-b border-status-healthy/30 bg-status-healthy/10 px-margin-mobile py-3 text-center font-sans text-body-md text-on-surface">
          Saved to your account.
        </div>
      ) : null}
      <Results
        data={data}
        error={null}
        onRetake={() => { window.location.href = '/'; }}
        showSaveSection={false}
      />
    </>
  );
}
