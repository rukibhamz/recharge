import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchHistory, downloadAccountExport, deleteAccount } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import Button from '../components/shared/Button.jsx';
import { formatDate, relativeAssessmentTime, burnoutMoodIcon } from '../lib/formatDate.js';
import { firstName } from '@recharge/shared/name';
import { COACH_NAME } from '@recharge/shared/coachPersona';
import PageLoadingState from '../components/shared/PageLoadingState.jsx';
import CoachChatPanel from '../components/account/CoachChatPanel.jsx';
import AccountDashboard from '../components/account/AccountDashboard.jsx';
import FeedbackForm from '../components/shared/FeedbackForm.jsx';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.js';
import { useIsAdmin } from '../hooks/useIsAdmin.js';

const REMINDER_KEY = 'recharge-reminder-days';

export default function AccountSettings() {
  const { user, loading: authLoading, getAccessToken, isConfigured, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [coachOpen, setCoachOpen] = useState(false);
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const linkError = useMemo(
    () => new URLSearchParams(window.location.search).get('linkError'),
    [],
  );

  const loadHistory = useCallback(async () => {
    if (authLoading || !user) return;
    try {
      const token = await getAccessToken();
      const { sessions: items } = await fetchHistory(token);
      setSessions(items ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, getAccessToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }
    setLoading(true);
    loadHistory();
  }, [user, authLoading, loadHistory]);

  useRefreshOnFocus(loadHistory, Boolean(user) && !authLoading);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setCoachOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const latest = sessions[0] ?? null;
  const displayName =
    latest?.displayName?.trim() || firstName(user?.email?.split('@')[0]) || 'there';
  const helloName = firstName(displayName) || displayName;

  const navItems = useMemo(() => {
    const items = [
      { id: 'overview', label: 'Overview', icon: 'user', href: '/account', active: true },
      { id: 'assessment', label: 'Assessment', icon: 'compass', href: '/' },
      {
        id: 'oma',
        label: `Talk to ${COACH_NAME}`,
        icon: 'chat',
        onClick: () => setCoachOpen(true),
      },
    ];
    if (isAdmin) {
      items.push({ id: 'admin', label: 'Admin', icon: 'settings', href: '/admin' });
    }
    return items;
  }, [isAdmin]);

  const footerItems = useMemo(
    () => [
      {
        id: 'logout',
        label: 'Sign out',
        icon: 'logout',
        onClick: () =>
          signOut().then(() => {
            window.location.href = '/';
          }),
      },
    ],
    [signOut],
  );

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
      <div className="flex min-h-screen flex-col">
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
      <div className="flex min-h-screen flex-col">
        <Header variant="account" />
        <PageLoadingState message="Loading your account…" artworkVariant="reflection" />
        <Footer compact />
      </div>
    );
  }

  return (
    <AppShell
      userEmail={user?.email}
      userLabel={displayName}
      items={navItems}
      footerItems={footerItems}
    >
      {() => (
        <>
          <main className="mx-auto w-full max-w-[72rem] flex-1 space-y-10 px-margin-mobile pb-28 pt-6 sm:px-8 lg:px-10">
            {linkError ? (
              <div className="rounded-2xl border border-severe/30 bg-severe/5 px-4 py-3 font-sans text-body-md text-on-surface-variant">
                Could not link your latest result: {linkError}. Complete a new assessment and try
                saving again.
              </div>
            ) : null}

            {error ? (
              <p className="font-sans text-body-md text-severe" role="alert">
                {error}
              </p>
            ) : null}

            <AccountDashboard
              displayName={helloName}
              latest={latest}
              reminderDays={reminderDays}
              onOpenCoach={() => setCoachOpen(true)}
              onViewFull={() => {
                if (latest?.sessionId) {
                  window.location.href = `/history/${latest.sessionId}`;
                }
              }}
            />

            {sessions.length > 1 ? (
              <section className="space-y-4">
                <div className="flex items-end justify-between">
                  <h2 className="font-display text-headline-md text-ink">Recent assessments</h2>
                  <span className="font-sans text-label-sm text-ink-soft">
                    {sessions.length} saved
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {sessions.slice(0, 5).map((item) => {
                    const mood = burnoutMoodIcon(item.burnout?.cls);
                    return (
                      <a
                        key={item.sessionId}
                        href={`/history/${item.sessionId}`}
                        className="glass-card group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-white/95"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full ${mood.tone}`}
                          >
                            <span className="font-mono text-[13px] font-semibold">
                              {Math.round(item.burnout?.pct ?? 0)}%
                            </span>
                          </div>
                          <div>
                            <p className="font-sans text-label-sm text-ink-soft">
                              {formatDate(item.createdAt)} · {relativeAssessmentTime(item.createdAt)}
                            </p>
                            <p className="font-sans text-body-md font-medium text-ink">
                              {item.burnout?.level ?? 'Assessment result'}
                            </p>
                            <p className="font-sans text-sm text-ink-soft">
                              {item.personality?.type?.name ?? 'Personality profile'}
                            </p>
                          </div>
                        </div>
                        <span className="text-ink-faint transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </a>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="btn-interactive flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/50 px-5 py-4 text-left backdrop-blur-sm"
              >
                <div>
                  <h2 className="font-display text-headline-md text-ink">Account settings</h2>
                  <p className="mt-0.5 font-sans text-sm text-ink-soft">
                    Reminders, security, and privacy
                  </p>
                </div>
                <span className="font-mono text-ink-soft" aria-hidden="true">
                  {settingsOpen ? '−' : '+'}
                </span>
              </button>

              {settingsOpen ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-display text-lg text-ink">Wellness reminders</h3>
                    <div className="glass-card space-y-6 p-gutter">
                      <p className="font-sans text-body-md text-ink-soft">
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
                          <p className="font-sans text-label-sm text-ink-soft">
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
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-display text-lg text-ink">Security</h3>
                    <div className="glass-card divide-y divide-outline-variant/30 p-gutter">
                      <div className="flex items-center justify-between py-4 first:pt-0">
                        <div>
                          <p className="font-sans text-body-md font-medium">Login method</p>
                          <p className="font-sans text-label-sm text-ink-soft">
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
                          <p className="font-sans text-label-sm text-ink-soft">
                            End your session on this device
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            signOut().then(() => {
                              window.location.href = '/';
                            })
                          }
                          className="font-sans text-label-sm text-primary underline"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-display text-lg text-ink">Improve Recharge</h3>
                    <FeedbackForm page="account" compact />
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-display text-lg text-ink">Data &amp; privacy</h3>
                    <div className="glass-card space-y-6 p-gutter">
                      <div className="flex items-start gap-4 rounded-xl border border-outline-variant/20 bg-white/50 p-4">
                        <span className="text-canopy" aria-hidden="true">
                          ✓
                        </span>
                        <p className="font-sans text-body-md">
                          Your data is encrypted and handled in strict accordance with GDPR. Read
                          our{' '}
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
                        className="flex w-full items-center justify-between rounded-xl border border-outline-variant/30 bg-white p-4 transition-colors hover:bg-surface-bright disabled:opacity-50"
                      >
                        <span className="font-sans text-body-md">Request personal data archive</span>
                        <span className="font-sans text-label-sm text-ink-soft">
                          {exporting ? 'Preparing…' : '.JSON'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="flex w-full items-center gap-3 rounded-xl border border-error/10 bg-error-container/20 p-4 text-error transition-colors hover:bg-error-container/40"
                      >
                        <span className="font-sans text-body-md font-medium">
                          Delete account &amp; permanent erasure
                        </span>
                      </button>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          window.location.href = '/';
                        }}
                      >
                        New assessment
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
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
              <div className="relative w-full max-w-sm rounded-2xl bg-white p-gutter shadow-2xl">
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
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {coachOpen ? (
            <div className="fixed inset-0 z-[80] flex items-end justify-end p-3 sm:p-4">
              <button
                type="button"
                className="absolute inset-0 bg-on-surface/30 backdrop-blur-[1px]"
                aria-label="Close Oma chat"
                onClick={() => setCoachOpen(false)}
              />
              <section
                role="dialog"
                aria-label={`Talk to ${COACH_NAME}`}
                className="relative z-[81] h-[min(78vh,42rem)] w-full max-w-[26rem] overflow-hidden rounded-xl border border-linen-sunken bg-linen-raised shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/25 px-4 py-3">
                  <p className="font-display text-body-lg text-primary">Talk to {COACH_NAME}</p>
                  <button
                    type="button"
                    onClick={() => setCoachOpen(false)}
                    className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-linen-sunken hover:text-canopy"
                    aria-label="Close chat"
                  >
                    ✕
                  </button>
                </div>
                <div className="h-[calc(100%-3.25rem)] overflow-y-auto p-3 sm:p-4">
                  <CoachChatPanel getAccessToken={getAccessToken} />
                </div>
              </section>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setCoachOpen(true)}
            className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full bg-canopy text-white shadow-xl transition-colors hover:bg-canopy-600 sm:right-6 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3"
            aria-label={`Talk to ${COACH_NAME}`}
          >
            <span aria-hidden="true" className="text-[18px]">
              💬
            </span>
            <span className="hidden font-sans text-[14px] font-semibold sm:inline">
              Talk to {COACH_NAME}
            </span>
          </button>
        </>
      )}
    </AppShell>
  );
}
