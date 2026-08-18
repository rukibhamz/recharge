/**
 * Cross-correlates OCEAN personality with burnout dimensions.
 * Deterministic engine — LLM may polish copy but cannot change structure.
 */

import { topLoadDimensions } from './resultNarratives.js';
import { traitBand, traitBandLabel, traitLabel } from './oceanScoring.js';

const BURNOUT_STAGE = {
  healthy: 'Early signal range',
  mild: 'Stage 1: Rising load',
  moderate: 'Stage 2: Sustained strain',
  severe: 'Stage 3: Chronic overload',
};

const DIM_LABELS = {
  exhaustion: 'energy drain',
  emotional_exhaustion: 'energy drain',
  cynicism: 'emotional distance',
  depersonalisation: 'emotional distance',
  efficacy: 'sense of accomplishment',
  personal_accomplishment: 'sense of accomplishment',
  autonomy: 'control over your work',
  recognition: 'feeling valued',
  community: 'support and belonging',
};

function loadPct(dimensions, key) {
  const v = Number(dimensions?.[key]);
  if (!Number.isFinite(v)) return 0;
  if (key === 'efficacy' || key === 'personal_accomplishment') return Math.max(0, 100 - v);
  return v;
}

function dimLabel(key) {
  return DIM_LABELS[key] ?? key.replace(/_/g, ' ');
}

function pct(scores, key) {
  return Number(scores?.[key] ?? 50);
}

/** Pick primary operating pattern from trait + burnout combination. */
function pickArchetype(scores, topDims, cls) {
  const c = pct(scores, 'C');
  const a = pct(scores, 'A');
  const n = pct(scores, 'N');
  const e = pct(scores, 'E');
  const o = pct(scores, 'O');
  const lead = topDims[0]?.key ?? 'exhaustion';
  const leadScore = topDims[0]?.score ?? 0;

  if (c >= 58 && n >= 55 && (lead === 'exhaustion' || lead === 'efficacy')) {
    return { name: 'The Over-Functioning Perfectionist', icon: '⚙️' };
  }
  if (a >= 58 && (lead === 'exhaustion' || lead === 'community')) {
    return { name: 'The Boundary-Porous Harmonizer', icon: '🤝' };
  }
  if (e <= 42 && lead === 'community') {
    return { name: 'The Quiet Carrier', icon: '🫧' };
  }
  if (e <= 42 && lead === 'exhaustion') {
    return { name: 'The Depleted Introvert', icon: '🌙' };
  }
  if (o >= 58 && (lead === 'efficacy' || lead === 'cynicism')) {
    return { name: 'The Meaning-Seeker Running on Empty', icon: '🔭' };
  }
  if (n >= 58 && lead === 'exhaustion') {
    return { name: 'The Threat-Sensitive Operator', icon: '⚡' };
  }
  if (c >= 58 && lead === 'autonomy') {
    return { name: 'The Control-Seeking Closer', icon: '📋' };
  }
  if (lead === 'cynicism' && leadScore >= 45) {
    return { name: 'The Disconnected Performer', icon: '🎭' };
  }
  if (lead === 'recognition') {
    return { name: 'The Unseen Contributor', icon: '💫' };
  }
  if (cls === 'healthy') {
    return { name: 'The Steady Operator', icon: '🌿' };
  }
  return { name: 'The Strained Adapter', icon: '🔄' };
}

