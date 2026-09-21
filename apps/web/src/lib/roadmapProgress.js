import {
  phaseDayKey,
  resolveRoadmapFocus,
  unlockedPhases,
} from '@recharge/shared/roadmapProgress';

const STORAGE_PREFIX = 'recharge-roadmap-progress-v1';

function storageKey(sessionId) {
  return `${STORAGE_PREFIX}:${sessionId || 'local'}`;
}

export function loadRoadmapProgress(sessionId) {
  if (typeof window === 'undefined') return { completedDayKeys: [], startedAt: null };
  try {
    const raw = window.localStorage.getItem(storageKey(sessionId));
    if (!raw) return { completedDayKeys: [], startedAt: null };
    const parsed = JSON.parse(raw);
    return {
      completedDayKeys: Array.isArray(parsed.completedDayKeys)
        ? parsed.completedDayKeys.map(String)
        : [],
      startedAt: parsed.startedAt || null,
    };
  } catch {
    return { completedDayKeys: [], startedAt: null };
  }
}

export function saveRoadmapProgress(sessionId, progress) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey(sessionId),
      JSON.stringify({
        completedDayKeys: progress.completedDayKeys ?? [],
        startedAt: progress.startedAt || Date.now(),
        updatedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.warn('Could not save roadmap progress:', err?.message || err);
  }
}

export function toggleDayComplete(sessionId, phase, index, completed) {
  const current = loadRoadmapProgress(sessionId);
  const key = phaseDayKey(phase, index);
  const set = new Set(current.completedDayKeys);
  if (completed) set.add(key);
  else set.delete(key);
  const next = {
    completedDayKeys: [...set],
    startedAt: current.startedAt || Date.now(),
  };
  saveRoadmapProgress(sessionId, next);
  return next;
}

export function ensurePlanStarted(sessionId) {
  const current = loadRoadmapProgress(sessionId);
  if (current.startedAt) return current;
  const next = { ...current, startedAt: Date.now() };
  saveRoadmapProgress(sessionId, next);
  return next;
}

export { phaseDayKey, resolveRoadmapFocus, unlockedPhases };
