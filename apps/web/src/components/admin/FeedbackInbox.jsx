import { useEffect, useState } from 'react';
import {
  fetchAdminFeedback,
  updateAdminFeedback,
} from '../../services/api.js';
import { feedbackCategoryLabel } from '@recharge/shared/feedback';
import { formatDate } from '../../lib/formatDate.js';
import Button from '../shared/Button.jsx';

const FILTERS = [
  { id: 'new', label: 'New' },
  { id: 'read', label: 'Read' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];

export default function FeedbackInbox({ getAccessToken }) {
  const [status, setStatus] = useState('new');
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = async (nextStatus = status) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await fetchAdminFeedback(token, nextStatus);
      setItems(data.submissions ?? []);
      setUnread(data.unread ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const patch = async (id, payload) => {
    try {
      const token = await getAccessToken();
      const { submission } = await updateAdminFeedback(token, id, payload);
      setItems((prev) => prev.map((row) => (row.id === id ? submission : row)));
      if (payload.status === 'read' || payload.status === 'archived') {
        setUnread((n) => Math.max(0, n - 1));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="hero-badge">Product</p>
        <h1 className="mt-3 font-display text-headline-lg font-light text-ink">Feedback</h1>
        <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
          Suggestions from people using the assessment, results, and Oma. {unread} new.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatus(f.id)}
            className={`rounded-full border px-3 py-1.5 font-sans text-[13px] ${
              status === f.id
                ? 'border-canopy bg-fern-tint text-canopy'
                : 'border-linen-sunken text-ink-soft hover:border-canopy/40'
            }`}
          >
            {f.label}
            {f.id === 'new' && unread ? ` (${unread})` : ''}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-md border border-signal-red/30 bg-signal-red-tint px-4 py-3 font-sans text-body-md text-ink">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="font-sans text-body-md text-ink-soft">Loading submissions…</p>
      ) : items.length === 0 ? (
        <div className="surface-card p-6">
          <p className="font-sans text-body-md text-ink-soft">
            No submissions in this view yet. The public form is on /feedback, results, and account.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => {
            const open = openId === row.id;
            return (
              <li key={row.id} className="surface-card p-5">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setOpenId(open ? null : row.id)}
                >
                  <div>
                    <p className="font-sans text-[14px] font-semibold text-ink">
                      {feedbackCategoryLabel(row.category)}
                      {row.rating ? ` · ${row.rating}/5` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 font-sans text-body-md text-ink-soft">
                      {row.message}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-ink-faint">
                      {formatDate(row.createdAt)}
                      {row.email ? ` · ${row.email}` : ' · anonymous'}
                      {row.page ? ` · ${row.page}` : ''}
                      {` · ${row.status}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[12px] text-ink-faint">
                    {open ? 'Hide' : 'Open'}
                  </span>
                </button>

                {open ? (
                  <div className="mt-4 border-t border-linen-sunken pt-4">
                    <p className="whitespace-pre-wrap font-sans text-body-md text-ink">{row.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {row.status === 'new' ? (
                        <Button size="sm" variant="secondary" onClick={() => patch(row.id, { status: 'read' })}>
                          Mark read
                        </Button>
                      ) : null}
                      {row.status !== 'archived' ? (
                        <Button size="sm" variant="ghost" onClick={() => patch(row.id, { status: 'archived' })}>
                          Archive
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => patch(row.id, { status: 'new' })}>
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
