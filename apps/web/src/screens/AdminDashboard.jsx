import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAdminStats } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import PageLoadingState from '../components/shared/PageLoadingState.jsx';
import { ArcDivider } from '../components/shared/Arc.jsx';
import WorkspaceManager from '../components/admin/WorkspaceManager.jsx';
import ConnectorsManager from '../components/admin/ConnectorsManager.jsx';
import LlmMonitorPanel from '../components/admin/LlmMonitorPanel.jsx';
import { formatDate } from '../lib/formatDate.js';

function StatCard({ label, value, hint }) {
  return (
    <div className="surface-card p-5">
      <p className="card-eyebrow">{label}</p>
      <p className="font-mono text-[1.75rem] font-medium tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 font-sans text-[13px] text-ink-soft">{hint}</p> : null}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="surface-card p-6">
      <h2 className="font-display text-headline-md font-normal text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function DistributionBar({ label, count, total, tone, badgeClass }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className={badgeClass}>● {label}</span>
        <span className="font-mono text-[12px] text-ink-faint">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-pill bg-linen-sunken">
        <div className={`h-full rounded-pill ${tone}`} style={{ width: `${pct}%` }} />
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
    <div className="flex min-h-screen flex-col bg-linen">
      <Header variant="account" />

      <main className="mx-auto w-full max-w-landing flex-1 px-margin-mobile py-10 sm:px-8 lg:px-12">
        <header className="mb-8">
          <p className="hero-badge">Platform admin</p>
          <h1 className="mt-3 font-display text-headline-lg font-light text-ink">Operations</h1>
          <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
            Monitor usage and deploy white-label workspaces for business clients.
          </p>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 border-b border-linen-sunken">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`btn-interactive -mb-px border-b-2 px-4 py-2.5 font-sans text-[15px] font-semibold transition-colors ${
                tab === t.id
                  ? 'border-canopy-600 text-canopy-600'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="surface-card border-signal-red/30 bg-signal-red-tint p-8 text-center">
            <p className="font-sans text-body-md text-ink">{error}</p>
            <p className="mt-2 font-sans text-body-md text-ink-soft">
              Sign in with an email listed in <code className="font-mono text-canopy">ADMIN_EMAILS</code>{' '}
              on the API host.
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
              <PageLoadingState message="Loading statistics…" artworkVariant="reflection" />
            ) : null}

            {stats ? (
              <div className="space-y-8">
                <div className="flex justify-end">
                  <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
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

                <ArcDivider />

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Panel title="Burnout mix">
                    <div className="space-y-4">
                      <DistributionBar
                        label="Healthy"
                        count={stats.burnoutDistribution.healthy}
                        total={burnoutTotal}
                        tone="bg-fern"
                        badgeClass="badge-healthy"
                      />
                      <DistributionBar
                        label="Mild"
                        count={stats.burnoutDistribution.mild}
                        total={burnoutTotal}
                        tone="bg-signal-amber"
                        badgeClass="badge-mild"
                      />
                      <DistributionBar
                        label="Moderate"
                        count={stats.burnoutDistribution.moderate}
                        total={burnoutTotal}
                        tone="bg-ember"
                        badgeClass="badge-moderate"
                      />
                      <DistributionBar
                        label="Severe"
                        count={stats.burnoutDistribution.severe}
                        total={burnoutTotal}
                        tone="bg-signal-red"
                        badgeClass="badge-severe"
                      />
                    </div>
                  </Panel>

                  <Panel title="Top personality types">
                    <ul className="space-y-3">
                      {stats.personalityTop.length === 0 ? (
                        <li className="font-sans text-body-md text-ink-soft">No data yet</li>
                      ) : (
                        stats.personalityTop.map((row) => (
                          <li
                            key={row.key}
                            className="flex items-center justify-between border-b border-linen-sunken pb-2 last:border-0"
                          >
                            <span className="font-sans text-[15px] font-semibold text-ink">
                              {row.key}
                            </span>
                            <span className="font-mono text-[13px] text-ink-faint">{row.count}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </Panel>
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Panel title="Recent sign-ups">
                    <ul className="divide-y divide-linen-sunken">
                      {stats.recentSignups.map((row) => (
                        <li key={row.id} className="flex justify-between gap-4 py-3">
                          <span className="truncate font-sans text-[14px] text-ink">
                            {row.email ?? '—'}
                          </span>
                          <span className="shrink-0 font-mono text-[12px] text-ink-faint">
                            {formatDate(row.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>

                  <Panel title="Recent assessments">
                    <ul className="divide-y divide-linen-sunken">
                      {stats.recentAssessments.map((row) => (
                        <li key={row.id} className="py-3">
                          <div className="flex justify-between gap-2">
                            <span className="font-sans text-[15px] font-semibold text-ink">
                              {row.displayName || 'Anonymous'}
                            </span>
                            <span className="shrink-0 font-mono text-[12px] text-ink-faint">
                              {formatDate(row.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-[12px] text-ink-soft">
                            {row.burnoutLevel}
                            {row.burnoutPct != null ? ` · ${row.burnoutPct}%` : ''}
                            {row.personalityType ? ` · ${row.personalityType}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Panel>
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
