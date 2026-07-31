import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMbti, formatMbtiType, pickDichotomyLetter } from './mbtiScoring.js';

describe('scoreMbti', () => {
  it('derives ESTJ when E/S/T/J poles dominate', () => {
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

  it('keeps same typeCode when question text differs but poles match', () => {
    const poles = ['E', 'E', 'I', 'I', 'S', 'S', 'N', 'N', 'T', 'T', 'F', 'F', 'J', 'J', 'P', 'P'];
    const answers = [4, 3, 0, 1, 1, 0, 4, 3, 4, 3, 0, 1, 4, 3, 0, 1];
    const setA = poles.map((scoredPole, i) => ({
      text: `Statement A ${i}`,
      scoredPole,
    }));
    const setB = poles.map((scoredPole, i) => ({
      text: `Paraphrased statement B ${i} for the same pole`,
      scoredPole,
    }));
    assert.equal(scoreMbti(answers, setA).typeCode, scoreMbti(answers, setB).typeCode);
  });

  it('keeps prior letter when dichotomy is unclear', () => {
    const questions = [
      { scoredPole: 'E' },
      { scoredPole: 'I' },
      { scoredPole: 'S' },
      { scoredPole: 'N' },
      { scoredPole: 'T' },
      { scoredPole: 'F' },
      { scoredPole: 'J' },
      { scoredPole: 'P' },
    ];
    // Near 50/50 on E/I
    const answers = [2, 2, 4, 0, 4, 0, 4, 0];
    const withoutPrior = scoreMbti(answers, questions);
    const withPrior = scoreMbti(answers, questions, { priorTypeCode: 'INTJ' });
    assert.equal(withPrior.typeCode.charAt(0), 'I');
    assert.equal(withPrior.traits[0].clear, false);
    assert.ok(withoutPrior.typeCode.length === 4);
  });
});

describe('pickDichotomyLetter', () => {
  it('requires a clear margin to flip away from prior', () => {
    const unclear = pickDichotomyLetter(5, 5, 'E', 'I', 'I');
    assert.equal(unclear.letter, 'I');
    assert.equal(unclear.clear, false);

    const clearE = pickDichotomyLetter(8, 2, 'E', 'I', 'I');
    assert.equal(clearE.letter, 'E');
    assert.equal(clearE.clear, true);
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
