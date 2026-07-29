import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COACH_NAME,
  detectsCrisisLanguage,
  CRISIS_RESPONSE,
  OMA_PERSONA,
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
});
