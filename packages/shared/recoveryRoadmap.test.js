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
    assert.ok(severe.phases.length > healthy.phases.length);
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
    assert.ok(plan.phases.length >= 5);
    for (const phaseItem of plan.phases) {
      assert.ok((phaseItem.steps?.length ?? 0) >= 4, `${phaseItem.id} should have 4+ steps`);
      assert.ok(String(phaseItem.outcome || '').length > 20);
      for (const s of phaseItem.steps) {
        assert.ok(String(s.tip || '').length > 40, `${s.title} tip too short`);
        assert.ok(String(s.how || '').length > 20, `${s.title} missing how`);
        assert.ok(String(s.why || '').length > 20, `${s.title} missing why`);
        assert.ok(String(s.check || '').length > 8, `${s.title} missing done-when`);
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
});
