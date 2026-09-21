import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatTodayPlanForCoach,
  inferCompletedKeysFromStart,
  phaseDayKey,
  resolveRoadmapFocus,
} from './roadmapProgress.js';

const sampleRoadmap = {
  phases: [
    { id: 'day-1', label: 'Day 1', title: 'Stabilise', focus: 'Rest', steps: [{ title: 'Nap', when: 'Morning' }], locked: false },
    { id: 'day-2', label: 'Day 2', title: 'Boundaries', focus: 'Say no', steps: [{ title: 'Decline one ask' }], locked: false },
    { id: 'day-3', label: 'Day 3', title: 'Rebuild', locked: false },
  ],
};

describe('roadmapProgress', () => {
  it('phaseDayKey prefers id', () => {
    assert.equal(phaseDayKey({ id: 'day-1' }, 0), 'day-1');
    assert.equal(phaseDayKey({ dayStart: 2 }, 1), 'day-2');
  });

  it('resolveRoadmapFocus picks first incomplete day', () => {
    const focus = resolveRoadmapFocus(sampleRoadmap, ['day-1']);
    assert.equal(focus.today.id, 'day-2');
    assert.equal(focus.done.length, 1);
    assert.equal(focus.upcoming.length, 1);
  });

  it('formatTodayPlanForCoach includes checklist', () => {
    const text = formatTodayPlanForCoach(sampleRoadmap, []);
    assert.match(text, /Today's recovery focus/);
    assert.match(text, /Stabilise/);
    assert.match(text, /Nap/);
  });

  it('inferCompletedKeysFromStart advances with calendar days', () => {
    const twoDaysAgo = Date.now() - 2 * 86400000;
    const keys = inferCompletedKeysFromStart(sampleRoadmap, twoDaysAgo);
    assert.deepEqual(keys, ['day-1', 'day-2']);
  });

  it('explicit empty completedKeys stays on day 1', () => {
    const twoDaysAgo = Date.now() - 2 * 86400000;
    const text = formatTodayPlanForCoach(sampleRoadmap, [], twoDaysAgo);
    assert.match(text, /Stabilise/);
  });
});
