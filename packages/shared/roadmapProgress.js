/**
 * Roadmap progress helpers — which day is "today", done vs upcoming.
 */

export function unlockedPhases(roadmap) {
  return (roadmap?.phases ?? []).filter((p) => p && !p.locked);
}

export function phaseDayKey(phase, index = 0) {
  if (!phase) return `day-${index + 1}`;
  if (phase.id) return String(phase.id);
  if (phase.dayStart != null) return `day-${phase.dayStart}`;
  return `day-${index + 1}`;
}

/**
 * First incomplete unlocked day is "today". If all complete, today is the last day.
 */
export function resolveRoadmapFocus(roadmap, completedKeys = []) {
  const phases = unlockedPhases(roadmap);
  const done = new Set((completedKeys ?? []).map(String));

  if (!phases.length) {
    return { today: null, upcoming: [], done: [], todayIndex: -1 };
  }

  const donePhases = [];
  const upcoming = [];
  let today = null;
  let todayIndex = -1;

  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    const key = phaseDayKey(phase, i);
    if (done.has(key)) {
      donePhases.push(phase);
      continue;
    }
    if (!today) {
      today = phase;
      todayIndex = i;
    } else {
      upcoming.push(phase);
    }
  }

  if (!today) {
    today = phases[phases.length - 1];
    todayIndex = phases.length - 1;
  }

  return {
    today,
    upcoming,
    done: donePhases,
    todayIndex,
    completedCount: donePhases.length,
    totalCount: phases.length,
  };
}

/**
 * Treat prior calendar days as complete for focus when the user has not checked off days.
 * Day 0 of the plan = startedAt; after N full days, today is phase N (capped at last day).
 */
export function inferCompletedKeysFromStart(roadmap, startedAt) {
  const phases = unlockedPhases(roadmap);
  if (!phases.length || startedAt == null) return [];
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return [];
  const elapsed = Math.floor((Date.now() - start) / 86400000);
  const prior = Math.min(Math.max(0, elapsed), phases.length - 1);
  return phases.slice(0, prior).map((p, i) => phaseDayKey(p, i));
}

/** Compact text block for Oma: today's checklist only. */
export function formatTodayPlanForCoach(roadmap, completedKeys = null, startedAt = null) {
  const keys =
    completedKeys == null
      ? inferCompletedKeysFromStart(roadmap, startedAt)
      : Array.isArray(completedKeys)
        ? completedKeys
        : [];
  const { today, completedCount, totalCount } = resolveRoadmapFocus(roadmap, keys);
  if (!today) return '';

  const lines = [
    `Today's recovery focus (${today.label || 'Today'} — ${completedCount}/${totalCount} days done):`,
    `Title: ${today.title || 'Recovery day'}`,
  ];
  if (today.focus) lines.push(`Focus: ${today.focus}`);
  if (today.outcome) lines.push(`Done when: ${today.outcome}`);

  const steps = today.steps ?? [];
  if (steps.length) {
    lines.push('Checklist:');
    for (const step of steps.slice(0, 6)) {
      const tip = step.tip ? ` — ${String(step.tip).slice(0, 140)}` : '';
      lines.push(`- [${step.when || 'Today'}] ${step.title || 'Step'}${tip}`);
      if (step.script) lines.push(`  Script: ${String(step.script).slice(0, 120)}`);
    }
  }

  lines.push(
    'When they want advice, prefer helping with TODAY\'s checklist first. Do not dump the whole multi-day plan unless they ask for later days.',
  );
  return lines.join('\n');
}
