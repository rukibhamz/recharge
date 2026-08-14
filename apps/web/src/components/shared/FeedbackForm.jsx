import { useState } from 'react';
import { FEEDBACK_CATEGORIES } from '@recharge/shared/feedback';
import { submitFeedback } from '../../services/api.js';
import Button from '../shared/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function FeedbackForm({ page = 'app', compact = false, className = '' }) {
  const { user, getAccessToken } = useAuth();
  const [category, setCategory] = useState('idea');
  const [rating, setRating] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const token = user ? await getAccessToken() : null;
      await submitFeedback(
        {
          category,
          rating: rating || null,
          message,
          email,
          page,
        },
        token,
      );
      setDone(true);
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className={`surface-card p-5 sm:p-6 ${className}`}>
        <p className="card-eyebrow">Thank you</p>
        <h3 className="mt-1 font-display text-headline-md font-normal text-ink">We have your note</h3>
        <p className="mt-2 font-sans text-body-md text-ink-soft">
          The team reads these and uses them to improve questions, advice, and Oma. You can send
          another suggestion any time.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => setDone(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`surface-card p-5 sm:p-6 ${className}`}>
      <p className="card-eyebrow">Improve Recharge</p>
      <h3 className="mt-1 font-display text-headline-md font-normal text-ink">
        What should we change?
      </h3>
      <p className="mt-2 font-sans text-body-md text-ink-soft">
        Tell us what would make the assessment, results, or coach more useful. Concrete ideas help
        most.
      </p>

      <label className="mt-5 block">
        <span className="field-label">This is about</span>
        <select
          className="mt-1 w-full rounded-md border border-linen-sunken bg-linen-raised px-3 py-2.5 font-sans text-body-md text-ink"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {FEEDBACK_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {!compact ? (
        <fieldset className="mt-4">
          <legend className="field-label">How useful did this feel? (optional)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {['', '1', '2', '3', '4', '5'].map((n) => (
              <button
                key={n || 'skip'}
                type="button"
                onClick={() => setRating(n)}
                className={`rounded-full border px-3 py-1.5 font-sans text-[13px] ${
                  rating === n
                    ? 'border-canopy bg-fern-tint text-canopy'
                    : 'border-linen-sunken text-ink-soft hover:border-canopy/40'
                }`}
              >
                {n ? n : 'Skip'}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="mt-4 block">
        <span className="field-label">Your suggestion</span>
        <textarea
          required
          rows={compact ? 4 : 5}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What would you change, add, or drop?"
          className="mt-1 w-full rounded-md border border-linen-sunken bg-linen-raised px-3 py-2.5 font-sans text-body-md text-ink"
        />
      </label>

      {!user ? (
        <label className="mt-4 block">
          <span className="field-label">Email (optional, if we may follow up)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-linen-sunken bg-linen-raised px-3 py-2.5 font-sans text-body-md text-ink"
          />
        </label>
      ) : null}

      {error ? (
        <p className="mt-3 font-sans text-body-md text-signal-red" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="mt-5" disabled={sending}>
        {sending ? 'Sending…' : 'Send feedback'}
      </Button>
    </form>
  );
}
