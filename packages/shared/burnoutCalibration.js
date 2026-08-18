import { maxAnswerValue, scoreBurnout } from './scoring.js';
import { deriveOceanFromMbti } from './oceanScoring.js';

const LEVEL_MAP = {
  healthy: 'Healthy Range',
  mild: 'Mild Burnout',
  moderate: 'Moderate Burnout',
  severe: 'Severe Burnout',
};

const GLOBAL_CAP = 15;
const DIMENSION_CAP = 8;

export function clsFromBurnoutPct(pct) {
  if (pct >= 70) return 'severe';
  if (pct >= 45) return 'moderate';
  if (pct >= 25) return 'mild';
  return 'healthy';
}

export function levelFromCls(cls) {
  return LEVEL_MAP[cls] ?? LEVEL_MAP.moderate;
}

/** Per-dimension raw percentages plus overall raw score. */
export function scoreBurnoutByDimension(answers, questions) {
  const maxPerQ = maxAnswerValue(questions);
  const buckets = {};

  answers.forEach((val, i) => {
    const q = questions?.[i];
    const dim = q?.dimension ?? 'overall';
    if (!buckets[dim]) buckets[dim] = { sum: 0, max: 0 };
    const reverse = Boolean(q?.reverseScored);
    const score = reverse ? maxPerQ - val : val;
    buckets[dim].sum += score;
    buckets[dim].max += maxPerQ;
  });

  const dimensions = {};
  for (const [dim, b] of Object.entries(buckets)) {
    dimensions[dim] = b.max > 0 ? Math.round((b.sum / b.max) * 100) : 0;
  }

  const base = scoreBurnout(answers, questions);
  return {
    rawPct: base.pct,
    rawCls: base.cls,
    rawLevel: base.level,
    dimensions,
  };
}

function resolveOceanScores(personality) {
  if (personality?.ocean?.scores) return personality.ocean.scores;
  if (personality?.traits?.some((t) => t.key && ['O', 'C', 'E', 'A', 'N'].includes(t.key))) {
    const scores = {};
    for (const t of personality.traits) {
      if (t.key) scores[t.key] = t.pct ?? 50;
    }
    return scores;
  }
  return deriveOceanFromMbti(personality?.traits ?? []).scores;
}

function traitPct(traits, poleA) {
  const t = traits?.find((tr) => tr.poleA === poleA);
  return t?.pct ?? 50;
}

function oceanPct(scores, key) {
  return Number(scores?.[key] ?? 50);
}

function clampAdjustment(n) {
  return Math.max(-DIMENSION_CAP, Math.min(DIMENSION_CAP, n));
}

/**
 * Adjust raw burnout score using OCEAN trait heuristics (falls back from MBTI-derived OCEAN).
 * Same answers + different personality → different calibrated severity.
 */
export function calibrateBurnout(rawResult, personality) {
  const ocean = resolveOceanScores(personality);
  const legacyTraits = personality?.traits ?? [];
  const dims = rawResult.dimensions ?? {};
  const adjustments = [];
  let total = 0;

  const e = oceanPct(ocean, 'E');
  const a = oceanPct(ocean, 'A');
  const c = oceanPct(ocean, 'C');
  const n = oceanPct(ocean, 'N');
  const o = oceanPct(ocean, 'O');

  // Legacy MBTI poles when ocean was derived from dichotomies
  const ei = traitPct(legacyTraits, 'E');
  const sn = traitPct(legacyTraits, 'S');
  const tf = traitPct(legacyTraits, 'T');
  const jp = traitPct(legacyTraits, 'J');
  const extrovert = Number.isFinite(e) ? e : ei;
  const agreeable = Number.isFinite(a) ? a : 100 - tf;
  const conscientious = Number.isFinite(c) ? c : jp;
  const neurotic = Number.isFinite(n) ? n : 50;

  if (dims.community != null) {
    let delta = 0;
    if (extrovert <= 45) delta -= clampAdjustment(Math.round((dims.community - 30) * 0.12));
    else if (extrovert >= 55) delta += clampAdjustment(Math.round((dims.community - 25) * 0.1));
    if (delta) {
      adjustments.push({ trait: extrovert <= 45 ? 'I' : 'E', dimension: 'community', delta });
      total += delta;
    }
  }

  if (dims.exhaustion != null) {
    let delta = 0;
    if (extrovert <= 45 && dims.exhaustion > 35) delta += 3;
    if (agreeable >= 55 && dims.exhaustion > 38) delta += 4;
    if (neurotic >= 55 && dims.exhaustion > 35) delta += 3;
    if (conscientious >= 58 && dims.exhaustion > 40) delta += 2;
    if (delta) {
      adjustments.push({ trait: 'exhaustion-signal', dimension: 'exhaustion', delta });
      total += delta;
    }
  }

  if (dims.cynicism != null && neurotic >= 55 && dims.cynicism > 30) {
    const delta = clampAdjustment(Math.round((dims.cynicism - 28) * 0.15));
    if (delta) {
      adjustments.push({ trait: 'N', dimension: 'cynicism', delta });
      total += delta;
    }
  }

  if (dims.autonomy != null && conscientious >= 55 && dims.autonomy > 28) {
    const delta = clampAdjustment(Math.round((dims.autonomy - 25) * 0.18));
    if (delta) {
      adjustments.push({ trait: 'C', dimension: 'autonomy', delta });
      total += delta;
    }
  } else if (dims.autonomy != null && conscientious <= 45) {
    const delta = -2;
    adjustments.push({ trait: 'O', dimension: 'autonomy', delta });
    total += delta;
  }

  if (dims.efficacy != null && o >= 55 && dims.efficacy > 38) {
    const delta = 2;
    adjustments.push({ trait: 'O', dimension: 'efficacy', delta });
    total += delta;
  }

  if (dims.recognition != null && agreeable >= 55 && dims.recognition > 35) {
    const delta = 3;
    adjustments.push({ trait: 'A', dimension: 'recognition', delta });
    total += delta;
  }

  // Keep legacy S/N heuristic when only MBTI traits exist
  if (dims.efficacy != null && sn >= 55 && dims.efficacy > 38 && o < 55) {
    const delta = 2;
    adjustments.push({ trait: 'S', dimension: 'efficacy', delta });
    total += delta;
  }

  total = Math.max(-GLOBAL_CAP, Math.min(GLOBAL_CAP, total));

  let pct = Math.min(100, Math.max(0, rawResult.rawPct + total));
  // Safety floor: very high raw scores stay at least severe
  if (rawResult.rawPct >= 75) pct = Math.max(pct, 70);

  const cls = clsFromBurnoutPct(pct);
  const calibrationNote =
    adjustments.length > 0
      ? `Adjusted ${total > 0 ? '+' : ''}${total} pts for your personality profile (raw ${rawResult.rawPct}%).`
      : null;

  return {
    pct,
    rawPct: rawResult.rawPct,
    cls,
    level: levelFromCls(cls),
    adjustments,
    dimensions: dims,
    calibrationNote,
  };
}
