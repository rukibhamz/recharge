import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COACH_NAME,
  detectsCrisisLanguage,
  CRISIS_RESPONSE,
  OMA_PERSONA,
  sanitizeOmaReply,
} from './coachPersona.js';

describe('coachPersona', () => {
  it('names the coach Oma', () => {
    assert.equal(COACH_NAME, 'Oma');
    assert.match(OMA_PERSONA, /You are Oma/);
  });

  it('detects crisis language', () => {
    assert.equal(detectsCrisisLanguage('I want to kill myself'), true);
    assert.equal(detectsCrisisLanguage('I feel tired after work'), false);
  });

  it('has a crisis response with help guidance', () => {
    assert.match(CRISIS_RESPONSE, /crisis/i);
    assert.match(CRISIS_RESPONSE, /emergency/i);
  });

  it('strips asterisks and em dashes from replies', () => {
    const cleaned = sanitizeOmaReply(
      'That wall is real — and it is your body saying *enough*. Aim for the *smallest* version of a good day.',
    );
    assert.equal(cleaned.includes('*'), false);
    assert.equal(cleaned.includes('—'), false);
    assert.match(cleaned, /enough/);
    assert.match(cleaned, /smallest/);
    assert.match(cleaned, /That wall is real,/);
  });

  it('forbids AI formatting in persona rules', () => {
    assert.match(OMA_PERSONA, /Never use asterisks/i);
    assert.match(OMA_PERSONA, /Never use em dashes/i);
  });
});
