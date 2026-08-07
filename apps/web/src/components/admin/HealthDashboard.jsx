import { formatDate } from '../../lib/formatDate.js';
import Button from '../shared/Button.jsx';

function formatCompact(n) {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return n.toLocaleString();
  return String(n);
}

function Trend({ value, invert = false }) {
  if (value == null || Number.isNaN(value)) return null;
  const up = value > 0;
  const good = invert ? !up : up;
  if (value === 0) {
    return <span className="font-mono text-[12px] text-ink-faint">0% vs LW</span>;
  }
  return (
    <span
      className={`font-mono text-[12px] font-medium ${good ? 'text-fern' : 'text-signal-red'}`}
    >
      {up ? '+' : ''}
      {value}% vs LW
    </span>
  );
}

function KpiCard({ label, value, sub, trend, invertTrend, icon, tone = 'bg-fern-tint text-canopy' }) {
  return (
    <div className="surface-card flex gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
          {label}
        </p>
        <p className="mt-1 font-mono text-[1.65rem] font-medium tabular-nums leading-none text-ink">
          {value}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {sub ? <span className="font-sans text-[12px] text-ink-soft">{sub}</span> : null}
          <Trend value={trend} invert={invertTrend} />
        </div>
      </div>
    </div>
  );
}

function VolumeChart({ series = [] }) {
  const max = Math.max(1, ...series.map((d) => d.completed || 0));
  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="card-eyebrow">Assessment volume</p>
          <h3 className="font-display text-headline-md font-normal text-ink">Last 14 days</h3>
        </div>
        <div className="flex items-center gap-4 font-sans text-[12px] text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-canopy" /> Completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-fern-tint ring-1 ring-canopy/20" /> Linked
          </span>
        </div>
      </div>
      <div className="mt-8 flex h-44 items-end gap-1.5 sm:gap-2">
        {series.map((day) => {
          const hCompleted = Math.max(4, Math.round(((day.completed || 0) / max) * 100));
          const hLinked = Math.max(
            day.linked ? 4 : 0,
            Math.round(((day.linked || 0) / max) * 100),
          );
          return (
            <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end justify-center gap-0.5">
                <div
                  className="w-[45%] max-w-[14px] rounded-t-sm bg-canopy/90"
                  style={{ height: `${hCompleted}%` }}
                  title={`${day.label}: ${day.completed} completed`}
                />
                <div
                  className="w-[45%] max-w-[14px] rounded-t-sm bg-fern-tint ring-1 ring-canopy/15"
                  style={{ height: `${hLinked}%` }}
                  title={`${day.label}: ${day.linked} linked`}
                />
              </div>
              <span className="truncate font-mono text-[9px] text-ink-faint sm:text-[10px]">
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SystemHealth({ health, llmSummary }) {
  const rows = [
    {
      id: 'llm',
      title: 'AI connector latency',
      value: llmSummary?.latencyLabel ?? '—',
      badge: llmSummary?.statusLabel ?? 'Unknown',
      badgeTone:
        llmSummary?.status === 'up'
          ? 'badge-healthy'
          : llmSummary?.status === 'down'
            ? 'badge-severe'
            : 'badge-mild',
      bar: llmSummary?.bar ?? 0,
    },
    {
      id: 'db',
      title: 'Database (PostgreSQL)',
      value: health?.database?.label ?? '—',
      badge: health?.database?.status === 'up' ? 'Online' : 'Issue',
      badgeTone: health?.database?.status === 'up' ? 'badge-healthy' : 'badge-severe',
      bar: health?.database?.status === 'up' ? 99 : 12,
    },
    {
      id: 'conv',
      title: 'Account link rate',
      value: llmSummary?.conversionLabel ?? '—',
      badge: 'Tracked',
      badgeTone: 'badge-healthy',
      bar: llmSummary?.conversionBar ?? 0,
    },
  ];

  return (
    <div className="surface-card flex h-full flex-col p-5 sm:p-6">
      <p className="card-eyebrow">System health</p>
      <h3 className="font-display text-headline-md font-normal text-ink">Live services</h3>
      <ul className="mt-5 flex-1 space-y-5">
        {rows.map((row) => (
          <li key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-sans text-[14px] font-semibold text-ink">{row.title}</p>
                <p className="mt-0.5 font-mono text-[13px] text-ink-soft">{row.value}</p>
              </div>
              <span className={row.badgeTone}>{row.badge}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-linen-sunken">
              <div
                className="h-full rounded-pill bg-canopy/80"
                style={{ width: `${Math.min(100, Math.max(4, row.bar))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {llmSummary?.note ? (
        <div className="mt-5 rounded-xl bg-linen-sunken/80 px-3 py-2.5 font-sans text-[12px] text-ink-soft">
          {llmSummary.note}
        </div>
      ) : null}
    </div>
  );
}

function OrgOverview({ organizations = [], total = 0, onViewAll }) {
  const statusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active' || s === 'live') return 'badge-healthy';
    if (s === 'draft') return 'badge-mild';
    return 'badge bg-linen-sunken text-ink-soft';
  };

  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linen-sunken px-5 py-4">
        <div>
          <p className="card-eyebrow">B2B customer overview</p>
          <h3 className="font-display text-headline-md font-normal text-ink">Organizations</h3>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-faint">
          Showing {organizations.length} of {total}
        </p>
      </div>

      {organizations.length === 0 ? (
        <p className="px-5 py-8 font-sans text-body-md text-ink-soft">
          No workspaces yet. Create one under Organizations.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-linen-sunken font-sans text-[11px] uppercase tracking-[0.05em] text-ink-faint">
                <th className="px-5 py-3 font-semibold">Organization</th>
                <th className="px-3 py-3 font-semibold">Plan</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-b border-linen-sunken/70 last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fern-tint font-display text-[14px] font-semibold text-canopy">
                        {(org.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-sans text-[14px] font-semibold text-ink">
                          {org.name}
                        </p>
                        <p className="truncate font-mono text-[11px] text-ink-faint">
                          {org.domain || org.slug || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 font-sans text-[13px] text-ink-soft">{org.plan}</td>
                  <td className="px-3 py-3.5">
                    <span className={statusClass(org.status)}>{org.status}</span>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-[12px] text-ink-faint">
                    {org.updatedAt ? formatDate(org.updatedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-linen-sunken px-5 py-3 text-center">
        <button
          type="button"
          onClick={onViewAll}
          className="btn-interactive font-sans text-[14px] font-semibold text-canopy hover:underline"
        >
          View all organizations
        </button>
      </div>
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

/**
 * Global health monitor dashboard — wires to /api/admin/stats (+ optional llm summary).
 * @param {'full' | 'analytics'} variant — full = operations home; analytics = deeper usage views
 */
export default function HealthDashboard({
  stats,
  llmSummary,
  loading,
  onExport,
  onViewOrganizations,
  variant = 'full',
}) {
  if (loading && !stats) {
    return <p className="font-sans text-body-md text-ink-soft">Loading health monitor…</p>;
  }
  if (!stats) return null;

  const kpis = stats.kpis || {};
  const burnoutTotal = Object.values(stats.burnoutDistribution || {}).reduce((a, b) => a + b, 0);
  const isAnalytics = variant === 'analytics';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {!isAnalytics ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-fern-tint px-3 py-1">
              <span
                className={`h-2 w-2 rounded-full ${stats.systemLive ? 'bg-fern' : 'bg-signal-red'}`}
              />
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-canopy">
                {stats.systemLive ? 'System live' : 'System issues'}
              </span>
            </div>
          ) : (
            <p className="hero-badge">Analytics</p>
          )}
          <h1 className="mt-3 font-display text-headline-lg font-light text-ink">
            {isAnalytics ? 'Platform analytics' : 'Global Health Monitor'}
          </h1>
          <p className="mt-1 max-w-xl font-sans text-body-md text-ink-soft">
            {isAnalytics
              ? 'Volume trends, burnout distribution, and recent assessment mix.'
              : 'Platform usage, burnout mix, and service health across Recharge.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-linen-sunken bg-linen-raised px-3 py-2 font-sans text-[13px] text-ink-soft">
            {isAnalytics ? 'Last 30 days sample' : 'Last 24 hours'}
          </span>
          <Button size="sm" variant="secondary" onClick={onExport}>
            Export snapshot
          </Button>
        </div>
      </header>

      {!isAnalytics ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total assessments"
            icon="📋"
            value={formatCompact(kpis.totalAssessments ?? stats.assessments?.total)}
            trend={kpis.assessmentsTrend}
            sub={`${stats.assessments?.last7Days ?? 0} this week`}
          />
          <KpiCard
            label="Active signals (24h)"
            icon="👥"
            value={formatCompact(kpis.activeUsers24h)}
            trend={kpis.activeUsersTrend}
            sub="Assessments + new sign-ups"
            tone="bg-linen-sunken text-canopy"
          />
          <KpiCard
            label="Avg platform burnout"
            icon="🧠"
            value={kpis.avgBurnoutPct != null ? `${kpis.avgBurnoutPct}/100` : '—'}
            sub={kpis.avgBurnoutLabel}
            tone="bg-ember-tint text-ember"
            invertTrend
          />
          <KpiCard
            label="Conversion rate"
            icon="↗"
            value={`${kpis.conversionRate ?? 0}%`}
            trend={kpis.conversionTrend}
            sub="Linked to accounts"
            tone="bg-fern-tint text-canopy"
          />
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Assessments (7d)"
            icon="📋"
            value={formatCompact(stats.assessments?.last7Days)}
            trend={kpis.assessmentsTrend}
            sub={`${stats.assessments?.last30Days ?? 0} in 30 days`}
          />
          <KpiCard
            label="Sign-ups (7d)"
            icon="👥"
            value={formatCompact(stats.signups?.last7Days)}
            trend={stats.signups?.changeVsPreviousWeek}
            sub={`${stats.signups?.total ?? 0} total accounts`}
            tone="bg-linen-sunken text-canopy"
          />
          <KpiCard
            label="Linked / guest"
            icon="↗"
            value={`${stats.assessments?.linkedToAccount ?? 0} / ${stats.assessments?.guestOrUnlinked ?? 0}`}
            sub={`${kpis.conversionRate ?? 0}% conversion`}
            tone="bg-fern-tint text-canopy"
          />
        </section>
      )}

      <section
        className={
          isAnalytics
            ? 'grid grid-cols-1 gap-6'
            : 'grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]'
        }
      >
        <VolumeChart series={stats.volumeSeries ?? []} />
        {!isAnalytics ? (
          <SystemHealth
            health={stats.health}
            llmSummary={{
              ...llmSummary,
              conversionLabel: `${kpis.conversionRate ?? 0}% linked`,
              conversionBar: kpis.conversionRate ?? 0,
            }}
          />
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card p-5 sm:p-6">
          <p className="card-eyebrow">Burnout mix</p>
          <h3 className="font-display text-headline-md font-normal text-ink">Recent sample</h3>
          <div className="mt-5 space-y-4">
            <DistributionBar
              label="Healthy"
              count={stats.burnoutDistribution?.healthy ?? 0}
              total={burnoutTotal}
              tone="bg-fern"
              badgeClass="badge-healthy"
            />
            <DistributionBar
              label="Mild"
              count={stats.burnoutDistribution?.mild ?? 0}
              total={burnoutTotal}
              tone="bg-signal-amber"
              badgeClass="badge-mild"
            />
            <DistributionBar
              label="Moderate"
              count={stats.burnoutDistribution?.moderate ?? 0}
              total={burnoutTotal}
              tone="bg-ember"
              badgeClass="badge-moderate"
            />
            <DistributionBar
              label="Severe"
              count={stats.burnoutDistribution?.severe ?? 0}
              total={burnoutTotal}
              tone="bg-signal-red"
              badgeClass="badge-severe"
            />
          </div>
          {stats.sampleNote ? (
            <p className="mt-4 font-sans text-[12px] text-ink-faint">{stats.sampleNote}</p>
          ) : null}
        </div>

        <div className="surface-card p-5 sm:p-6">
          {isAnalytics ? (
            <>
              <p className="card-eyebrow">Personality mix</p>
              <h3 className="font-display text-headline-md font-normal text-ink">Top types</h3>
              <ul className="mt-4 space-y-2">
                {(stats.personalityTop ?? []).slice(0, 8).map((row) => (
                  <li
                    key={row.key}
                    className="flex items-center justify-between gap-3 border-b border-linen-sunken/70 py-2 last:border-0"
                  >
                    <span className="font-mono text-[14px] font-semibold text-ink">{row.key}</span>
                    <span className="font-mono text-[12px] text-ink-faint">{row.count}</span>
                  </li>
                ))}
                {(stats.personalityTop ?? []).length === 0 ? (
                  <li className="font-sans text-body-md text-ink-soft">No type data yet.</li>
                ) : null}
              </ul>
            </>
          ) : (
            <>
              <p className="card-eyebrow">Recent activity</p>
              <h3 className="font-display text-headline-md font-normal text-ink">Latest assessments</h3>
              <ul className="mt-4 divide-y divide-linen-sunken">
                {(stats.recentAssessments ?? []).slice(0, 6).map((row) => (
                  <li key={row.id} className="py-3">
                    <div className="flex justify-between gap-2">
                      <span className="font-sans text-[14px] font-semibold text-ink">
                        {row.displayName || 'Anonymous'}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                        {formatDate(row.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[12px] text-ink-soft">
                      {row.burnoutLevel}
                      {row.burnoutPct != null ? ` · ${row.burnoutPct}%` : ''}
                      {row.personalityType ? ` · ${row.personalityType}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {!isAnalytics ? (
        <OrgOverview
          organizations={stats.organizations ?? []}
          total={stats.organizationCount ?? 0}
          onViewAll={onViewOrganizations}
        />
      ) : null}

      <p className="text-center font-mono text-[11px] text-ink-faint">
        Snapshot {formatDate(stats.generatedAt)} · Admin console
      </p>
    </div>
  );
}