/** Trait × dimension correlation rules. */
const CORRELATIONS = [
  {
    trait: 'A',
    dimension: 'exhaustion',
    minTrait: 55,
    minLoad: 40,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Agreeableness')} makes it harder to refuse extra load, which keeps ${dimLabel('exhaustion')} at ${d}%.`,
    trigger: 'When someone asks for help outside your plan',
    trap: (t) => `${traitBandLabel(t, 'Agreeableness')} will make you say yes before checking capacity.`,
    rule: 'Use a 2-hour delay rule: reply with "I will confirm after I check my plate" before accepting any new request.',
  },
  {
    trait: 'C',
    dimension: 'exhaustion',
    minTrait: 55,
    minLoad: 40,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Conscientiousness')} keeps you finishing past the point of return, which feeds ${dimLabel('exhaustion')} at ${d}%.`,
    trigger: 'When a task is mostly done but not perfect',
    trap: (t) => `${traitBandLabel(t, 'Conscientiousness')} treats "good enough" as failure and extends the loop.`,
    rule: 'Define a written "done enough" line before you start. Stop when you hit it, even if polish remains.',
  },
  {
    trait: 'C',
    dimension: 'efficacy',
    minTrait: 55,
    minLoad: 35,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Conscientiousness')} raises the bar for what counts as progress, so ${dimLabel('efficacy')} strain sits at ${d}%.`,
    trigger: 'When you finish a block of work and still feel behind',
    trap: (t) => `${traitBandLabel(t, 'Conscientiousness')} moves the finish line as you approach it.`,
    rule: 'Log three completed items before opening a new one. No new tasks until the log has three lines.',
  },
  {
    trait: 'N',
    dimension: 'exhaustion',
    minTrait: 55,
    minLoad: 38,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Neuroticism')} keeps threat signals active after work ends, sustaining ${dimLabel('exhaustion')} at ${d}%.`,
    trigger: 'When your mind replays tomorrow before you have closed today',
    trap: (t) => `${traitBandLabel(t, 'Neuroticism')} treats previewing problems as preparation.`,
    rule: 'Write tomorrow\'s top concern on one line, then close the notebook. No mental rehearsal until morning.',
  },
  {
    trait: 'E',
    dimension: 'community',
    minTrait: 55,
    minLoad: 35,
    effect: 'buffer',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Extraversion')} gives you a real recovery channel through people, which can buffer ${dimLabel('community')} strain at ${d}%.`,
    trigger: 'When isolation stretches past two days',
    trap: () => 'Low social contact will read as rest but may deepen the belonging gap.',
    rule: 'Schedule one 20-minute connection block this week. One person, one topic, no multitasking.',
    invertForLow: true,
    lowTraitMax: 42,
  },
  {
    trait: 'E',
    dimension: 'exhaustion',
    minTrait: 42,
    minLoad: 40,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `Low ${traitLabel('E')} means people-heavy days cost more than they give back, pushing ${dimLabel('exhaustion')} to ${d}%.`,
    trigger: 'After a day of back-to-back meetings or social obligations',
    trap: (t) => `${traitBandLabel(t, 'Extraversion')} recovery advice (more people) will drain you further.`,
    rule: 'Book 45 minutes of solo decompression before any evening social plan. Treat it as non-negotiable transit time.',
    invertForLow: true,
    lowTraitMax: 42,
  },
  {
    trait: 'A',
    dimension: 'cynicism',
    minTrait: 55,
    minLoad: 35,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Agreeableness')} makes emotional distance feel like betrayal, which shows up as ${dimLabel('cynicism')} at ${d}%.`,
    trigger: 'When you notice yourself going numb toward people you usually care about',
    trap: (t) => `${traitBandLabel(t, 'Agreeableness')} will push you to perform warmth while feeling nothing.`,
    rule: 'Name one relationship that feels flat. Send one honest check-in message instead of performing normal.',
  },
  {
    trait: 'O',
    dimension: 'efficacy',
    minTrait: 55,
    minLoad: 35,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Openness')} keeps scanning better paths, so ${dimLabel('efficacy')} strain sits at ${d}% even when output is real.`,
    trigger: 'When you rethink the approach instead of shipping',
    trap: (t) => `${traitBandLabel(t, 'Openness')} treats revision as progress.`,
    rule: 'Set a revision cap: one pass, 25 minutes, then ship or park. Parked items need a date, not an open loop.',
  },
  {
    trait: 'C',
    dimension: 'autonomy',
    minTrait: 55,
    minLoad: 32,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Conscientiousness')} makes unclear ownership feel like personal failure, driving ${dimLabel('autonomy')} strain at ${d}%.`,
    trigger: 'When priorities shift without you in the conversation',
    trap: (t) => `${traitBandLabel(t, 'Conscientiousness')} will absorb ambiguity instead of naming it.`,
    rule: 'Send one ownership message: "I can own A or B by Friday, not both. Which is the priority?"',
  },
  {
    trait: 'N',
    dimension: 'cynicism',
    minTrait: 55,
    minLoad: 32,
    effect: 'accelerator',
    mechanism: (t, d) =>
      `${traitBandLabel(t, 'Neuroticism')} interprets friction as permanent, which feeds ${dimLabel('cynicism')} at ${d}%.`,
    trigger: 'When a setback makes the whole situation feel pointless',
    trap: (t) => `${traitBandLabel(t, 'Neuroticism')} converts one bad signal into a global story.`,
    rule: 'Write the setback as one sentence of fact. Add one sentence of what is still in your control today.',
  },
];

function matchesRule(rule, scores, dimensions) {
  const t = pct(scores, rule.trait);
  const d = loadPct(dimensions, rule.dimension);
  if (d < rule.minLoad) return false;

  if (rule.invertForLow) {
    return t <= (rule.lowTraitMax ?? 42);
  }
  return t >= (rule.minTrait ?? 55);
}

