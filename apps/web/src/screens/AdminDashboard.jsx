import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAdminStats } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import LoadingDots from '../components/shared/LoadingDots.jsx';
import WorkspaceManager from '../components/admin/WorkspaceManager.jsx';
import ConnectorsManager from '../components/admin/ConnectorsManager.jsx';
import LlmMonitorPanel from '../components/admin/LlmMonitorPanel.jsx';
import { formatDate } from '../lib/formatDate.js';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-soft">
      <p className="font-sans text-label-sm uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-2 font-display text-headline-lg text-primary">{value}</p>
      {hint ? (
        <p className="mt-1 font-sans text-body-md text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

function DistributionBar({ label, count, total, tone }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between font-sans text-body-md">
        <span className="text-on-surface">{label}</span>
        <span className="text-on-surface-variant">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const data = await fetchAdminStats(token);
        if (mounted) setStats(data);
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

  const burnoutTotal = stats
    ? Object.values(stats.burnoutDistribution).reduce((a, b) => a + b, 0)
    : 0;

  const tabs = [
    { id: 'stats', label: 'Statistics' },
    { id: 'connectors', label: 'AI connectors' },
    { id: 'monitor', label: 'AI monitoring' },
    { id: 'saas', label: 'Business SaaS' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="account" />

      <main className="mx-auto w-full max-w-landing flex-1 px-margin-mobile py-10 sm:px-8 lg:px-12">
        <header className="mb-6">
          <p className="font-sans text-label-sm uppercase tracking-[0.14em] text-primary">
            Platform admin
          </p>
          <h1 className="mt-2 font-display text-headline-lg text-primary">Operations</h1>
          <p className="mt-2 font-sans text-body-md text-on-surface-variant">
            Monitor usage and deploy white-label workspaces for business clients.
          </p>
        </header>

        <nav className="mb-8 flex gap-2 border-b border-outline-variant/30 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-t-lg px-4 py-2 font-sans text-body-md transition ${
                tab === t.id
                  ? 'bg-white text-primary shadow-soft'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="rounded-xl border border-status-severe/30 bg-status-severe/5 p-6 text-center">
            <p className="font-sans text-body-md text-on-surface">{error}</p>
            <p className="mt-2 font-sans text-body-md text-on-surface-variant">
              Sign in with an email listed in <code className="text-primary">ADMIN_EMAILS</code> on
              the API host.
            </p>
            <Button className="mt-6" onClick={() => { window.location.href = '/account'; }}>
              Back to account
            </Button>
          </div>
        ) : null}

        {!error && tab === 'saas' ? <WorkspaceManager getAccessToken={getAccessToken} /> : null}
        {!error && tab === 'connectors' ? (
          <ConnectorsManager getAccessToken={getAccessToken} />
        ) : null}
        {!error && tab === 'monitor' ? (
          <LlmMonitorPanel getAccessToken={getAccessToken} />
        ) : null}

        {!error && tab === 'stats' ? (
          <>
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingDots />
              </div>
            ) : null}

            {stats ? (
              <div className="space-y-10">
                <div className="flex justify-end">
                  <p className="font-sans text-label-sm text-on-surface-variant">
                    Updated {formatDate(stats.generatedAt)}
                  </p>
                </div>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Sign-ups"
                    value={stats.signups.total}
                    hint={`${stats.signups.last7Days} in last 7 days`}
                  />
                  <StatCard
                    label="Sign-ups (30d)"
                    value={stats.signups.last30Days}
                    hint={`${stats.signups.last7Days} this week`}
                  />
                  <StatCard
                    label="Assessments"
                    value={stats.assessments.total}
                    hint={`${stats.assessments.last7Days} in last 7 days`}
                  />
                  <StatCard
                    label="Assessments (30d)"
                    value={stats.assessments.last30Days}
                    hint={`${stats.assessments.linkedToAccount} linked · ${stats.assessments.guestOrUnlinked} guest`}
                  />
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-soft">
                    <h2 className="font-display text-headline-md text-primary">Burnout mix</h2>
                    <div className="mt-6 space-y-4">
                      <DistributionBar
                        label="Healthy"
                        count={stats.burnoutDistribution.healthy}
                        total={burnoutTotal}
                        tone="bg-status-healthy"
                      />
                      <DistributionBar
                        label="Mild"
                        count={stats.burnoutDistribution.mild}
                        total={burnoutTotal}
                        tone="bg-status-warning"
                      />
                      <DistributionBar
                        label="Moderate"
                        count={stats.burnoutDistribution.moderate}
                        total={burnoutTotal}
                        tone="bg-tertiary-fixed"
                      />
                      <DistributionBar
                        label="Severe"
                        count={stats.burnoutDistribution.severe}
                        total={burnoutTotal}
                        tone="bg-status-severe"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-soft">
                    <h2 className="font-display text-headline-md text-primary">Top personality types</h2>
                    <ul className="mt-6 space-y-3">
                      {stats.personalityTop.length === 0 ? (
                        <li className="font-sans text-body-md text-on-surface-variant">No data yet</li>
                      ) : (
                        stats.personalityTop.map((row) => (
                          <li
                            key={row.key}
                            className="flex items-center justify-between border-b border-outline-variant/20 pb-2 font-sans text-body-md last:border-0"
                          >
                            <span className="font-medium text-on-surface">{row.key}</span>
                            <span className="text-on-surface-variant">{row.count}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-soft">
                    <h2 className="font-display text-headline-md text-primary">Recent sign-ups</h2>
                    <ul className="mt-4 divide-y divide-outline-variant/20">
                      {stats.recentSignups.map((row) => (
                        <li key={row.id} className="flex justify-between gap-4 py-3 font-sans text-body-md">
                          <span className="truncate text-on-surface">{row.email ?? '—'}</span>
                          <span className="shrink-0 text-on-surface-variant">
                            {formatDate(row.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-soft">
                    <h2 className="font-display text-headline-md text-primary">Recent assessments</h2>
                    <ul className="mt-4 divide-y divide-outline-variant/20">
                      {stats.recentAssessments.map((row) => (
                        <li key={row.id} className="py-3 font-sans text-body-md">
                          <div className="flex justify-between gap-2">
                            <span className="font-medium text-on-surface">
                              {row.displayName || 'Anonymous'}
                            </span>
                            <span className="shrink-0 text-on-surface-variant">
                              {formatDate(row.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-on-surface-variant">
                            {row.burnoutLevel}
                            {row.burnoutPct != null ? ` · ${row.burnoutPct}%` : ''}
                            {row.personalityType ? ` · ${row.personalityType}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        ) : null}
      </main>

      <Footer compact />
    </div>
  );
}
