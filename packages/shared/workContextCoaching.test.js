import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  workContextLanguageViolation,
  workContextQuestionCoaching,
  burnoutDimensionCoaching,
} from './workContextCoaching.js';

describe('workContextCoaching', () => {
  it('includes job seeker avoid rules in coaching block', () => {
    const block = workContextQuestionCoaching('between_roles');
    assert.match(block, /job search/i);
    assert.match(block, /NEVER imply/i);
    assert.match(block, /manager/i);
  });

  it('flags employer timeline language for job seekers', () => {
    const bad =
      "I feel that the timelines I'm given during this job search don't account for my own pace.";
    assert.ok(workContextLanguageViolation(bad, 'between_roles'));
  });

  it('allows job-search-native autonomy wording', () => {
    const ok =
      'I feel pressure to move faster in my job search than my energy and priorities allow.';
    assert.equal(workContextLanguageViolation(ok, 'between_roles'), null);
  });

  it('does not flag employer language for full-time workers', () => {
    const text = 'My manager sets deadlines that ignore how I work best.';
    assert.equal(workContextLanguageViolation(text, 'full_time'), null);
  });

  it('returns autonomy example for job seekers', () => {
    const block = burnoutDimensionCoaching('between_roles', 'autonomy');
    assert.match(block, /job search/i);
    assert.match(block, /NOT timelines given/i);
    assert.match(block, /Good rewrite example/i);
  });

  it('returns student-specific exhaustion hint', () => {
    const block = burnoutDimensionCoaching('student', 'exhaustion');
    assert.match(block, /study/i);
  });

  it('returns empty for unknown dimension', () => {
    assert.equal(burnoutDimensionCoaching('between_roles', ''), '');
  });
});