function buildCoreConflict(scores, dimensions, archetype) {
  const accelerators = CORRELATIONS.filter(
    (r) => r.effect === 'accelerator' && matchesRule(r, scores, dimensions),
  )
    .map((r) => ({
      rule: r,
      load: loadPct(dimensions, r.dimension),
      trait: pct(scores, r.trait),
    }))
    .sort((a, b) => b.load - a.load);

  if (accelerators.length >= 2) {
    const a = accelerators[0];
    const b = accelerators[1];
    return `${a.rule.mechanism(a.trait, a.load)} At the same time, ${b.rule.mechanism(b.trait, b.load).replace(/\.$/, '')}.`;
  }
  if (accelerators.length === 1) {
    const a = accelerators[0];
    return a.rule.mechanism(a.trait, a.load);
  }

  const lead = topDims[0];
  if (lead) {
    return `Your ${archetype.name.replace(/^The /, '').toLowerCase()} pattern shows ${dimLabel(lead.key)} as the lead strain signal at ${lead.score}%, with personality shaping how that load lands day to day.`;
  }
  return `Your operating style and current load are out of sync in ways worth addressing before they compound.`;
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/^the\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * @param {{ scores: Record<string, number>, traits?: object[] }} ocean
 * @param {{ pct: number, cls: string, level?: string, dimensions?: Record<string, number> }} burnout
 */
export function buildPsychometricProfile(ocean, burnout) {
  const scores = ocean?.scores ?? {};
  const dimensions = burnout?.dimensions ?? {};
  const cls = burnout?.cls ?? 'moderate';
  const topDims = topLoadDimensions(dimensions, 2);
  const archetype = pickArchetype(scores, topDims, cls);

  const dimensionsForMatch = dimensions;
  const hits = CORRELATIONS.filter((r) => matchesRule(r, scores, dimensionsForMatch));

  const accelerators = hits
    .filter((r) => r.effect === 'accelerator')
    .map((r) => ({
      trait: r.trait,
      pct: pct(scores, r.trait),
      dimension: r.dimension,
      load: loadPct(dimensionsForMatch, r.dimension),
      effect: 'accelerator',
      mechanism: r.mechanism(pct(scores, r.trait), loadPct(dimensionsForMatch, r.dimension)),
    }))
    .sort((a, b) => b.load - a.load)
    .slice(0, 3);

  const buffers = hits
    .filter((r) => r.effect === 'buffer')
    .map((r) => ({
      trait: r.trait,
      pct: pct(scores, r.trait),
      dimension: r.dimension,
      load: loadPct(dimensionsForMatch, r.dimension),
      effect: 'buffer',
      mechanism: r.mechanism(pct(scores, r.trait), loadPct(dimensionsForMatch, r.dimension)),
    }))
    .slice(0, 2);

  const protocolRules = hits
    .filter((r) => r.effect === 'accelerator')
    .sort((a, b) => loadPct(dimensionsForMatch, b.dimension) - loadPct(dimensionsForMatch, a.dimension))
    .slice(0, 4)
    .map((r) => ({
      trigger: r.trigger,
      personality_trap: r.trap(pct(scores, r.trait)),
      protocol_rule: r.rule,
    }));

  if (protocolRules.length < 2) {
    const fallback = CORRELATIONS.filter((r) => r.effect === 'accelerator').slice(0, 2);
    for (const r of fallback) {
      if (protocolRules.length >= 4) break;
      if (protocolRules.some((p) => p.trigger === r.trigger)) continue;
      protocolRules.push({
        trigger: r.trigger,
        personality_trap: r.trap(pct(scores, r.trait)),
        protocol_rule: r.rule,
      });
    }
  }

  const coreConflict = buildCoreConflict(scores, dimensionsForMatch, archetype);
  const leadDim = topDims[0];

  return {
    diagnostic_summary: {
      primary_archetype: archetype.name,
      archetype_icon: archetype.icon,
      burnout_stage: BURNOUT_STAGE[cls] ?? BURNOUT_STAGE.moderate,
      burnout_level: burnout?.level ?? '',
      lead_dimension: leadDim ? dimLabel(leadDim.key) : null,
      lead_dimension_score: leadDim?.score ?? null,
      core_conflict: coreConflict,
      accelerators,
      buffers,
    },
    actionable_protocol: protocolRules,
    pattern_code: slugify(archetype.name),
  };
}

export function attachPsychometricProfile(personality, burnout) {
  const scores = personality?.ocean?.scores ?? personality?.scores;
  if (!scores) return null;
  return buildPsychometricProfile({ scores }, burnout);
}
