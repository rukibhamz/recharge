import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminNewsletterSubscribers,
  sendAdminNewsletter,
  addAdminNewsletterSubscriber,
} from '../../services/api.js';
import Button from '../shared/Button.jsx';
import { relativeAssessmentTime } from '../../lib/formatDate.js';

export default function NewsletterPanel({ getAccessToken }) {
  const [subscribers, setSubscribers] = useState([]);
  const [counts, setCounts] = useState({ subscribed: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await fetchAdminNewsletterSubscribers(token);
      setSubscribers(data.subscribers ?? []);
      setCounts(data.counts ?? { subscribed: 0, unsubscribed: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getAccessToken();
      await addAdminNewsletterSubscriber(token, manualEmail);
      setManualEmail('');
      setMessage('Subscriber added.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleSend = async ({ testOnly }) => {
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getAccessToken();
      const result = await sendAdminNewsletter(token, {
        subject,
        body,
        testOnly,
        testEmail: testOnly ? testEmail : undefined,
      });
      if (testOnly) {
        setMessage(`Test newsletter sent to ${testEmail}.`);
      } else {
        setMessage(
          `Newsletter sent to ${result.sent} subscriber${result.sent === 1 ? '' : 's'}${
            result.failed ? ` (${result.failed} failed)` : ''
          }.`,
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="hero-badge">Audience</p>
        <h1 className="mt-3 font-display text-headline-lg font-light text-ink">Newsletter</h1>
        <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
          People who opted in when emailing their results (or whom you added). Configure SMTP under
          Settings → Email before sending.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">Subscribed</p>
          <p className="mt-2 font-display text-3xl text-ink">{counts.subscribed}</p>
        </div>
        <div className="surface-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            Unsubscribed
          </p>
          <p className="mt-2 font-display text-3xl text-ink">{counts.unsubscribed}</p>
        </div>
      </div>

      <form className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-end" onSubmit={handleAdd}>
        <label className="block flex-1">
          <span className="field-label">Add email manually</span>
          <input
            className="field w-full"
            type="email"
            required
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            placeholder="person@email.com"
          />
        </label>
        <Button type="submit" variant="secondary" disabled={adding}>
          {adding ? 'Adding…' : 'Add'}
        </Button>
      </form>

      <section className="surface-card space-y-4 p-5 sm:p-6">
        <h2 className="font-display text-headline-md font-normal text-ink">Compose</h2>
        <label className="block">
          <span className="field-label">Subject</span>
          <input
            className="field w-full"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A short recovery note"
          />
        </label>
        <label className="block">
          <span className="field-label">Body</span>
          <textarea
            className="field min-h-[180px] w-full"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write in plain language. Line breaks are preserved."
          />
        </label>
        <div className="flex flex-col gap-3 border-t border-linen-sunken pt-4 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="field-label">Test recipient</span>
            <input
              className="field w-full"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@thedigitalerrand.com"
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={sending || !testEmail}
            onClick={() => handleSend({ testOnly: true })}
          >
            Send test
          </Button>
          <Button
            type="button"
            disabled={sending || counts.subscribed < 1}
            onClick={() => {
              if (
                window.confirm(
                  `Send this newsletter to ${counts.subscribed} subscribed address${
                    counts.subscribed === 1 ? '' : 'es'
                  }?`,
                )
              ) {
                handleSend({ testOnly: false });
              }
            }}
          >
            {sending ? 'Sending…' : `Send to ${counts.subscribed}`}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-ink">Subscribers</h2>
        {loading ? (
          <p className="font-sans text-body-md text-ink-soft">Loading…</p>
        ) : subscribers.length === 0 ? (
          <p className="font-sans text-body-md text-ink-soft">No subscribers yet.</p>
        ) : (
          <ul className="divide-y divide-linen-sunken rounded-md border border-linen-sunken bg-white/80">
            {subscribers.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 font-sans text-[14px]"
              >
                <span className="text-ink">{row.email}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                  {row.source} · {relativeAssessmentTime(row.subscribed_at) || '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message ? <p className="font-sans text-body-md text-canopy">{message}</p> : null}
      {error ? (
        <p className="font-sans text-body-md text-signal-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
