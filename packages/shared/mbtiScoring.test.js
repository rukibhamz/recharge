import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMbti, formatMbtiType } from './mbtiScoring.js';

describe('scoreMbti', () => {
  it('derives INTJ when E/S/T/J poles dominate', () => {
    const questions = [
      { scoredPole: 'E' },
      { scoredPole: 'S' },
      { scoredPole: 'T' },
      { scoredPole: 'J' },
    ];
    const answers = [4, 4, 4, 4];
    const result = scoreMbti(answers, questions);
    assert.equal(result.typeCode, 'ESTJ');
  });

  it('derives introverted type when I pole questions score higher', () => {
    const questions = [
      { scoredPole: 'I' },
      { scoredPole: 'S' },
      { scoredPole: 'T' },
      { scoredPole: 'J' },
    ];
    const answers = [4, 0, 0, 0];
    const result = scoreMbti(answers, questions);
    assert.equal(result.typeCode.charAt(0), 'I');
    assert.equal(result.traits.length, 4);
  });
});

describe('formatMbtiType', () => {
  it('formats profile for results UI', () => {
    const type = formatMbtiType({
      code: 'INTJ',
      title: 'Architect',
      archetype: 'The Strategist',
      description: 'Strategic thinker.',
      strengths: 'Planning',
      growth_areas: 'Empathy',
    });
    assert.equal(type.code, 'INTJ');
    assert.equal(type.name, 'INTJ — Architect');
    assert.equal(type.archetype, 'The Strategist');
    assert.equal(type.growthAreas, 'Empathy');
  });
});
