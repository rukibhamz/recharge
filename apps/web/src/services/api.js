async function authHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

export async function fetchPersonalityQuestions(userName) {
  const res = await fetch('/api/questions/personality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not generate personality questions');
  }
  return data;
}

export async function fetchBurnoutQuestions({ userName, personalityAnswers, personalityQuestions }) {
  const res = await fetch('/api/questions/burnout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, personalityAnswers, personalityQuestions }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not generate burnout questions');
  }
  return data;
}

export async function submitAssessment(payload, accessToken) {
  const res = await fetch('/api/assess', {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({
      userName: payload.userName,
      burnoutAnswers: payload.burnoutAnswers,
      personalityAnswers: payload.personalityAnswers,
      burnoutQuestions: payload.burnoutQuestions,
      personalityQuestions: payload.personalityQuestions,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Assessment submission failed');
  }
  return data;
}

export async function fetchSharedSession(shareToken) {
  const res = await fetch(`/api/session/${shareToken}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Share link not found');
  }
  return data;
}

export async function linkSessionToAccount(sessionId, accessToken) {
  const res = await fetch('/api/history/link', {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({ sessionId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not save result to your account');
  }
  return data;
}

export async function fetchHistory(accessToken) {
  const res = await fetch('/api/history', {
    headers: await authHeaders(accessToken),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not load history');
  }
  return data;
}

export async function fetchSavedSession(sessionId, accessToken) {
  const res = await fetch(`/api/history/${sessionId}`, {
    headers: await authHeaders(accessToken),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not load saved result');
  }
  return data;
}
