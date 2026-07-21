import { ollamaBaseUrl, ollamaModel } from '../config/llm.js';

export const ollamaStats = {
  totalCalls: 0,
  lastError: null,
  lastErrorAt: null,
  model: ollamaModel(),
  connected: false,
};

export function isOllamaConfigured() {
  return Boolean(ollamaBaseUrl() && ollamaModel());
}

export async function checkOllamaConnection() {
  if (!isOllamaConfigured()) {
    ollamaStats.connected = false;
    return false;
  }

  try {
    const res = await fetch(`${ollamaBaseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const names = (data.models ?? []).map((m) => m.name);
    ollamaStats.connected = names.includes(ollamaModel());
    ollamaStats.model = ollamaModel();
    return ollamaStats.connected;
  } catch (err) {
    ollamaStats.connected = false;
    ollamaStats.lastError = err.message;
    ollamaStats.lastErrorAt = new Date().toISOString();
    return false;
  }
}

function extractJson(text) {
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1].trim());
    const start = trimmed.indexOf('{');
    const arrStart = trimmed.indexOf('[');
    const idx =
      start >= 0 && arrStart >= 0 ? Math.min(start, arrStart) : Math.max(start, arrStart);
    if (idx >= 0) return JSON.parse(trimmed.slice(idx));
    throw new Error('Ollama response was not valid JSON');
  }
}

export async function generateOllamaJson(prompt, options = {}) {
  const base = (options.baseUrl || ollamaBaseUrl()).replace(/\/$/, '');
  const model = options.model || ollamaModel();
  if (!base || !model) {
    throw new Error('Ollama not configured');
  }

  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      messages: [
        {
          role: 'system',
          content:
            'You are a precise JSON API. Respond with valid JSON only — no markdown, no commentary.',
        },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS) || 120_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.message?.content;
  if (!content) throw new Error('Ollama returned empty content');

  ollamaStats.totalCalls += 1;
  ollamaStats.connected = true;
  ollamaStats.model = model;
  return extractJson(content);
}
