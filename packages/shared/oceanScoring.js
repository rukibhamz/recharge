/** Big Five (OCEAN) scoring — deterministic, code-owned percentages. */

export const OCEAN_TRAITS = [
  { key: 'O', name: 'Openness', label: 'Openness to experience' },
  { key: 'C', name: 'Conscientiousness', label: 'Conscientiousness' },
  { key: 'E', name: 'Extraversion', label: 'Extraversion' },
  { key: 'A', name: 'Agreeableness', label: 'Agreeableness' },
  { key: 'N', name: 'Neuroticism', label: 'Neuroticism' },
];

const TRAIT_KEYS = new Set(['O', 'C', 'E', 'A', 'N']);

export function traitLabel(key) {
  return OCEAN_TRAITS.find((t) => t.key === key)?.name ?? key;
}

function maxAnswerValue(questions) {
  let max = 4;
  for (const q of questions ?? []) {
    for (const o of q.options ?? []) {
      const v = Number(o.value);
      if (Number.isFinite(v) && v > max) max = v;
    }
  }
  return max;
}

function scoredTraitOf(q) {
  return String(q?.scoredTrait ?? q?.scored_trait ?? '')
    .toUpperCase()
    .slice(0, 1);
}

export function questionsSupportOceanScoring(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  return questions.every((q) => TRAIT_KEYS.has(scoredTraitOf(q)));
}

/**
 * Score OCEAN from agreement-scale answers (0–4).
 * Each item declares scoredTrait (O/C/E/A/N) and optional reverseScored.
 */
export function scoreOcean(answers, questions) {
  const maxPerQ = maxAnswerValue(questions);
  const buckets = Object.fromEntries([...TRAIT_KEYS].map((k) => [k, { sum: 0, max: 0 }]));

  questions.forEach((q, i) => {
    const trait = scoredTraitOf(q);
    if (!TRAIT_KEYS.has(trait)) return;
    const raw = Number(answers[i] ?? 0);
    const reverse = Boolean(q.reverseScored ?? q.reverse_scored);
    const score = reverse ? maxPerQ - raw : raw;
    buckets[trait].sum += score;
    buckets[trait].max += maxPerQ;
  });

  const scores = {};
  for (const key of TRAIT_KEYS) {
    const b = buckets[key];
    scores[key] = b.max > 0 ? Math.round((b.sum / b.max) * 100) : 50;
  }

  const traits = OCEAN_TRAITS.map(({ key, name, label }) => ({
    key,
    name,
    label,
    pct: scores[key],
  }));

  return { scores, traits };
}

/** Approximate OCEAN from legacy MBTI trait bars when no OCEAN items were used. */
export function deriveOceanFromMbti(mbtiTraits) {
  const pct = (poleA) => {
    const t = mbtiTraits?.find((tr) => tr.poleA === poleA);
    return Number.isFinite(t?.pct) ? t.pct : 50;
  };

  const e = pct('E');
  const s = pct('S');
  const t = pct('T');
  const j = pct('J');

  const scores = {
    E: e,
    O: Math.round(100 - s),
    C: j,
    A: Math.round(100 - t),
    N: Math.round(Math.max(0, Math.min(100, 35 + (100 - e) * 0.15 + (100 - t) * 0.12 + (100 - j) * 0.08))),
  };

  const traits = OCEAN_TRAITS.map(({ key, name, label }) => ({
    key,
    name,
    label,
    pct: scores[key],
  }));

  return { scores, traits, derived: true };
}

/** Resolve OCEAN scores from a personality result (measured or derived). */
export function resolveOcean(personality) {
  if (personality?.ocean?.scores) {
    return {
      scores: personality.ocean.scores,
      traits: personality.traits ?? formatOceanTraits(personality.ocean.scores),
      derived: Boolean(personality.ocean.derived),
    };
  }
  if (personality?.scores && personality.scores.O != null) {
    return {
      scores: personality.scores,
      traits: formatOceanTraits(personality.scores),
      derived: false,
    };
  }
  if (questionsSupportOceanScoring(personality?._questions)) {
    return { scores: {}, traits: [], derived: false };
  }
  return deriveOceanFromMbti(personality?.traits);
}

export function formatOceanTraits(scores) {
  return OCEAN_TRAITS.map(({ key, name, label }) => ({
    key,
    name,
    label,
    pct: scores[key] ?? 50,
  }));
}

export function dominantTraitLetters(scores, threshold = 55) {
  return OCEAN_TRAITS.filter(({ key }) => (scores[key] ?? 50) >= threshold)
    .map(({ key }) => key)
    .join('');
}

export function traitBand(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return 'moderate';
  if (n >= 65) return 'high';
  if (n <= 35) return 'low';
  return 'moderate';
}

export function traitBandLabel(pct, name) {
  const band = traitBand(pct);
  if (band === 'high') return `High ${name}`;
  if (band === 'low') return `Low ${name}`;
  return `Moderate ${name}`;
}

/** Short narrative for personality insight screen (before burnout is scored). */
export function summarizeOceanProfile(scores) {
  const rows = OCEAN_TRAITS.map(({ key, name }) => ({
    key,
    name,
    pct: scores[key] ?? 50,
    band: traitBand(scores[key] ?? 50),
  }));

  const high = rows.filter((r) => r.band === 'high').map((r) => r.name);
  const low = rows.filter((r) => r.band === 'low').map((r) => r.name);

  const parts = [];
  if (high.length) {
    parts.push(`Your strongest operating levers are ${high.join(', ').toLowerCase()}.`);
  }
  if (low.length) {
    parts.push(`You run lighter on ${low.join(', ').toLowerCase()}, which shapes how strain shows up for you.`);
  }
  if (!parts.length) {
    parts.push('Your trait profile sits in the moderate range across most dimensions, so context and load matter more than any single pole.');
  }
  return parts.join(' ');
}

export function oceanArchetypeLabel(scores) {
  const c = scores.C ?? 50;
  const a = scores.A ?? 50;
  const n = scores.N ?? 50;
  const e = scores.E ?? 50;
  if (c >= 58 && n >= 55) return 'Structured and threat-sensitive';
  if (a >= 58 && c >= 55) return 'Relational and duty-driven';
  if (e <= 42 && n >= 55) return 'Quiet and reactive under pressure';
  if (e >= 58 && a >= 55) return 'People-forward and responsive';
  if (c >= 58) return 'Closure-oriented operator';
  if (a >= 58) return 'Harmony-oriented operator';
  return 'Balanced operator';
}
