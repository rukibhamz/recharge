import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAssessmentTask } from './assessmentAgentTasks.js';

describe('assessmentAgentTasks validators', () => {
  it('accepts valid personality rewrite', () => {
    const task = getAssessmentTask('rewritePersonalityQuestion');
    const input = {
      anchor: {
        seedText: 'I feel energised after spending time with a large group of people.',
        scoredPole: 'E',
        dichotomy: 'E/I',
      },
    };
    const check = task.validate(
      {
        text: 'I feel energised after collaborative team days at work.',
        scoredPole: 'E',
        dichotomy: 'E/I',
      },
      input,
    );
    assert.equal(check.ok, true);
    assert.equal(check.value.scoredPole, 'E');
  });

  it('rejects personality rewrite that drops scoredPole', () => {
    const task = getAssessmentTask('rewritePersonalityQuestion');
    const input = {
      anchor: {
        seedText: 'I feel energised after spending time with a large group of people.',
        scoredPole: 'E',
        dichotomy: 'E/I',
      },
    };
    const check = task.validate(
      { text: 'I feel energised after collaborative team days.', scoredPole: 'I', dichotomy: 'E/I' },
      input,
    );
    assert.equal(check.ok, false);
  });

  it('falls back to seed text', () => {
    const task = getAssessmentTask('rewritePersonalityQuestion');
    const input = {
      anchor: {
        seedText: 'I prefer deep one-on-one conversations.',
        scoredPole: 'I',
        dichotomy: 'E/I',
      },
    };
    const fb = task.fallback(input);
    assert.equal(fb.text, input.anchor.seedText);
    assert.equal(fb.scoredPole, 'I');
  });

  it('rejects burnout rewrite with wrong scale', () => {
    const task = getAssessmentTask('rewriteBurnoutQuestion');
    const input = {
      anchor: {
        seedText: 'How often do you feel drained by midday?',
        scale: 'frequency',
        dimension: 'exhaustion',
        reverseScored: false,
      },
    };
    const check = task.validate(
      {
        text: 'I feel drained by midday.',
        scale: 'agreement',
        dimension: 'exhaustion',
      },
      input,
    );
    assert.equal(check.ok, false);
  });
});
