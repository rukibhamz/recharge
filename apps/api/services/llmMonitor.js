import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getRuntimeConnectors, listConnectors } from './connectors.js';
import { isCircuitOpen, geminiStats } from './geminiClient.js';
import { checkOllamaConnection, ollamaStats } from './ollamaClient.js';

/** In-process rolling counters (survive until API restart). */
const live = new Map();

function keyFor(connector) {
  return `${connector.id || 'unknown'}::${connector.provider}::${connector.model}`;
}

function ensureLive(connector) {
  const key = keyFor(connector);
  if (!live.has(key)) {
    live.set(key, {
      key,
      connectorId: connector.id ?? null,
      name: connector.name ?? connector.provider,
      provider: connector.provider,
      model: connector.model,
      calls: 0,
      successes: 0,
      failures: 0,
      totalLatencyMs: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
      lastLatencyMs: null,
      consecutiveFailures: 0,
      processStartedAt: new Date().toISOString(),
    });
  }
  const row = live.get(key);
  row.name = connector.name ?? row.name;
  return row;
}

export function recordLlmCall({
  connector,
  success,
  latencyMs,
  error = null,
  source = 'assessment',
}) {
  if (!connector) return;

  const row = ensureLive(connector);
  row.calls += 1;
  row.lastLatencyMs = latencyMs ?? null;
  if (latencyMs != null) row.totalLatencyMs += latencyMs;

  if (success) {
    row.successes += 1;
    row.lastSuccessAt = new Date().toISOString();
    row.consecutiveFailures = 0;
    row.lastError = null;
  } else {
    row.failures += 1;
    row.lastFailureAt = new Date().toISOString();
    row.consecutiveFailures += 1;
    row.lastError = error ? String(error).slice(0, 500) : 'unknown error';
  }

  // Persist asynchronously — never block the assessment path
  void persistLog({
    connectorId: connector.id ?? null,
    connectorName: connector.name ?? null,
    provider: connector.provider,
    model: connector.model,
    success,
    latencyMs,
    error: success ? null : error,
    source,
  });
}

async function persistLog(entry) {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await supabase.from('llm_usage_logs').insert({
      connector_id: entry.connectorId ? String(entry.connectorId) : null,
      connector_name: entry.connectorName,
      provider: entry.provider,
      model: entry.model,
      success: entry.success,
      latency_ms: entry.latencyMs != null ? Math.round(entry.latencyMs) : null,
      error: entry.error ? String(entry.error).slice(0, 500) : null,
      source: entry.source,
    });
    if (error && !/llm_usage_logs/i.test(error.message) && error.code !== '42P01') {
      console.warn('[llm-monitor] persist failed:', error.message);
    }
  } catch (err) {
    console.warn('[llm-monitor] persist failed:', err.message);
  }
}

function pct(n, d) {
  if (!d) return null;
  return Math.round((n / d) * 1000) / 10;
}

function summarizeWindow(rows) {
  const total = rows.length;
  const successes = rows.filter((r) => r.success).length;
  const failures = total - successes;
  const latencies = rows.map((r) => r.latency_ms).filter((n) => Number.isFinite(n));
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  return {
    calls: total,
    successes,
    failures,
    successRatePct: pct(successes, total),
    uptimePct: pct(successes, total),
    avgLatencyMs: avgLatency,
  };
}

async function loadWindowLogs(sinceIso) {
  if (!isSupabaseConfigured()) return { rows: [], tableMissing: false };
  const { data, error } = await supabase
    .from('llm_usage_logs')
    .select('connector_id, connector_name, provider, model, success, latency_ms, error, source, created_at')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    if (/llm_usage_logs/i.test(error.message) || error.code === '42P01') {
      return { rows: [], tableMissing: true };
    }
    throw error;
  }
  return { rows: data ?? [], tableMissing: false };
}

