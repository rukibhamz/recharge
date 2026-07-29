import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureLifeSocialBurnoutMix,
  inferBurnoutLifeDomain,
  personalityQuestionDomainHint,
} from './questionLifeDomains.js';

describe('questionLifeDomains', () => {
  it('classifies work vs life/social burnout text', () => {
    assert.equal(inferBurnoutLifeDomain('I feel drained at the end of most workdays.'), 'work');
    assert.equal(
      inferBurnoutLifeDomain('I have no energy left for friends or family.'),
      'life_social',
    );
  });

  it('ensures minimum life/social burnout items', () => {
    const all = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      question_text: `I feel exhausted by work task ${i}.`,
      dimension: 'Exhaustion',
    }));
    const picked = all.slice(0, 12);
    const mixed = ensureLifeSocialBurnoutMix(picked, all, 2);
    const lifeCount = mixed.filter(
      (q) => inferBurnoutLifeDomain(q.question_text) === 'life_social',
    ).length;
    assert.ok(lifeCount >= 2);
  });

  it('personality domain hint avoids work-only framing', () => {
    const hint = personalityQuestionDomainHint('E/I', 0);
    assert.match(hint, /friendships/i);
    assert.match(hint, /Do NOT mention work/i);
  });
});
