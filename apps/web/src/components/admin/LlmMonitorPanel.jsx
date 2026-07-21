import { useCallback, useEffect, useState } from 'react';
import { fetchAdminLlmMonitor, probeAdminLlmMonitor } from '../../services/api.js';
import Button from '../shared/Button.jsx';
import { formatDate } from '../../lib/formatDate.js';

function statusStyles(status) {
  if (status === 'up') return 'bg-status-healthy/15 text-status-healthy';
  if (status === 'degraded') return 'bg-status-warning/15 text-status-warning';
  if (status === 'down') return 'bg-status-severe/15 text-status-severe';
  return 'bg-surface-soft text-on-surface-variant';
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-soft">
      <p className="font-sans text-label-sm uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-headline-md text-primary">{value}</p>
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
    return <p className="font-sans text-body-md text-on-surface-variant">Loading AI monitoring…</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-headline-md text-primary">AI usage & availability</h2>
          <p className="mt-1 max-w-2xl font-sans text-body-md text-on-surface-variant">
            Per-model call volume, success rate (uptime), latency, and live health. Assessment
            traffic is logged automatically; use Probe to check every enabled connector now.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={runProbe} disabled={probing}>
            {probing ? 'Probing…' : 'Probe all models'}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-status-severe/30 bg-status-severe/5 px-4 py-3 font-sans text-body-md text-on-surface">
          {error}
        </p>
      ) : null}
      {probeNote ? (
        <p className="rounded-xl border border-status-healthy/30 bg-status-healthy/10 px-4 py-3 font-sans text-body-md text-on-surface">
          {probeNote}
        </p>
      ) : null}

      {monitor ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Calls (24h)" value={monitor.totals.last24h.calls} />
            <StatPill
              label="Uptime (24h)"
              value={formatPct(monitor.totals.last24h.uptimePct)}
            />
            <StatPill label="Calls (7d)" value={monitor.totals.last7d.calls} />
            <StatPill
              label="Avg latency (24h)"
              value={formatMs(monitor.totals.last24h.avgLatencyMs)}
            />
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-white p-4 font-sans text-body-md text-on-surface-variant shadow-soft">
            <p>
              API process uptime: {Math.floor(monitor.processUptimeSec / 60)} min · Snapshot{' '}
              {formatDate(monitor.generatedAt)}
              {monitor.geminiCircuitOpen ? ' · Gemini circuit open' : ''}
              {!monitor.logPersistence
                ? ' · Usage history not persisted (run migration 013)'
                : ''}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-soft">
            {monitor.models.length === 0 ? (
              <p className="p-6 font-sans text-body-md text-on-surface-variant">
                No model activity yet. Add connectors and run an assessment or Probe all models.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left font-sans text-body-md">
                  <thead className="border-b border-outline-variant/30 bg-surface-soft/80 text-label-sm uppercase tracking-wide text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3 font-medium">Model</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">24h calls</th>
                      <th className="px-4 py-3 font-medium">24h uptime</th>
                      <th className="px-4 py-3 font-medium">Avg latency</th>
                      <th className="px-4 py-3 font-medium">Process</th>
                      <th className="px-4 py-3 font-medium">Last error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {monitor.models.map((m) => (
                      <tr key={m.key}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-on-surface">{m.name}</p>
                          <p className="text-label-sm text-on-surface-variant">
                            {m.provider} · {m.model}
                            {m.enabled === false ? ' · disabled' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-label-sm font-medium capitalize ${statusStyles(m.status)}`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface">
                          {m.last24h.calls}
                          <span className="text-on-surface-variant">
                            {' '}
                            ({m.last24h.successes}/{m.last24h.failures})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface">
                          {formatPct(m.last24h.uptimePct)}
                        </td>
                        <td className="px-4 py-3 text-on-surface">
                          {formatMs(m.last24h.avgLatencyMs ?? m.process?.avgLatencyMs)}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {m.process
                            ? `${m.process.calls} calls · ${formatPct(m.process.successRatePct)} ok`
                            : '—'}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-on-surface-variant" title={m.process?.lastError || ''}>
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
