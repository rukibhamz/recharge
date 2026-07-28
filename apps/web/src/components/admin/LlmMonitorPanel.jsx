import { useCallback, useEffect, useState } from 'react';
import { fetchAdminLlmMonitor, probeAdminLlmMonitor } from '../../services/api.js';
import Button from '../shared/Button.jsx';
import { formatDate } from '../../lib/formatDate.js';

function statusBadge(status) {
  if (status === 'up') return 'badge-healthy';
  if (status === 'degraded') return 'badge-mild';
  if (status === 'down') return 'badge-severe';
  return 'badge bg-linen-sunken text-ink-soft';
}

function StatPill({ label, value }) {
  return (
    <div className="surface-card p-4">
      <p className="card-eyebrow">{label}</p>
      <p className="font-mono text-[1.35rem] font-medium tabular-nums text-ink">{value}</p>
    </div>
  );
}

function formatPct(n) {
  if (n == null) return '—';
  return `${n}%`;
}

function formatMs(n) {
  if (n == null) return '—';
  return `${n} ms`;
}

export default function LlmMonitorPanel({ getAccessToken }) {
  const [monitor, setMonitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState(null);
  const [probeNote, setProbeNote] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getAccessToken();
      const data = await fetchAdminLlmMonitor(token);
      setMonitor(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const runProbe = async () => {
    setProbing(true);
    setError(null);
    setProbeNote(null);
    try {
      const token = await getAccessToken();
      const data = await probeAdminLlmMonitor(token);
      setMonitor(data.monitor);
      const ok = (data.results ?? []).filter((r) => r.ok).length;
      const fail = (data.results ?? []).length - ok;
      setProbeNote(`Probe finished: ${ok} up, ${fail} failing.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setProbing(false);
    }
  };

  if (loading && !monitor) {
    return <p className="font-sans text-body-md text-ink-soft">Loading AI monitoring…</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="card-eyebrow">Live health</p>
          <h2 className="font-display text-headline-md font-normal text-ink">
            AI usage & availability
          </h2>
          <p className="mt-1 max-w-2xl font-sans text-body-md text-ink-soft">
            Per-model call volume, success rate (uptime), latency, and live health. Assessment
            traffic is logged automatically; use Probe to check every enabled connector now.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button size="sm" onClick={runProbe} disabled={probing}>
            {probing ? 'Probing…' : 'Probe all models'}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-signal-red/30 bg-signal-red-tint px-4 py-3 font-sans text-body-md text-ink">
          {error}
        </p>
      ) : null}
      {probeNote ? (
        <p className="rounded-md border border-fern/30 bg-fern-tint px-4 py-3 font-sans text-body-md text-ink">
          {probeNote}
        </p>
      ) : null}

      {monitor ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Calls (24h)" value={monitor.totals.last24h.calls} />
            <StatPill label="Uptime (24h)" value={formatPct(monitor.totals.last24h.uptimePct)} />
            <StatPill label="Calls (7d)" value={monitor.totals.last7d.calls} />
            <StatPill
              label="Avg latency (24h)"
              value={formatMs(monitor.totals.last24h.avgLatencyMs)}
            />
          </div>

          <div className="surface-card p-4 font-sans text-[14px] text-ink-soft">
            <p>
              API process uptime:{' '}
              <span className="font-mono text-ink">
                {Math.floor(monitor.processUptimeSec / 60)} min
              </span>{' '}
              · Snapshot <span className="font-mono">{formatDate(monitor.generatedAt)}</span>
              {monitor.geminiCircuitOpen ? ' · Gemini circuit open' : ''}
              {!monitor.logPersistence
                ? ' · Usage history not persisted (run migration 013)'
                : ''}
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-linen-sunken bg-linen-raised shadow-soft">
            {monitor.models.length === 0 ? (
              <p className="p-6 font-sans text-body-md text-ink-soft">
                No model activity yet. Add connectors and run an assessment or Probe all models.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="border-b border-linen-sunken bg-linen-sunken/50">
                    <tr>
                      {[
                        'Model',
                        'Status',
                        '24h calls',
                        '24h uptime',
                        'Avg latency',
                        'Process',
                        'Last error',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink-faint"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linen-sunken">
                    {monitor.models.map((m) => (
                      <tr key={m.key}>
                        <td className="px-4 py-3">
                          <p className="font-sans text-[14px] font-semibold text-ink">{m.name}</p>
                          <p className="font-mono text-[11px] text-ink-faint">
                            {m.provider} · {m.model}
                            {m.enabled === false ? ' · disabled' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`${statusBadge(m.status)} capitalize`}>{m.status}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px] text-ink">
                          {m.last24h.calls}
                          <span className="text-ink-faint">
                            {' '}
                            ({m.last24h.successes}/{m.last24h.failures})
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px] text-ink">
                          {formatPct(m.last24h.uptimePct)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px] text-ink">
                          {formatMs(m.last24h.avgLatencyMs ?? m.process?.avgLatencyMs)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-ink-soft">
                          {m.process
                            ? `${m.process.calls} calls · ${formatPct(m.process.successRatePct)} ok`
                            : '—'}
                        </td>
                        <td
                          className="max-w-[220px] truncate px-4 py-3 font-sans text-[13px] text-ink-soft"
                          title={m.process?.lastError || ''}
                        >
                          {m.process?.lastError || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
