import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AGREEMENT_OPTIONS } from './questions.js';
import {
  isValidPersonalityStatement,
  coerceOptionsToScale,
  normalizeLlmOptions,
  optionLabelForValue,
} from './questionOptions.js';
import { inferQuestionScale, optionsForQuestion, resolveQuestionScale } from './questions.js';

describe('questionOptions', () => {
  it('normalizes valid LLM options', () => {
    const raw = [
      { value: 0, label: 'Not me at all' },
      { value: 1, label: 'Rarely' },
      { value: 2, label: 'Sometimes' },
      { value: 3, label: 'Often' },
      { value: 4, label: 'Almost always' },
    ];
    const out = normalizeLlmOptions(raw, AGREEMENT_OPTIONS);
    assert.equal(out.length, 5);
    assert.equal(out[0].label, 'Not me at all');
    assert.equal(out[4].value, 4);
  });

  it('falls back when option count is wrong', () => {
    const out = normalizeLlmOptions([{ value: 0, label: 'Only one' }], AGREEMENT_OPTIONS);
    assert.deepEqual(out, AGREEMENT_OPTIONS);
  });

  it('rejects either/or personality questions', () => {
    assert.equal(
      isValidPersonalityStatement(
        'Do you feel more energised with others or after time alone?',
      ),
      false,
    );
    assert.equal(
      isValidPersonalityStatement(
        'I feel more energised after spending time with others than after time alone.',
      ),
      true,
    );
  });

  it('resolves label for value', () => {
    assert.equal(optionLabelForValue(AGREEMENT_OPTIONS, 3), 'Agree');
  });

  it('coerces Never/Always options to agreement for I statements', () => {
    const freq = [
      { value: 0, label: 'Never' },
      { value: 1, label: 'Rarely' },
      { value: 2, label: 'Sometimes' },
      { value: 3, label: 'Often' },
      { value: 4, label: 'Always' },
    ];
    const out = coerceOptionsToScale(freq, 'agreement');
    assert.equal(out[0].label, 'Strongly disagree');
    assert.equal(out[4].label, 'Strongly agree');
  });
});
