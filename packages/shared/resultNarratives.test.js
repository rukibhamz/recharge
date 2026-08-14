import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBurnoutNarrative,
  buildBurnoutReport,
  buildMoodboardCaption,
  buildMoodboardSections,
  isGenericBurnoutSummary,
  resolveBurnoutSummary,
  stripEmDashes,
  topLoadDimensions,
} from './resultNarratives.js';

const sampleBurnout = {
  pct: 68,
  cls: 'moderate',
  level: 'Moderate Burnout',
  dimensions: { exhaustion: 72, community: 61, autonomy: 20 },
};

const samplePersonality = {
  typeCode: 'INFJ',
  type: { name: 'Advocate', title: 'Advocate' },
  traits: [
    { name: 'E/I', poleA: 'E', poleB: 'I', pct: 43 },
    { name: 'S/N', poleA: 'S', poleB: 'N', pct: 27 },
    { name: 'T/F', poleA: 'T', poleB: 'F', pct: 50 },
    { name: 'J/P', poleA: 'J', poleB: 'P', pct: 58 },
  ],
};

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
        'Your check-in lands at 65% moderate burnout. What stands out is energy drain from long stretches without recovery, plus pressure around control over your work.',
      ),
      false,
    );
  });
});

describe('buildBurnoutReport', () => {
  it('uses headings, drivers, and advice without em dashes', () => {
    const report = buildBurnoutReport(sampleBurnout, samplePersonality);
    assert.match(report.heading, /68%/);
    assert.match(report.heading, /Moderate Burnout/);
    assert.match(report.meaning, /warning sign/i);
    assert.equal(report.drivers.length, 2);
    assert.match(report.drivers[0].title, /Energy drain/i);
    assert.match(report.profileBody, /Advocate/);
    assert.equal(report.adviceItems.length, 2);
    const flat = JSON.stringify(report);
    assert.doesNotMatch(flat, /\u2014/);
    assert.doesNotMatch(flat, /performance|targets/i);
  });

  it('flattens to a readable string', () => {
    const text = buildBurnoutNarrative(sampleBurnout, samplePersonality);
    assert.match(text, /68%/);
    assert.match(text, /energy drain|Energy drain/i);
    assert.doesNotMatch(text, /\u2014/);
  });

  it('resolve replaces generic summaries', () => {
    const text = resolveBurnoutSummary(
      {
        ...sampleBurnout,
        summary:
          'The data indicates a moderate level of performance, with 65% of the expected targets achieved.',
      },
      null,
    );
    assert.doesNotMatch(text, /expected targets/i);
    assert.match(text, /68%/);
  });
});

describe('topLoadDimensions', () => {
  it('sorts by load', () => {
    const tops = topLoadDimensions({ exhaustion: 80, community: 30, autonomy: 55 });
    assert.equal(tops[0].key, 'exhaustion');
  });
});

describe('buildMoodboardSections', () => {
  it('explains each pole in plain language', () => {
    const sections = buildMoodboardSections(samplePersonality, sampleBurnout);
    const blob = sections.map((s) => `${s.title} ${s.body}`).join(' ');
    assert.match(blob, /Introversion/i);
    assert.match(blob, /Intuition/i);
    assert.match(blob, /head and heart/i);
    assert.match(blob, /Judging/i);
    assert.doesNotMatch(blob, /\u2014/);
    assert.doesNotMatch(blob, /visual layer for your result/i);
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

describe('stripEmDashes', () => {
  it('replaces em dashes', () => {
    assert.equal(stripEmDashes('A \u2014 B'), 'A, B');
  });
});
