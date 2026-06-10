import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';

const PENDING_LINK_KEY = 'recharge-pending-session-link';

export function setPendingSessionLink(sessionId) {
  if (sessionId) sessionStorage.setItem(PENDING_LINK_KEY, sessionId);
}

export function consumePendingSessionLink() {
  const id = sessionStorage.getItem(PENDING_LINK_KEY);
  sessionStorage.removeItem(PENDING_LINK_KEY);
  return id;
}

export default function Login() {
  const { signInWithOtp, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('sessionId');
    if (sessionId) setPendingSessionLink(sessionId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithOtp(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header />
        <section className="mx-auto max-w-md flex-1 px-margin-mobile py-16 text-center sm:px-gutter">
          <h1 className="font-display text-headline-lg text-primary">Sign-in unavailable</h1>
          <p className="mt-4 font-sans text-body-md text-on-surface-variant">
            Account features require Supabase configuration. Add{' '}
            <code className="text-primary">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-primary">VITE_SUPABASE_ANON_KEY</code> to your environment.
          </p>
          <Button className="mt-8" onClick={() => { window.location.href = '/'; }}>
            Back home
          </Button>
        </section>
        <Footer compact />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header />

      <section className="mx-auto w-full max-w-md flex-1 px-margin-mobile py-12 sm:px-gutter">
        <header className="text-center">
          <h1 className="font-display text-headline-lg text-primary">Save your results</h1>
          <p className="mt-3 font-sans text-body-md text-on-surface-variant">
            Sign in with a magic link — no password. Your assessment history stays private to you.
          </p>
        </header>

        {sent ? (
          <div className="surface-card mt-10 p-8 text-center">
            <p className="font-sans text-body-md text-on-surface">
              Check your inbox for a sign-in link.
            </p>
            <p className="mt-2 font-sans text-body-md text-on-surface-variant">
              After you confirm, we&apos;ll save this result to your account.
            </p>
          </div>
        ) : (
          <form className="surface-card mt-10 p-8" onSubmit={handleSubmit}>
            <label className="block font-sans text-body-md text-on-surface" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 font-sans text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {error ? (
              <p className="mt-3 font-sans text-body-md text-severe" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="mt-6 w-full" disabled={submitting}>
              {submitting ? 'Sending link…' : 'Send magic link'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center">
          <a href="/" className="font-sans text-body-md text-primary hover:underline">
            Back to assessment
          </a>
        </p>
      </section>

      <Footer compact />
    </div>
  );
}
