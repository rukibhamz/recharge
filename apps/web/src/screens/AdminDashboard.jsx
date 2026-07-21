import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAdminStats } from '../services/api.js';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import Button from '../components/shared/Button.jsx';
import LoadingDots from '../components/shared/LoadingDots.jsx';
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

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <Header variant="account" />

      <main className="mx-auto w-full max-w-landing flex-1 px-margin-mobile py-10 sm:px-8 lg:px-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-sans text-label-sm uppercase tracking-[0.14em] text-primary">
              Platform admin
            </p>
            <h1 className="mt-2 font-display text-headline-lg text-primary">Site statistics</h1>
            <p className="mt-2 font-sans text-body-md text-on-surface-variant">
              Sign-ups, assessments, and distribution snapshots.
            </p>
          </div>
          {stats?.generatedAt ? (
            <p className="font-sans text-label-sm text-on-surface-variant">
              Updated {formatDate(stats.generatedAt)}
            </p>
          ) : null}
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingDots />
          </div>
        ) : null}

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

        {stats ? (
          <div className="space-y-10">
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
                <p className="mt-1 font-sans text-body-md text-on-surface-variant">
                  From recent completed assessments
                </p>
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
                {stats.sampleNote ? (
                  <p className="mt-4 font-sans text-label-sm text-on-surface-variant">
                    {stats.sampleNote}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-soft">
                <h2 className="font-display text-headline-md text-primary">Top personality types</h2>
                <p className="mt-1 font-sans text-body-md text-on-surface-variant">
                  Most common codes in recent assessments
                </p>
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
                  {stats.recentSignups.length === 0 ? (
                    <li className="py-3 font-sans text-body-md text-on-surface-variant">None yet</li>
                  ) : (
                    stats.recentSignups.map((row) => (
                      <li key={row.id} className="flex justify-between gap-4 py-3 font-sans text-body-md">
                        <span className="truncate text-on-surface">{row.email ?? '—'}</span>
                        <span className="shrink-0 text-on-surface-variant">
                          {formatDate(row.createdAt)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-soft">
                <h2 className="font-display text-headline-md text-primary">Recent assessments</h2>
                <ul className="mt-4 divide-y divide-outline-variant/20">
                  {stats.recentAssessments.length === 0 ? (
                    <li className="py-3 font-sans text-body-md text-on-surface-variant">None yet</li>
                  ) : (
                    stats.recentAssessments.map((row) => (
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
                    ))
                  )}
                </ul>
              </div>
            </section>
          </div>
        ) : null}
      </main>

      <Footer compact />
    </div>
  );
}
