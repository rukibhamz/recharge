import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { linkSessionToAccount } from '../services/api.js';
import { consumePendingSessionLink } from './Login.jsx';
import Header from '../components/shared/Header.jsx';
import LoadingDots from '../components/shared/LoadingDots.jsx';

async function completeSignIn(session) {
  const pendingSessionId = consumePendingSessionLink();
  if (pendingSessionId) {
    try {
      await linkSessionToAccount(pendingSessionId, session.access_token);
    } catch (err) {
      console.error('Pending link failed:', err.message);
      window.location.replace(`/history?linkError=${encodeURIComponent(err.message)}`);
      return;
    }
  }
  window.location.replace('/history');
}

export default function AuthCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setError('Sign-in is not configured.');
      return undefined;
    }

    let finished = false;

    const finish = async (session) => {
      if (finished || !session) return;
      finished = true;
      try {
        await completeSignIn(session);
      } catch (err) {
        setError(err.message);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        finish(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (session) finish(session);
    });

    const timeout = window.setTimeout(() => {
      if (!finished) setError('Sign-in timed out. Request a new magic link.');
    }, 15000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header />
        <p className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center font-sans text-body-md text-severe">
          {error}
          <a href="/login" className="text-primary hover:underline">
            Try again
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <LoadingDots />
        <p className="font-sans text-body-md text-on-surface-variant">Completing sign-in…</p>
      </div>
    </div>
  );
}
