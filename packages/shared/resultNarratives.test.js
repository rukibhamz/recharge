import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBurnoutNarrative,
  buildMoodboardCaption,
  isGenericBurnoutSummary,
  resolveBurnoutSummary,
  topLoadDimensions,
} from './resultNarratives.js';

describe('isGenericBurnoutSummary', () => {
  it('flags KPI-style copy', () => {
    assert.equal(
      isGenericBurnoutSummary(
        'The data indicates a moderate level of performance, with 65% of the expected targets achieved.',
      ),
      true,
    );
  });

  it('accepts personal coach-style copy', () => {
    assert.equal(
      isGenericBurnoutSummary(
        'Your check-in lands at 65% — moderate burnout. What stands out is energy drain from long stretches without recovery, plus pressure around control over your work.',
      ),
      false,
    );
  });
});

describe('buildBurnoutNarrative', () => {
  it('names score and elevated dimensions', () => {
    const text = buildBurnoutNarrative(
      {
        pct: 65,
        cls: 'moderate',
        level: 'Moderate Burnout',
        dimensions: { exhaustion: 72, autonomy: 60, community: 20 },
      },
      {
        typeCode: 'ISTJ',
        type: { name: 'The Logician', title: 'The Logician' },
        traits: [
          { name: 'E/I', poleA: 'E', poleB: 'I', pct: 33 },
          { name: 'T/F', poleA: 'T', poleB: 'F', pct: 53 },
          { name: 'J/P', poleA: 'J', poleB: 'P', pct: 54 },
        ],
      },
    );
    assert.match(text, /65%/);
    assert.match(text, /Moderate Burnout|moderate/i);
    assert.match(text, /energy drain|control/i);
    assert.doesNotMatch(text, /performance|targets/i);
  });

  it('resolve replaces generic summaries', () => {
    const text = resolveBurnoutSummary(
      {
        pct: 65,
        cls: 'moderate',
        level: 'Moderate Burnout',
        summary:
          'The data indicates a moderate level of performance, with 65% of the expected targets achieved.',
        dimensions: { exhaustion: 70 },
      },
      null,
    );
    assert.doesNotMatch(text, /expected targets/i);
    assert.match(text, /65%/);
  });
});

describe('topLoadDimensions', () => {
  it('sorts by load', () => {
    const tops = topLoadDimensions({ exhaustion: 80, community: 30, autonomy: 55 });
    assert.equal(tops[0].key, 'exhaustion');
  });
});

describe('buildMoodboardCaption', () => {
  it('references trait poles', () => {
    const cap = buildMoodboardCaption({
      type: { title: 'The Pathfinder' },
      traits: [
        { poleA: 'E', poleB: 'I', pct: 33, name: 'E/I' },
        { poleA: 'S', poleB: 'N', pct: 25, name: 'S/N' },
        { poleA: 'T', poleB: 'F', pct: 53, name: 'T/F' },
        { poleA: 'J', poleB: 'P', pct: 54, name: 'J/P' },
      ],
    });
    assert.match(cap, /Introversion|inward/i);
    assert.match(cap, /Intuition|pattern/i);
    assert.doesNotMatch(cap, /visual layer for your result/i);
  });
});
