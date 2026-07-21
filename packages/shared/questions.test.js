import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FREQUENCY_OPTIONS, inferQuestionScale, optionsForQuestion, resolveQuestionScale } from './questions.js';

describe('inferQuestionScale', () => {
  it('uses agreement for I statements', () => {
    assert.equal(inferQuestionScale('I feel trapped in my role with no clear exit.'), 'agreement');
    assert.equal(
      inferQuestionScale('There is significant interpersonal conflict in my workplace.'),
      'agreement',
    );
  });

  it('uses frequency for how-often prompts', () => {
    assert.equal(
      inferQuestionScale('How often do you feel emotionally drained by your work?'),
      'frequency',
    );
  });
});

describe('resolveQuestionScale', () => {
  it('prefers explicit scale from bank/LLM over text inference', () => {
    assert.equal(
      resolveQuestionScale({
        response_scale: 'frequency',
        text: 'I feel trapped in my role.',
      }),
      'frequency',
    );
    assert.equal(
      resolveQuestionScale({ scale: 'agreement', text: 'How often do you feel drained?' }),
      'agreement',
    );
  });
});

describe('optionsForQuestion burnout', () => {
  it('uses agreement labels when response_scale is agreement', () => {
    const q = {
      text: 'Rest and weekends no longer feel restorative.',
      response_scale: 'agreement',
      options: FREQUENCY_OPTIONS,
    };
    const opts = optionsForQuestion(q, 'burnout');
    assert.equal(opts[0].label, 'Strongly disagree');
  });

  it('uses frequency labels when response_scale is frequency', () => {
    const q = {
      text: 'I feel trapped in my role.',
      scale: 'frequency',
    };
    const opts = optionsForQuestion(q, 'burnout');
    assert.equal(opts[0].label, 'Never');
  });
});