function groupLogs(logs) {
  const map = new Map();
  for (const row of logs) {
    const key = `${row.connector_id || 'env'}::${row.provider}::${row.model}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        connectorId: row.connector_id,
        name: row.connector_name || row.provider,
        provider: row.provider,
        model: row.model,
        rows: [],
      });
    }
    map.get(key).rows.push(row);
  }
  return map;
}

function availabilityStatus(liveRow, windowSummary) {
  if (liveRow?.consecutiveFailures >= 3) return 'down';
  if (liveRow?.consecutiveFailures >= 1) return 'degraded';
  if (windowSummary?.calls > 0 && (windowSummary.uptimePct ?? 100) < 80) return 'degraded';
  if (liveRow?.lastSuccessAt || (windowSummary?.successes ?? 0) > 0) return 'up';
  if (liveRow?.calls === 0 && (windowSummary?.calls ?? 0) === 0) return 'unknown';
  return 'up';
}

export async function getLlmMonitorSnapshot() {
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [window24, window7, connectors, runtime] = await Promise.all([
    loadWindowLogs(since24h),
    loadWindowLogs(since7d),
    listConnectors().catch(() => []),
    getRuntimeConnectors().catch(() => []),
  ]);

  const logs24h = window24.rows;
  const logs7d = window7.rows;
  const tableMissing = window24.tableMissing || window7.tableMissing;

  const grouped24 = groupLogs(logs24h);
  const grouped7 = groupLogs(logs7d);

  // Ensure every configured / runtime connector appears
  const keys = new Set([
    ...live.keys(),
    ...grouped24.keys(),
    ...grouped7.keys(),
    ...runtime.map((c) => keyFor(c)),
    ...connectors.map((c) => `${c.id}::${c.provider}::${c.model}`),
  ]);

  const models = [];

  for (const key of keys) {
    const liveRow = live.get(key) ?? null;
    const g24 = grouped24.get(key);
    const g7 = grouped7.get(key);

    const [connectorId, provider, model] = (() => {
      if (liveRow) return [liveRow.connectorId, liveRow.provider, liveRow.model];
      if (g24) return [g24.connectorId, g24.provider, g24.model];
      if (g7) return [g7.connectorId, g7.provider, g7.model];
      const parts = key.split('::');
      return [parts[0] === 'unknown' ? null : parts[0], parts[1], parts[2]];
    })();

    const catalog = connectors.find((c) => c.id === connectorId);
    const runtimeMatch = runtime.find((c) => keyFor(c) === key);
    const name =
      liveRow?.name ||
      g24?.name ||
      catalog?.name ||
      runtimeMatch?.name ||
      provider;

    const window24h = summarizeWindow(g24?.rows ?? []);
    const window7d = summarizeWindow(g7?.rows ?? []);
    const status = availabilityStatus(liveRow, window24h);

    const avgLiveLatency =
      liveRow && liveRow.calls > 0
        ? Math.round(liveRow.totalLatencyMs / liveRow.calls)
        : null;

    models.push({
      key,
      connectorId,
      name,
      provider,
      model,
      enabled: catalog ? catalog.enabled : Boolean(runtimeMatch),
      status,
      process: liveRow
        ? {
            calls: liveRow.calls,
            successes: liveRow.successes,
            failures: liveRow.failures,
            successRatePct: pct(liveRow.successes, liveRow.calls),
            avgLatencyMs: avgLiveLatency,
            lastSuccessAt: liveRow.lastSuccessAt,
            lastFailureAt: liveRow.lastFailureAt,
            lastError: liveRow.lastError,
            lastLatencyMs: liveRow.lastLatencyMs,
            consecutiveFailures: liveRow.consecutiveFailures,
          }
        : null,
      last24h: window24h,
      last7d: window7d,
    });
  }

  models.sort((a, b) => {
    const order = { down: 0, degraded: 1, unknown: 2, up: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name);
  });

  const totals24 = summarizeWindow(logs24h);
  const totals7 = summarizeWindow(logs7d);

  return {
    generatedAt: new Date().toISOString(),
    processUptimeSec: Math.round(process.uptime()),
    totals: {
      last24h: totals24,
      last7d: totals7,
      processCalls: [...live.values()].reduce((a, r) => a + r.calls, 0),
    },
    geminiCircuitOpen: isCircuitOpen(),
    geminiStats: {
      totalCalls: geminiStats.totalCalls,
      quotaErrors: geminiStats.quotaErrors,
      activeModel: geminiStats.activeModel,
      lastError: geminiStats.lastError,
      lastErrorAt: geminiStats.lastErrorAt,
    },
    ollamaStats: {
      connected: ollamaStats.connected,
      model: ollamaStats.model,
      totalCalls: ollamaStats.totalCalls,
      lastError: ollamaStats.lastError,
    },
    models,
    logPersistence: isSupabaseConfigured() && !tableMissing,
  };
}

/** Lightweight availability probe for each enabled connector (does not use full assessment prompts). */
export async function probeConnectorAvailability(testFn) {
  const connectors = await getRuntimeConnectors();
  const results = [];

  for (const connector of connectors) {
    const started = Date.now();
    try {
      // testFn (testConnectorRuntime) already records usage with source "test"
      await testFn(connector);
      results.push({
        connectorId: connector.id,
        name: connector.name,
        provider: connector.provider,
        model: connector.model,
        ok: true,
        latencyMs: Date.now() - started,
      });
    } catch (err) {
      results.push({
        connectorId: connector.id,
        name: connector.name,
        provider: connector.provider,
        model: connector.model,
        ok: false,
        latencyMs: Date.now() - started,
        error: err.message,
      });
    }
  }

  // Also refresh Ollama tag check when present
  try {
    await checkOllamaConnection();
  } catch {
    /* ignore */
  }

  return {
    probedAt: new Date().toISOString(),
    results,
  };
}
