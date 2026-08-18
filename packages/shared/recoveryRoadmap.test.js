import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRecoveryRoadmap,
  teaseRecoveryRoadmap,
  roadmapToRecommendations,
  mergeRoadmapCopy,
  packRecommendationsPayload,
  unpackRecommendationsPayload,
  hydrateRecoveryRoadmap,
  isThinRecoveryRoadmap,
  isGroupedRecoveryRoadmap,
  ROADMAP_HORIZON,
} from './recoveryRoadmap.js';

const burnout = (cls, pct) => ({ cls, pct, level: ROADMAP_HORIZON[cls] ? `${cls} burnout` : 'Moderate Burnout' });

const protocolProfile = {
  actionable_protocol: [
    {
      trigger: 'When someone asks for help',
      personality_trap: 'High Agreeableness will make you say yes immediately.',
      protocol_rule: 'Enforce a mandatory 2-hour delay before accepting any request.',
    },
    {
      trigger: 'When a task is 80% done',
      personality_trap: 'High Conscientiousness treats 80% as failure.',
      protocol_rule: 'Stop at the written done-enough line.',
    },
  ],
  diagnostic_summary: { primary_archetype: 'The Boundary-Porous Harmonizer' },
};

describe('recoveryRoadmap', () => {
  it('scales horizon with burnout severity', () => {
    const healthy = buildRecoveryRoadmap({ burnout: burnout('healthy', 12) });
    const severe = buildRecoveryRoadmap({ burnout: burnout('severe', 82) });
    assert.equal(healthy.horizonDays, 3);
    assert.equal(severe.horizonDays, 21);
    assert.equal(healthy.phases.length, 3);
    assert.equal(severe.phases.length, 21);
    assert.ok(severe.phases.length > healthy.phases.length);
  });

  it('uses one checklist phase per calendar day', () => {
    const plan = buildRecoveryRoadmap({ burnout: burnout('moderate', 55) });
    assert.equal(plan.phases.length, 14);
    for (const phaseItem of plan.phases) {
      assert.equal(phaseItem.dayStart, phaseItem.dayEnd);
      assert.match(phaseItem.label, /^Day \d+$/);
    }
  });

  it('embeds psychometric protocols in later phases', () => {
    const plan = buildRecoveryRoadmap({
      burnout: burnout('moderate', 55),
      psychometricProfile: protocolProfile,
    });
    const text = JSON.stringify(plan);
    assert.match(text, /2-hour delay/);
    assert.match(text, /done-enough/);
  });

  it('teases guests to day 1 only', () => {
    const full = buildRecoveryRoadmap({
      burnout: burnout('moderate', 55),
      psychometricProfile: protocolProfile,
    });
    const teaser = teaseRecoveryRoadmap(full);
    assert.equal(teaser.guestPreview, true);
    assert.ok(teaser.lockedPhaseCount >= 1);
    assert.ok(teaser.phases[0].steps.length >= 1);
    assert.equal(teaser.phases[1].locked, true);
    assert.equal(teaser.phases[1].steps.length, 0);
    assert.equal(full.phases[1].steps.length > 0, true);
  });

  it('packs and unpacks for session storage', () => {
    const full = buildRecoveryRoadmap({ burnout: burnout('mild', 30) });
    const packed = packRecommendationsPayload(roadmapToRecommendations(full), full);
    const unpacked = unpackRecommendationsPayload(packed);
    assert.equal(unpacked.recommendations.length, 4);
    assert.equal(unpacked.recoveryRoadmap.horizonDays, 7);
  });

  it('merges LLM copy onto the skeleton without dropping phases', () => {
    const skeleton = buildRecoveryRoadmap({ burnout: burnout('mild', 30) });
    const merged = mergeRoadmapCopy(skeleton, {
      cls: 'mild',
      horizonDays: 7,
      phases: [
        {
          id: skeleton.phases[0].id,
          title: 'Cut the extra meeting',
          focus: skeleton.phases[0].focus,
          steps: [{ title: 'Cancel the 4pm', tip: 'Send the decline before lunch.' }],
        },
      ],
    });
    assert.equal(merged.phases.length, skeleton.phases.length);
    assert.equal(merged.phases[0].steps[0].title, 'Cancel the 4pm');
    assert.equal(merged.phases[1].id, skeleton.phases[1].id);
  });

  it('builds a detailed protocol, not two-line tip cards', () => {
    const plan = buildRecoveryRoadmap({
      burnout: burnout('moderate', 55),
      psychometricProfile: protocolProfile,
    });
    assert.equal(plan.phases.length, 14);
    for (const phaseItem of plan.phases) {
      assert.ok((phaseItem.steps?.length ?? 0) >= 1, `${phaseItem.label} should have steps`);
      for (const s of phaseItem.steps) {
        assert.ok(String(s.tip || '').length > 20, `${phaseItem.label} ${s.title} tip too short`);
        assert.ok(String(s.how || '').length > 10, `${phaseItem.label} ${s.title} missing how`);
        assert.ok(String(s.check || '').length > 5, `${phaseItem.label} ${s.title} missing done-when`);
      }
    }
    const text = JSON.stringify(plan);
    assert.match(text, /Say no|I cannot take|I will confirm|I am depleted/i);
  });

  it('treats short card plans as thin and hydrates them', () => {
    const thin = {
      cls: 'moderate',
      horizonDays: 14,
      phases: [
        {
          id: 'stabilize',
          title: 'Stabilize',
          steps: [{ title: 'Rest', tip: 'Block 30 minutes.' }],
        },
      ],
    };
    assert.equal(isThinRecoveryRoadmap(thin), true);
    const hydrated = hydrateRecoveryRoadmap(thin, {
      burnout: burnout('moderate', 55),
      psychometricProfile: protocolProfile,
    });
    assert.equal(isThinRecoveryRoadmap(hydrated), false);
    assert.ok(hydrated.phases[0].steps.length >= 4);
    assert.ok(hydrated.phases[0].steps[0].how);
  });

  it('rebuilds grouped legacy roadmaps into daily checklists', () => {
    const grouped = {
      cls: 'mild',
      horizonDays: 7,
      phases: [
        {
          id: 'cut',
          dayStart: 1,
          dayEnd: 1,
          label: 'Day 1',
          title: 'Cut',
          focus: 'Cut one thing',
          steps: [{ title: 'Cut', tip: 'Move one thing.', how: 'Send it.', check: 'Sent.' }],
        },
        {
          id: 'hygiene',
          dayStart: 2,
          dayEnd: 3,
          label: 'Days 2–3',
          title: 'Quiet inputs',
          focus: 'Edges',
          steps: [{ title: 'Windows', tip: 'Two windows only today and tomorrow.', how: '1) Mute. 2) Check twice.', check: 'Two windows today.' }],
        },
      ],
    };
    assert.equal(isGroupedRecoveryRoadmap(grouped), true);
    const hydrated = hydrateRecoveryRoadmap(grouped, { burnout: burnout('mild', 30) });
    assert.equal(hydrated.phases.length, 7);
    assert.equal(hydrated.phases[1].dayStart, 2);
    assert.equal(hydrated.phases[2].dayStart, 3);
  });
});
