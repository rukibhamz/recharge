import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreBurnout, validateAnswers } from './scoring.js';

describe('scoreBurnout', () => {
  it('scores healthy answers as healthy', () => {
    const options = [
      { value: 0, label: 'Never' },
      { value: 1, label: 'Rarely' },
      { value: 2, label: 'Sometimes' },
      { value: 3, label: 'Often' },
      { value: 4, label: 'Always' },
    ];
    const questions = Array(12).fill({ reverseScored: false, options });
    questions[11] = { reverseScored: true, options };
    const answers = Array(12).fill(0);
    answers[11] = 4;
    const result = scoreBurnout(answers, questions);
    assert.equal(result.cls, 'healthy');
    assert.equal(result.pct, 0);
  });

  it('respects reverseScored metadata', () => {
    const options = [
      { value: 0, label: 'Never' },
      { value: 1, label: 'Rarely' },
      { value: 2, label: 'Sometimes' },
      { value: 3, label: 'Often' },
      { value: 4, label: 'Always' },
    ];
    const questions = Array(12).fill({ reverseScored: false, options });
    questions[5] = { reverseScored: true, options };
    const answers = Array(12).fill(0);
    answers[5] = 4;
    const result = scoreBurnout(answers, questions);
    assert.equal(result.pct, 0);
  });
});

describe('validateAnswers', () => {
  it('accepts 5-point personality scale', () => {
    const result = validateAnswers(Array(12).fill(4), 12, 4);
    assert.equal(result.valid, true);
  });

  it('rejects wrong length', () => {
    assert.equal(validateAnswers([1, 2]).valid, false);
  });
});
