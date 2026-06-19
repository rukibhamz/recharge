async function authHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

export async function fetchPersonalityTest(userName, demographics) {
  const res = await fetch('/api/assess/personality/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, demographics }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not generate personality test');
  return data;
}

export async function scorePersonalityTest({
  userName,
  demographics,
  questions,
  answers,
}) {
  const res = await fetch('/api/assess/personality/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, demographics, questions, answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not analyze personality');
  return data;
}

export async function fetchBurnoutTest({ userName, demographics, personality }) {
  const res = await fetch('/api/assess/burnout/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, demographics, personality }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not generate burnout test');
  return data;
}

export async function completeAssessment(payload, accessToken) {
  const res = await fetch('/api/assess/complete', {
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Assessment completion failed');
  return data;
}

export async function fetchSharedSession(shareToken) {
  const res = await fetch(`/api/session/${shareToken}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Share link not found');
  return data;
}

export async function linkSessionToAccount(sessionId, accessToken) {
  const res = await fetch('/api/history/link', {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({ sessionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not save result to your account');
  return data;
}

export async function fetchHistory(accessToken) {
  const res = await fetch('/api/history', {
    headers: await authHeaders(accessToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load history');
  return data;
}

export async function fetchSavedSession(sessionId, accessToken) {
  const res = await fetch(`/api/history/${sessionId}`, {
    headers: await authHeaders(accessToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load saved result');
  return data;
}
