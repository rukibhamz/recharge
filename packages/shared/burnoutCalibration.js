import { maxAnswerValue, scoreBurnout } from './scoring.js';

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

function traitPct(traits, poleA) {
  const t = traits?.find((tr) => tr.poleA === poleA);
  return t?.pct ?? 50;
}

function clampAdjustment(n) {
  return Math.max(-DIMENSION_CAP, Math.min(DIMENSION_CAP, n));
}

/**
 * Adjust raw burnout score using MBTI trait heuristics.
 * Same answers + different personality → different calibrated severity.
 */
export function calibrateBurnout(rawResult, personality) {
  const traits = personality?.traits ?? [];
  const dims = rawResult.dimensions ?? {};
  const adjustments = [];
  let total = 0;

  const ei = traitPct(traits, 'E');
  const sn = traitPct(traits, 'S');
  const tf = traitPct(traits, 'T');
  const jp = traitPct(traits, 'J');

  if (dims.community != null) {
    let delta = 0;
    if (ei <= 45) delta -= clampAdjustment(Math.round((dims.community - 30) * 0.12));
    else if (ei >= 55) delta += clampAdjustment(Math.round((dims.community - 25) * 0.1));
    if (delta) {
      adjustments.push({ trait: ei <= 45 ? 'I' : 'E', dimension: 'community', delta });
      total += delta;
    }
  }

  if (dims.exhaustion != null) {
    let delta = 0;
    if (ei <= 45 && dims.exhaustion > 35) delta += 3;
    if (tf <= 45 && dims.exhaustion > 40) delta += 4;
    if (delta) {
      adjustments.push({ trait: 'exhaustion-signal', dimension: 'exhaustion', delta });
      total += delta;
    }
  }

  if (dims.cynicism != null && tf >= 55 && dims.cynicism > 30) {
    const delta = clampAdjustment(Math.round((dims.cynicism - 28) * 0.15));
    if (delta) {
      adjustments.push({ trait: 'T', dimension: 'cynicism', delta });
      total += delta;
    }
  }

  if (dims.autonomy != null && jp >= 55 && dims.autonomy > 28) {
    const delta = clampAdjustment(Math.round((dims.autonomy - 25) * 0.18));
    if (delta) {
      adjustments.push({ trait: 'J', dimension: 'autonomy', delta });
      total += delta;
    }
  } else if (dims.autonomy != null && jp <= 45) {
    const delta = -2;
    adjustments.push({ trait: 'P', dimension: 'autonomy', delta });
    total += delta;
  }

  if (dims.efficacy != null && sn >= 55 && dims.efficacy > 38) {
    const delta = 2;
    adjustments.push({ trait: 'S', dimension: 'efficacy', delta });
    total += delta;
  }

  if (dims.recognition != null && tf <= 45 && dims.recognition > 35) {
    const delta = 3;
    adjustments.push({ trait: 'F', dimension: 'recognition', delta });
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
