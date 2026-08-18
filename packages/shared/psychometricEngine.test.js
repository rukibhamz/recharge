import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoreOcean, deriveOceanFromMbti, traitBand } from './oceanScoring.js';
import { buildFallbackOceanQuestions } from './oceanQuestions.js';
import { buildPsychometricProfile } from './psychometricEngine.js';

describe('oceanScoring', () => {
  it('scores all five traits from keyed items', () => {
    const questions = buildFallbackOceanQuestions();
    const answers = questions.map((q) => (q.reverseScored ? 0 : 4));
    const result = scoreOcean(answers, questions);
    assert.equal(Object.keys(result.scores).length, 5);
    assert.ok(result.scores.C >= 90);
    assert.ok(result.scores.E >= 90);
  });

  it('derives OCEAN from MBTI traits', () => {
    const mbtiTraits = [
      { poleA: 'E', pct: 25 },
      { poleA: 'S', pct: 70 },
      { poleA: 'T', pct: 30 },
      { poleA: 'J', pct: 80 },
    ];
    const { scores } = deriveOceanFromMbti(mbtiTraits);
    assert.ok(scores.E <= 30);
    assert.ok(scores.C >= 75);
    assert.ok(scores.A >= 65);
  });

  it('classifies trait bands', () => {
    assert.equal(traitBand(70), 'high');
    assert.equal(traitBand(30), 'low');
    assert.equal(traitBand(50), 'moderate');
  });
});

describe('psychometricEngine', () => {
  it('produces different conflicts for different profiles', () => {
    const burnout = {
      cls: 'moderate',
      level: 'Moderate Burnout',
      pct: 55,
      dimensions: { exhaustion: 72, cynicism: 40, efficacy: 35, autonomy: 30, recognition: 25, community: 45 },
    };

    const highA = buildPsychometricProfile(
      { scores: { O: 50, C: 55, E: 45, A: 78, N: 50 } },
      burnout,
    );
    const highC = buildPsychometricProfile(
      { scores: { O: 50, C: 82, E: 45, A: 45, N: 60 } },
      burnout,
    );

    assert.notEqual(
      highA.diagnostic_summary.core_conflict,
      highC.diagnostic_summary.core_conflict,
    );
    assert.ok(highA.actionable_protocol.length >= 2);
    assert.ok(highC.actionable_protocol[0].protocol_rule.length > 20);
  });

  it('includes trait-specific protocol traps', () => {
    const profile = buildPsychometricProfile(
      { scores: { O: 45, C: 80, E: 40, A: 75, N: 55 } },
      {
        cls: 'severe',
        level: 'Severe Burnout',
        dimensions: { exhaustion: 80, cynicism: 50, efficacy: 30, autonomy: 55, recognition: 40, community: 35 },
      },
    );

    const traps = profile.actionable_protocol.map((p) => p.personality_trap).join(' ');
    assert.match(traps, /Conscientiousness|Agreeableness|Neuroticism|Extraversion|Openness/i);
    assert.ok(profile.diagnostic_summary.accelerators.length >= 1);
  });
});
