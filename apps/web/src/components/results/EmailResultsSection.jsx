import { useState } from 'react';
import { emailAssessmentResults } from '../../services/api.js';
import Button from '../shared/Button.jsx';

/**
 * Email results summary + optional newsletter opt-in on the results screen.
 */
export default function EmailResultsSection({ sessionId, defaultEmail = '', cloudSaved = true }) {
  const [email, setEmail] = useState(defaultEmail);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  if (!sessionId || !cloudSaved) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await emailAssessmentResults({
        sessionId,
        email,
        newsletterOptIn,
      });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-md border border-linen-sunken bg-white/80 p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-fern">Email</p>
      <h3 className="mt-1 font-display text-headline-md font-normal text-ink">
        Send results to your inbox
      </h3>
      <p className="mt-2 font-sans text-body-md text-ink-soft">
        Get a copy of your burnout score, profile, and Day 1 plan. Optional: hear from us when we
        publish recovery notes.
      </p>

      {sent ? (
        <p className="mt-4 font-sans text-body-md text-ink">
          Sent. Check your inbox (and spam folder) for your results
          {newsletterOptIn ? ' — you are also on the newsletter list' : ''}.
        </p>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="field-label">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="field w-full"
            />
          </label>
          <label className="flex items-start gap-3 font-sans text-[14px] text-ink-soft">
            <input
              type="checkbox"
              className="mt-1"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
            />
            <span>
              Also send occasional Recharge updates and recovery notes. Unsubscribe anytime.
            </span>
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Email my results'}
          </Button>
        </form>
      )}

      {error ? (
        <p className="mt-3 font-sans text-body-md text-signal-red" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
