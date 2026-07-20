import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { linkSessionToAccount } from '../../services/api.js';
import { setPendingSessionLink } from '../../screens/Login.jsx';
import Button from '../shared/Button.jsx';

export default function SaveResultsSection({ sessionId, initiallyLinked, cloudSaved = true }) {
  const { user, loading: authLoading, getAccessToken, isConfigured, signInWithOtp } = useAuth();
  const [linked, setLinked] = useState(Boolean(initiallyLinked));
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cloudSaved || linked || authLoading || !user || !sessionId) return;

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
  }, [user, authLoading, sessionId, linked, getAccessToken, cloudSaved]);

  if (!isConfigured || !sessionId) return null;

  if (!cloudSaved) {
    return (
      <div className="glass-card mt-4 p-gutter">
        <p className="font-sans text-label-sm uppercase tracking-wide text-on-surface-variant">
          Save to history
        </p>
        <p className="mt-2 font-sans text-body-md text-on-surface-variant">
          This result was not saved to the cloud yet, so it cannot be linked to your account.
          Retake the assessment after database setup is complete.
        </p>
      </div>
    );
  }

  if (linked) {
    return (
      <div className="glass-card mt-4 p-gutter text-center">
        <p className="font-sans text-body-md text-on-surface">Saved to your account.</p>
        <Button className="mt-4" variant="secondary" onClick={() => { window.location.href = '/account'; }}>
          View account
        </Button>
      </div>
    );
  }

  if (linking) {
    return (
      <div className="glass-card mt-4 p-gutter text-center">
        <p className="font-sans text-body-md text-on-surface-variant">Saving to your account…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="glass-card mt-4 p-gutter text-center">
        <p className="font-sans text-body-md text-on-surface-variant">
          Linking this result to your account…
        </p>
        {error ? (
          <p className="mt-3 font-sans text-body-md text-severe" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setPendingSessionLink(sessionId);
      await signInWithOtp(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card mt-4 flex flex-col gap-4 p-gutter">
      <label className="font-sans text-label-sm uppercase tracking-wide text-on-surface-variant">
        Save to history (optional)
      </label>

      {sent ? (
        <p className="font-sans text-body-md text-on-surface">
          Check your inbox for a magic link. After you sign in, this result will appear in your
          account.
        </p>
      ) : (
        <form className="flex gap-2" onSubmit={handleSave}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 rounded-full border border-outline-variant bg-surface px-6 py-3 font-sans text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            aria-label="Send magic link"
          >
            →
          </button>
        </form>
      )}

      {error ? (
        <p className="font-sans text-body-md text-severe" role="alert">
          {error}
        </p>
      ) : null}

      {!sent ? (
        <p className="font-sans text-label-sm text-on-surface-variant">
          Magic link sign-in — no password required
        </p>
      ) : null}
    </div>
  );
}
