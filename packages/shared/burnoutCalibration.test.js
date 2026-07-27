import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calibrateBurnout,
  scoreBurnoutByDimension,
  clsFromBurnoutPct,
} from './burnoutCalibration.js';

const options = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Always' },
];

function questionsWithDims() {
  const dims = [
    'exhaustion',
    'exhaustion',
    'cynicism',
    'cynicism',
    'efficacy',
    'efficacy',
    'autonomy',
    'autonomy',
    'recognition',
    'recognition',
    'community',
    'community',
  ];
  return dims.map((dimension) => ({
    dimension,
    reverseScored: false,
    options,
  }));
}

describe('scoreBurnoutByDimension', () => {
  it('returns per-dimension percentages', () => {
    const questions = questionsWithDims();
    const answers = Array(12).fill(2);
    const raw = scoreBurnoutByDimension(answers, questions);
    assert.equal(raw.rawPct, 50);
    assert.equal(raw.dimensions.exhaustion, 50);
    assert.equal(raw.dimensions.community, 50);
  });
});

describe('calibrateBurnout', () => {
  it('produces different calibrated pct for introvert vs extravert on same answers', () => {
    const questions = questionsWithDims();
    // High community stress
    const answers = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4];
    const raw = scoreBurnoutByDimension(answers, questions);

    const introvert = calibrateBurnout(raw, {
      traits: [
        { name: 'E/I', pct: 30, poleA: 'E', poleB: 'I' },
        { name: 'S/N', pct: 50, poleA: 'S', poleB: 'N' },
        { name: 'T/F', pct: 50, poleA: 'T', poleB: 'F' },
        { name: 'J/P', pct: 50, poleA: 'J', poleB: 'P' },
      ],
    });

    const extravert = calibrateBurnout(raw, {
      traits: [
        { name: 'E/I', pct: 70, poleA: 'E', poleB: 'I' },
        { name: 'S/N', pct: 50, poleA: 'S', poleB: 'N' },
        { name: 'T/F', pct: 50, poleA: 'T', poleB: 'F' },
        { name: 'J/P', pct: 50, poleA: 'J', poleB: 'P' },
      ],
    });

    assert.equal(introvert.rawPct, extravert.rawPct);
    assert.notEqual(introvert.pct, extravert.pct);
  });

  it('keeps severe raw scores at least severe after calibration', () => {
    const questions = questionsWithDims();
    const answers = Array(12).fill(4);
    const raw = scoreBurnoutByDimension(answers, questions);
    assert.ok(raw.rawPct >= 75);

    const calibrated = calibrateBurnout(raw, {
      traits: [
        { name: 'E/I', pct: 30, poleA: 'E', poleB: 'I' },
        { name: 'S/N', pct: 30, poleA: 'S', poleB: 'N' },
        { name: 'T/F', pct: 30, poleA: 'T', poleB: 'F' },
        { name: 'J/P', pct: 30, poleA: 'J', poleB: 'P' },
      ],
    });

    assert.ok(calibrated.pct >= 70);
    assert.equal(calibrated.cls, 'severe');
  });
});

describe('clsFromBurnoutPct', () => {
  it('maps thresholds', () => {
    assert.equal(clsFromBurnoutPct(10), 'healthy');
    assert.equal(clsFromBurnoutPct(30), 'mild');
    assert.equal(clsFromBurnoutPct(50), 'moderate');
    assert.equal(clsFromBurnoutPct(80), 'severe');
  });
});
