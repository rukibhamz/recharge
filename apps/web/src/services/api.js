/** Empty in Vite dev (proxies /api). Production: set VITE_API_URL. Local XAMPP → :3001 auto. */
function resolveApiBase() {
  const configured = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (configured) return configured;

  // Vite dev server proxies /api → localhost:3001
  if (import.meta.env.DEV) return '';

  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';
    // Static host (Apache/XAMPP, etc.) — not Vite (5173) or the API itself (3001)
    if (isLoopback && port !== '5173' && port !== '3001') {
      return `${protocol}//${hostname}:3001`;
    }
  }

  return '';
}

const API_BASE = resolveApiBase();

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function networkErrorMessage(err) {
  const raw = String(err?.message || err || '');
  if (/networkerror|failed to fetch|load failed|network request failed/i.test(raw)) {
    const hint = API_BASE
      ? `Could not reach the API at ${API_BASE}. Is it running (port 3001)?`
      : 'Could not reach the API. Start it with npm run dev (or set VITE_API_URL to your hosted API).';
    return hint;
  }
  return raw || 'Network request failed';
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    throw new Error(networkErrorMessage(err));
  }
}

async function authHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function parseJsonResponse(res, fallbackError) {
  const text = await res.text();
  if (!text?.trim()) {
    throw new Error(
      res.ok
        ? 'The server returned an empty response. Please try again.'
        : fallbackError,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(fallbackError);
  }
}

export async function fetchPersonalityTest(userName, demographics) {
  const res = await safeFetch(apiUrl('/api/assess/personality/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, demographics }),
  });
  const data = await parseJsonResponse(res, 'Could not generate personality test');
  if (!res.ok) throw new Error(data.error || 'Could not generate personality test');
  return data;
}

export async function scorePersonalityTest({
  userName,
  demographics,
  questions,
  answers,
  priorTypeCode = null,
  accessToken = null,
}) {
  const res = await safeFetch(apiUrl('/api/assess/personality/score'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({ userName, demographics, questions, answers, priorTypeCode }),
  });
  const data = await parseJsonResponse(res, 'Could not analyze personality');
  if (!res.ok) throw new Error(data.error || 'Could not analyze personality');
  return data;
}

export async function fetchBurnoutTest({ userName, demographics, personality }) {
  const res = await safeFetch(apiUrl('/api/assess/burnout/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, demographics, personality }),
  });
  const data = await parseJsonResponse(res, 'Could not generate burnout test');
  if (!res.ok) throw new Error(data.error || 'Could not generate burnout test');
  return data;
}

export async function completeAssessment(payload, accessToken) {
  const res = await safeFetch(apiUrl('/api/assess/complete'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({
      userName: payload.userName,
      demographics: payload.demographics,
      recoveryPreferences: payload.recoveryPreferences,
      personality: payload.personality,
      personalityQuestions: payload.personalityQuestions,
      personalityAnswers: payload.personalityAnswers,
      burnoutQuestions: payload.burnoutQuestions,
      burnoutAnswers: payload.burnoutAnswers,
    }),
  });
  const data = await parseJsonResponse(res, 'Assessment completion failed');
  if (!res.ok) throw new Error(data.error || 'Assessment completion failed');
  return data;
}

export async function fetchSharedSession(shareToken) {
  let res;
  try {
    res = await safeFetch(apiUrl(`/api/session/${shareToken}`));
  } catch (err) {
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }
  const data = await parseJsonResponse(res, 'Share link not found');
  if (!res.ok) throw new Error(data.error || 'Share link not found');
  return data;
}

export async function linkSessionToAccount(sessionId, accessToken) {
  const res = await safeFetch(apiUrl('/api/history/link'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({ sessionId }),
  });
  const data = await parseJsonResponse(res, 'Could not save result to your account');
  if (!res.ok) throw new Error(data.error || 'Could not save result to your account');
  return data;
}

export async function fetchHistory(accessToken) {
  const res = await safeFetch(apiUrl('/api/history'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load history');
  if (!res.ok) throw new Error(data.error || 'Could not load history');
  return data;
}

export async function fetchSavedSession(sessionId, accessToken) {
  const res = await safeFetch(apiUrl(`/api/history/${sessionId}`), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load saved result');
  if (!res.ok) throw new Error(data.error || 'Could not load saved result');
  return data;
}

export async function downloadAccountExport(accessToken) {
  const res = await safeFetch(apiUrl('/api/account/export'), {
    headers: await authHeaders(accessToken),
  });
  if (!res.ok) {
    const data = await parseJsonResponse(res, 'Could not export your data');
    throw new Error(data.error || 'Could not export your data');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recharge-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteAccount(accessToken) {
  const res = await safeFetch(apiUrl('/api/account'), {
    method: 'DELETE',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not delete account');
  if (!res.ok) throw new Error(data.error || 'Could not delete account');
  return data;
}

export async function fetchAdminAccess(accessToken) {
  const res = await safeFetch(apiUrl('/api/admin/me'), {
    headers: await authHeaders(accessToken),
  });
  if (res.status === 401) {
    return { admin: false, configured: null };
  }
  const data = await parseJsonResponse(res, 'Could not verify admin access');
  if (!res.ok) return { admin: false, configured: data?.configured ?? null };
  return data;
}

export async function fetchAdminStats(accessToken) {
  const res = await safeFetch(apiUrl('/api/admin/stats'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load admin stats');
  if (!res.ok) throw new Error(data.error || 'Could not load admin stats');
  return data;
}

export async function fetchAdminCoachSettings(accessToken) {
  const res = await safeFetch(apiUrl('/api/admin/coach-settings'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load coach settings');
  if (!res.ok) throw new Error(data.error || 'Could not load coach settings');
  return data;
}

export async function updateAdminCoachSettings(accessToken, payload) {
  const res = await safeFetch(apiUrl('/api/admin/coach-settings'), {
    method: 'PUT',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not update coach settings');
  if (!res.ok) throw new Error(data.error || 'Could not update coach settings');
  return data;
}

export async function fetchAdminWorkspaces(accessToken) {
  const res = await safeFetch(apiUrl('/api/admin/workspaces'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load workspaces');
  if (!res.ok) throw new Error(data.error || 'Could not load workspaces');
  return data;
}

export async function createAdminWorkspace(accessToken, payload) {
  const res = await safeFetch(apiUrl('/api/admin/workspaces'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not create workspace');
  if (!res.ok) throw new Error(data.error || 'Could not create workspace');
  return data;
}

export async function updateAdminWorkspace(accessToken, id, payload) {
  const res = await safeFetch(apiUrl(`/api/admin/workspaces/${id}`), {
    method: 'PATCH',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not update workspace');
  if (!res.ok) throw new Error(data.error || 'Could not update workspace');
  return data;
}

export async function deleteAdminWorkspace(accessToken, id) {
  const res = await safeFetch(apiUrl(`/api/admin/workspaces/${id}`), {
    method: 'DELETE',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not delete workspace');
  if (!res.ok) throw new Error(data.error || 'Could not delete workspace');
  return data;
}

export async function resolveTenant(host) {
  const q = host ? `?host=${encodeURIComponent(host)}` : '';
  const res = await safeFetch(apiUrl(`/api/tenant/resolve${q}`));
  const data = await parseJsonResponse(res, 'Could not resolve tenant');
  if (!res.ok) throw new Error(data.error || 'Could not resolve tenant');
  return data;
}

export async function fetchAdminConnectors(accessToken) {
  const res = await safeFetch(apiUrl('/api/admin/connectors'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load AI connectors');
  if (!res.ok) throw new Error(data.error || 'Could not load AI connectors');
  return data;
}

export async function createAdminConnector(accessToken, payload) {
  const res = await safeFetch(apiUrl('/api/admin/connectors'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not create connector');
  if (!res.ok) throw new Error(data.error || 'Could not create connector');
  return data;
}

export async function updateAdminConnector(accessToken, id, payload) {
  const res = await safeFetch(apiUrl(`/api/admin/connectors/${id}`), {
    method: 'PATCH',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not update connector');
  if (!res.ok) throw new Error(data.error || 'Could not update connector');
  return data;
}

export async function deleteAdminConnector(accessToken, id) {
  const res = await safeFetch(apiUrl(`/api/admin/connectors/${id}`), {
    method: 'DELETE',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not delete connector');
  if (!res.ok) throw new Error(data.error || 'Could not delete connector');
  return data;
}

export async function testAdminConnector(accessToken, id) {
  const res = await safeFetch(apiUrl(`/api/admin/connectors/${id}/test`), {
    method: 'POST',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Connector test failed');
  if (!res.ok) throw new Error(data.error || 'Connector test failed');
  return data;
}

export async function fetchAdminLlmMonitor(accessToken) {
  const res = await safeFetch(apiUrl('/api/admin/llm-monitor'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load AI monitoring');
  if (!res.ok) throw new Error(data.error || 'Could not load AI monitoring');
  return data;
}

export async function probeAdminLlmMonitor(accessToken) {
  const res = await safeFetch(apiUrl('/api/admin/llm-monitor/probe'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not probe AI connectors');
  if (!res.ok) throw new Error(data.error || 'Could not probe AI connectors');
  return data;
}

export async function submitFeedback(payload, accessToken) {
  const res = await safeFetch(apiUrl('/api/feedback'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not send feedback');
  if (!res.ok) throw new Error(data.error || 'Could not send feedback');
  return data;
}

export async function fetchAdminFeedback(accessToken, status = 'new') {
  const res = await safeFetch(apiUrl(`/api/admin/feedback?status=${encodeURIComponent(status)}`), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load feedback');
  if (!res.ok) throw new Error(data.error || 'Could not load feedback');
  return data;
}

export async function updateAdminFeedback(accessToken, id, payload) {
  const res = await safeFetch(apiUrl(`/api/admin/feedback/${id}`), {
    method: 'PATCH',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not update feedback');
  if (!res.ok) throw new Error(data.error || 'Could not update feedback');
  return data;
}

export async function fetchCoachStatus(accessToken) {
  const res = await safeFetch(apiUrl('/api/coach/status'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load coach chat');
  if (!res.ok) throw new Error(data.error || 'Could not load coach chat');
  return data;
}

export async function startCoachConversation(accessToken, sessionId = null) {
  const res = await safeFetch(apiUrl('/api/coach/conversations'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(sessionId ? { sessionId } : {}),
  });
  const data = await parseJsonResponse(res, 'Could not start chat with Oma');
  if (!res.ok) throw new Error(data.error || 'Could not start chat with Oma');
  return data;
}

export async function sendCoachMessage(accessToken, conversationId, content) {
  const res = await safeFetch(apiUrl(`/api/coach/conversations/${conversationId}/messages`), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({ content }),
  });
  const data = await parseJsonResponse(res, 'Oma could not reply right now');
  if (!res.ok) throw new Error(data.error || 'Oma could not reply right now');
  return data;
}

export async function fetchCoachConversationMessages(accessToken, conversationId) {
  const res = await safeFetch(apiUrl(`/api/coach/conversations/${conversationId}/messages`), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load this chat');
  if (!res.ok) throw new Error(data.error || 'Could not load this chat');
  return data;
}
