import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchHistory, downloadAccountExport, deleteAccount } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import { formatDate, relativeAssessmentTime, burnoutMoodIcon } from '../lib/formatDate.js';
import { firstName } from '@recharge/shared/name';

const REMINDER_KEY = 'recharge-reminder-days';

export default function AccountSettings() {
  const { user, loading: authLoading, getAccessToken, isConfigured, signOut } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderDays, setReminderDays] = useState(() => {
    const saved = localStorage.getItem(REMINDER_KEY);
    return saved ? Number(saved) : 30;
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionError, setActionError] = useState(null);

  const linkError = useMemo(
    () => new URLSearchParams(window.location.search).get('linkError'),
    [],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const token = await getAccessToken();
        const { sessions: items } = await fetchHistory(token);
        if (mounted) setSessions(items ?? []);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, getAccessToken]);

  const displayName =
    sessions[0]?.displayName?.trim() || firstName(user?.email?.split('@')[0]) || 'Your profile';
  const lastAssessment = sessions[0]?.createdAt;

  const selectReminder = (days) => {
    setReminderDays(days);
    localStorage.setItem(REMINDER_KEY, String(days));
  };

  const handleExport = async () => {
    setActionError(null);
    setExporting(true);
    try {
      const token = await getAccessToken();
      await downloadAccountExport(token);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setActionError(null);
    setDeleting(true);
    try {
      const token = await getAccessToken();
      await deleteAccount(token);
      await signOut();
      window.location.href = '/';
    } catch (err) {
      setActionError(err.message);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="account" />
        <section className="mx-auto max-w-container flex-1 px-margin-mobile py-16 text-center">
          <p className="font-sans text-body-md text-on-surface-variant">
            Account features are not configured.
          </p>
        </section>
        <Footer compact />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-warm">
        <Header variant="account" />
        <p className="flex flex-1 items-center justify-center font-sans text-body-md text-on-surface-variant">
          Loading your account…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="account" />

      <main className="mx-auto w-full max-w-container flex-1 space-y-stack-gap px-margin-mobile pb-32 pt-8 sm:px-gutter">
        {linkError ? (
          <div className="rounded-xl border border-severe/30 bg-severe/5 px-4 py-3 font-sans text-body-md text-on-surface-variant">
            Could not link your latest result: {linkError}. Complete a new assessment and try
            saving again.
          </div>
        ) : null}

        {error ? (
          <p className="font-sans text-body-md text-severe" role="alert">
            {error}
          </p>
        ) : null}

        <section className="glass-card p-gutter">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-secondary-container text-primary shadow-sm">
              <span className="font-display text-headline-lg">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-headline-lg text-primary">{displayName}</h1>
              <p className="font-sans text-body-md text-on-surface-variant">{user.email}</p>
              {lastAssessment ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 font-sans text-label-sm text-on-secondary-container">
                  <span aria-hidden="true">✓</span>
                  Last assessment: {relativeAssessmentTime(lastAssessment)}
                </div>
              ) : (
                <p className="mt-2 font-sans text-body-md text-on-surface-variant">
                  No saved assessments yet.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-headline-md text-primary">Recent assessments</h2>
            {sessions.length > 1 ? (
              <span className="font-sans text-label-sm text-on-surface-variant">
                {sessions.length} saved
              </span>
            ) : null}
          </div>

          {sessions.length === 0 ? (
            <div className="glass-card p-gutter text-center">
              <p className="font-sans text-body-md text-on-surface-variant">
                Complete an assessment and save it to your account to see history here.
              </p>
              <Button className="mt-6" onClick={() => { window.location.href = '/'; }}>
                Take assessment
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessions.slice(0, 5).map((item) => {
                const mood = burnoutMoodIcon(item.burnout?.cls);
                return (
                  <a
                    key={item.sessionId}
                    href={`/history/${item.sessionId}`}
                    className="glass-card group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-surface-bright"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${mood.tone}`}
                      >
                        <span className="text-xl" aria-hidden="true">
                          {item.burnout?.cls === 'healthy' ? '🙂' : item.burnout?.cls === 'severe' ? '😔' : '😐'}
                        </span>
                      </div>
                      <div>
                        <p className="font-sans text-label-sm text-on-surface-variant">
                          {formatDate(item.createdAt)}
                        </p>
                        <p className="font-sans text-body-md font-medium text-on-surface">
                          {item.burnout?.level ?? 'Assessment result'}
                        </p>
                        <p className="font-sans text-body-md text-on-surface-variant">
                          {item.personality?.type?.name ?? 'Personality profile'}
                        </p>
                      </div>
                    </div>
                    <span className="text-on-surface-variant transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-headline-md text-primary">Wellness reminders</h2>
          <div className="glass-card space-y-6 p-gutter">
            <p className="font-sans text-body-md text-on-surface-variant">
              Set your re-assessment frequency to maintain a healthy balance.
            </p>
            <div className="flex flex-wrap gap-3">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => selectReminder(days)}
                  className={`rounded-full border-2 px-6 py-3 font-sans text-label-sm transition-all ${
                    reminderDays === days
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant bg-transparent text-on-surface-variant hover:border-primary/30'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
              <div>
                <p className="font-sans text-body-md font-medium">Push notifications</p>
                <p className="font-sans text-label-sm text-on-surface-variant">
                  Receive reminders on this device
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pushEnabled}
                onClick={() => setPushEnabled((v) => !v)}
                className={`relative h-6 w-12 rounded-full p-1 transition-colors ${
                  pushEnabled ? 'bg-primary' : 'bg-surface-dim'
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-headline-md text-primary">Security</h2>
          <div className="glass-card divide-y divide-outline-variant/30 p-gutter">
            <div className="flex items-center justify-between py-4 first:pt-0">
              <div>
                <p className="font-sans text-body-md font-medium">Login method</p>
                <p className="font-sans text-label-sm text-on-surface-variant">
                  Password-less magic links
                </p>
              </div>
              <a href="/login" className="font-sans text-label-sm text-primary underline">
                Change email
              </a>
            </div>
            <div className="flex items-center justify-between py-4 last:pb-0">
              <div>
                <p className="font-sans text-body-md font-medium">Sign out</p>
                <p className="font-sans text-label-sm text-on-surface-variant">
                  End your session on this device
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut().then(() => { window.location.href = '/'; })}
                className="font-sans text-label-sm text-primary underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-headline-md text-primary">Data &amp; privacy</h2>
          <div className="glass-card space-y-6 p-gutter">
            <div className="flex items-start gap-4 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
              <span className="text-primary-container" aria-hidden="true">
                ✓
              </span>
              <p className="font-sans text-body-md">
                Your data is encrypted and handled in strict accordance with GDPR. Read our{' '}
                <a href="/privacy" className="text-primary underline">
                  privacy policy
                </a>
                .
              </p>
            </div>
            {actionError ? (
              <p className="font-sans text-body-md text-severe" role="alert">
                {actionError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex w-full items-center justify-between rounded-lg border border-outline-variant/30 bg-white p-4 transition-colors hover:bg-surface-bright disabled:opacity-50"
            >
              <span className="font-sans text-body-md">Request personal data archive</span>
              <span className="font-sans text-label-sm text-on-surface-variant">
                {exporting ? 'Preparing…' : '.JSON'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-error/10 bg-error-container/20 p-4 text-error transition-colors hover:bg-error-container/40"
            >
              <span className="font-sans text-body-md font-medium">Delete account &amp; permanent erasure</span>
            </button>
            <Button variant="secondary" className="w-full" onClick={() => { window.location.href = '/'; }}>
              New assessment
            </Button>
          </div>
        </section>
      </main>

      {showDeleteModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-lg bg-white p-gutter shadow-2xl">
            <h3 className="font-display text-headline-md text-primary">Are you sure?</h3>
            <p className="mt-2 font-sans text-body-md text-on-surface-variant">
              This permanently deletes your account and saved result links. Assessment rows may
              remain anonymised in our database.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="w-full !bg-error !text-white"
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
