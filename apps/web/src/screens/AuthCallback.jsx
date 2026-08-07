import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { linkSessionToAccount } from '../services/api.js';
import { consumePendingSessionLink } from './Login.jsx';
import Header from '../components/shared/Header.jsx';
import PageLoadingState from '../components/shared/PageLoadingState.jsx';
import EditorialArtwork from '../components/shared/EditorialArtwork.jsx';

/** Guard against React StrictMode double-mount consuming a one-time PKCE code twice. */
let callbackHandled = false;

async function completeSignIn(session) {
  const pendingSessionId = consumePendingSessionLink();
  if (pendingSessionId) {
    try {
      await linkSessionToAccount(pendingSessionId, session.access_token);
      window.location.replace(`/history/${pendingSessionId}?linked=1`);
      return;
    } catch (err) {
      console.error('Pending link failed:', err.message);
      window.location.replace(`/account?linkError=${encodeURIComponent(err.message)}`);
      return;
    }
  }
  window.location.replace('/account');
}

/**
 * Resolve a session from the magic-link redirect (PKCE ?code= or hash tokens).
 */
async function resolveSessionFromUrl() {
  if (!supabase) return { session: null, error: new Error('Sign-in is not configured.') };

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const urlError =
    params.get('error_description') ||
    params.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error');
  if (urlError) {
    return { session: null, error: new Error(decodeURIComponent(urlError.replace(/\+/g, ' '))) };
  }

  // Prefer an already-established session (e.g. after the first StrictMode pass).
  const existing = await supabase.auth.getSession();
  if (existing.data?.session) {
    return { session: existing.data.session, error: null };
  }
  if (existing.error) {
    return { session: null, error: existing.error };
  }

  const code = params.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Code may already have been exchanged by a concurrent mount — re-check session.
      const retry = await supabase.auth.getSession();
      if (retry.data?.session) return { session: retry.data.session, error: null };
      return { session: null, error };
    }
    return { session: data.session ?? null, error: null };
  }

  return { session: null, error: null };
}

export default function AuthCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setError('Sign-in is not configured.');
      return undefined;
    }

    let cancelled = false;

    const finish = async (session) => {
      if (cancelled || !session || callbackHandled) return;
      callbackHandled = true;
      try {
        await completeSignIn(session);
      } catch (err) {
        callbackHandled = false;
        if (!cancelled) setError(err.message);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        finish(session);
      }
    });

    resolveSessionFromUrl().then(({ session, error: sessionError }) => {
      if (cancelled) return;
      if (session) {
        finish(session);
        return;
      }
      if (sessionError) setError(sessionError.message);
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled && !callbackHandled) {
        setError('Sign-in timed out. Request a new magic link.');
      }
    }, 20000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <section className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 text-center sm:px-gutter">
          <div className="editorial-frame w-full max-w-xs">
            <EditorialArtwork variant="reflection" />
          </div>
          <div className="surface-card w-full p-8">
            <p className="font-sans text-body-md text-signal-red">{error}</p>
            <a
              href="/login"
              className="mt-6 inline-block font-sans text-body-md text-primary hover:underline"
            >
              Try again
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PageLoadingState message="Completing sign-in…" artworkVariant="reflection" />
    </div>
  );
}
