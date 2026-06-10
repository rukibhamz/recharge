import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { linkSessionToAccount } from '../../services/api.js';
import { setPendingSessionLink } from '../../screens/Login.jsx';
import Button from '../shared/Button.jsx';

export default function SaveResultsSection({ sessionId, initiallyLinked }) {
  const { user, loading: authLoading, getAccessToken, isConfigured } = useAuth();
  const [linked, setLinked] = useState(Boolean(initiallyLinked));
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (linked || authLoading || !user || !sessionId) return;

    let mounted = true;
    setLinking(true);

    (async () => {
      try {
        const token = await getAccessToken();
        await linkSessionToAccount(sessionId, token);
        if (mounted) setLinked(true);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLinking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, sessionId, linked, getAccessToken]);

  if (!isConfigured || !sessionId) return null;

  if (linked) {
    return (
      <div className="surface-card mt-10 p-6 text-center">
        <p className="font-sans text-body-md text-on-surface">
          Saved to your account.
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => { window.location.href = '/history'; }}>
          View all results
        </Button>
      </div>
    );
  }

  if (linking) {
    return (
      <div className="surface-card mt-10 p-6 text-center">
        <p className="font-sans text-body-md text-on-surface-variant">Saving to your account…</p>
      </div>
    );
  }

  return (
    <div className="surface-card mt-10 p-8 text-center">
      <h3 className="font-display text-headline-md text-primary">Keep this result</h3>
      <p className="mt-2 font-sans text-body-md text-on-surface-variant">
        Create a free account to revisit your profile, track changes over time, and unlock future
        phases.
      </p>
      {error ? (
        <p className="mt-3 font-sans text-body-md text-severe" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="mt-6"
        onClick={() => {
          setPendingSessionLink(sessionId);
          window.location.href = `/login?sessionId=${sessionId}`;
        }}
      >
        Save to my account
      </Button>
      <p className="mt-3 font-sans text-label-sm text-on-surface-variant">
        Magic link sign-in — no password required
      </p>
    </div>
  );
}
