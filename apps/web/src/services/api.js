/** Empty in dev (Vite proxies /api). Set VITE_API_URL on Vercel to your hosted API origin. */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function apiUrl(path) {
  return `${API_BASE}${path}`;
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
  const res = await fetch(apiUrl('/api/assess/personality/test'), {
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
}) {
  const res = await fetch(apiUrl('/api/assess/personality/score'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, demographics, questions, answers }),
  });
  const data = await parseJsonResponse(res, 'Could not analyze personality');
  if (!res.ok) throw new Error(data.error || 'Could not analyze personality');
  return data;
}

export async function fetchBurnoutTest({ userName, demographics, personality }) {
  const res = await fetch(apiUrl('/api/assess/burnout/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, demographics, personality }),
  });
  const data = await parseJsonResponse(res, 'Could not generate burnout test');
  if (!res.ok) throw new Error(data.error || 'Could not generate burnout test');
  return data;
}

export async function completeAssessment(payload, accessToken) {
  const res = await fetch(apiUrl('/api/assess/complete'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({
      userName: payload.userName,
      demographics: payload.demographics,
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
  const res = await fetch(apiUrl(`/api/session/${shareToken}`));
  const data = await parseJsonResponse(res, 'Share link not found');
  if (!res.ok) throw new Error(data.error || 'Share link not found');
  return data;
}

export async function linkSessionToAccount(sessionId, accessToken) {
  const res = await fetch(apiUrl('/api/history/link'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({ sessionId }),
  });
  const data = await parseJsonResponse(res, 'Could not save result to your account');
  if (!res.ok) throw new Error(data.error || 'Could not save result to your account');
  return data;
}

export async function fetchHistory(accessToken) {
  const res = await fetch(apiUrl('/api/history'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load history');
  if (!res.ok) throw new Error(data.error || 'Could not load history');
  return data;
}

export async function fetchSavedSession(sessionId, accessToken) {
  const res = await fetch(apiUrl(`/api/history/${sessionId}`), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load saved result');
  if (!res.ok) throw new Error(data.error || 'Could not load saved result');
  return data;
}

export async function downloadAccountExport(accessToken) {
  const res = await fetch(apiUrl('/api/account/export'), {
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
  const res = await fetch(apiUrl('/api/account'), {
    method: 'DELETE',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not delete account');
  if (!res.ok) throw new Error(data.error || 'Could not delete account');
  return data;
}

export async function fetchAdminAccess(accessToken) {
  const res = await fetch(apiUrl('/api/admin/me'), {
    headers: await authHeaders(accessToken),
  });
  if (res.status === 401 || res.status === 403 || res.status === 503) {
    return { admin: false };
  }
  const data = await parseJsonResponse(res, 'Could not verify admin access');
  if (!res.ok) return { admin: false };
  return data;
}

export async function fetchAdminStats(accessToken) {
  const res = await fetch(apiUrl('/api/admin/stats'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load admin stats');
  if (!res.ok) throw new Error(data.error || 'Could not load admin stats');
  return data;
}

export async function fetchAdminWorkspaces(accessToken) {
  const res = await fetch(apiUrl('/api/admin/workspaces'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load workspaces');
  if (!res.ok) throw new Error(data.error || 'Could not load workspaces');
  return data;
}

export async function createAdminWorkspace(accessToken, payload) {
  const res = await fetch(apiUrl('/api/admin/workspaces'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not create workspace');
  if (!res.ok) throw new Error(data.error || 'Could not create workspace');
  return data;
}

export async function updateAdminWorkspace(accessToken, id, payload) {
  const res = await fetch(apiUrl(`/api/admin/workspaces/${id}`), {
    method: 'PATCH',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not update workspace');
  if (!res.ok) throw new Error(data.error || 'Could not update workspace');
  return data;
}

export async function deleteAdminWorkspace(accessToken, id) {
  const res = await fetch(apiUrl(`/api/admin/workspaces/${id}`), {
    method: 'DELETE',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not delete workspace');
  if (!res.ok) throw new Error(data.error || 'Could not delete workspace');
  return data;
}

export async function resolveTenant(host) {
  const q = host ? `?host=${encodeURIComponent(host)}` : '';
  const res = await fetch(apiUrl(`/api/tenant/resolve${q}`));
  const data = await parseJsonResponse(res, 'Could not resolve tenant');
  if (!res.ok) throw new Error(data.error || 'Could not resolve tenant');
  return data;
}

export async function fetchAdminConnectors(accessToken) {
  const res = await fetch(apiUrl('/api/admin/connectors'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load AI connectors');
  if (!res.ok) throw new Error(data.error || 'Could not load AI connectors');
  return data;
}

export async function createAdminConnector(accessToken, payload) {
  const res = await fetch(apiUrl('/api/admin/connectors'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not create connector');
  if (!res.ok) throw new Error(data.error || 'Could not create connector');
  return data;
}

export async function updateAdminConnector(accessToken, id, payload) {
  const res = await fetch(apiUrl(`/api/admin/connectors/${id}`), {
    method: 'PATCH',
    headers: await authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(res, 'Could not update connector');
  if (!res.ok) throw new Error(data.error || 'Could not update connector');
  return data;
}

export async function deleteAdminConnector(accessToken, id) {
  const res = await fetch(apiUrl(`/api/admin/connectors/${id}`), {
    method: 'DELETE',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not delete connector');
  if (!res.ok) throw new Error(data.error || 'Could not delete connector');
  return data;
}

export async function testAdminConnector(accessToken, id) {
  const res = await fetch(apiUrl(`/api/admin/connectors/${id}/test`), {
    method: 'POST',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Connector test failed');
  if (!res.ok) throw new Error(data.error || 'Connector test failed');
  return data;
}

export async function fetchAdminLlmMonitor(accessToken) {
  const res = await fetch(apiUrl('/api/admin/llm-monitor'), {
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not load AI monitoring');
  if (!res.ok) throw new Error(data.error || 'Could not load AI monitoring');
  return data;
}

export async function probeAdminLlmMonitor(accessToken) {
  const res = await fetch(apiUrl('/api/admin/llm-monitor/probe'), {
    method: 'POST',
    headers: await authHeaders(accessToken),
  });
  const data = await parseJsonResponse(res, 'Could not probe AI connectors');
  if (!res.ok) throw new Error(data.error || 'Could not probe AI connectors');
  return data;
}
