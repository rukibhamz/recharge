import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  selectPoleBalancedPersonalityQuestions,
  PERSONALITY_PER_POLE,
  MBTI_DICHOTOMY_CODES,
} from './personalitySelection.js';

function buildPool() {
  const items = [];
  let n = 1;
  for (const code of MBTI_DICHOTOMY_CODES) {
    const [a, b] = code.split('/');
    for (let i = 0; i < 4; i += 1) {
      items.push({
        id: `${code}-${a}-${i}`,
        dichotomy: code,
        scored_pole: a,
        question_number: n++,
        question_text: `${a} item ${i}`,
      });
    }
    for (let i = 0; i < 4; i += 1) {
      items.push({
        id: `${code}-${b}-${i}`,
        dichotomy: code,
        scored_pole: b,
        question_number: n++,
        question_text: `${b} item ${i}`,
      });
    }
  }
  return items;
}

describe('selectPoleBalancedPersonalityQuestions', () => {
  it('picks equal poles for every dichotomy', () => {
    const selected = selectPoleBalancedPersonalityQuestions(buildPool(), { stable: true });
    assert.equal(selected.length, MBTI_DICHOTOMY_CODES.length * PERSONALITY_PER_POLE * 2);

    for (const code of MBTI_DICHOTOMY_CODES) {
      const [poleA, poleB] = code.split('/');
      const group = selected.filter((q) => q.dichotomy === code);
      assert.equal(group.filter((q) => q.scored_pole === poleA).length, PERSONALITY_PER_POLE);
      assert.equal(group.filter((q) => q.scored_pole === poleB).length, PERSONALITY_PER_POLE);
    }
  });

  it('uses a stable core (lowest question numbers) when stable=true', () => {
    const a = selectPoleBalancedPersonalityQuestions(buildPool(), { stable: true })
      .map((q) => q.id)
      .sort();
    const b = selectPoleBalancedPersonalityQuestions(buildPool(), { stable: true })
      .map((q) => q.id)
      .sort();
    assert.deepEqual(a, b);
  });
});
