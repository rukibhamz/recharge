/**
 * Meaningful burnout + moodboard copy from score dimensions and personality.
 * Used when LLM summary is missing or too generic (KPI/performance tone).
 */

const DIMENSION_LABELS = {
  exhaustion: 'energy drain',
  emotional_exhaustion: 'energy drain',
  cynicism: 'emotional distance',
  depersonalisation: 'emotional distance',
  efficacy: 'sense of accomplishment',
  personal_accomplishment: 'sense of accomplishment',
  autonomy: 'control over your work',
  recognition: 'feeling valued',
  community: 'support and belonging',
  overall: 'overall load',
};

/** Phrases that signal non-personal, KPI-style summaries (reject / replace). */
const GENERIC_SUMMARY_PATTERNS = [
  /\bexpected targets?\b/i,
  /\bperformance\b/i,
  /\boptimal outcomes?\b/i,
  /\bkey performance\b/i,
  /\bdata indicates\b/i,
  /\bnotable progress\b/i,
  /\bstrategies for enhancement\b/i,
  /\blevel of performance\b/i,
  /\bachieved\b.*\b%/i,
  /\bKPI\b/i,
  /\broi\b/i,
  /\bstakeholders?\b/i,
  /\bleverage\b/i,
  /\bsynerg/i,
  /\bvisual layer for your result\b/i,
];

export function isGenericBurnoutSummary(text) {
  const s = String(text ?? '').trim();
  if (s.length < 40) return true;
  return GENERIC_SUMMARY_PATTERNS.some((re) => re.test(s));
}

function dimScore(dimensions, keys) {
  if (!dimensions || typeof dimensions !== 'object') return null;
  for (const key of keys) {
    if (dimensions[key] != null && Number.isFinite(Number(dimensions[key]))) {
      return { key, score: Number(dimensions[key]) };
    }
  }
  return null;
}

/** Highest-load dimensions first (excludes personal_accomplishment raw). */
export function topLoadDimensions(dimensions, limit = 2) {
  if (!dimensions || typeof dimensions !== 'object') return [];
  const rows = Object.entries(dimensions)
    .map(([key, score]) => ({ key, score: Number(score) }))
    .filter((r) => Number.isFinite(r.score) && r.key !== 'overall')
    .map((r) => {
      // Higher personal accomplishment is usually protective — treat low efficacy as load
      if (r.key === 'personal_accomplishment' || r.key === 'efficacy') {
        return { key: r.key, score: 100 - r.score, inverted: true, raw: r.score };
      }
      return { key: r.key, score: r.score, inverted: false, raw: r.score };
    })
    .filter((r) => r.score >= 28)
    .sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

function labelDim(key) {
  return DIMENSION_LABELS[key] || key.replace(/_/g, ' ');
}

function levelOpening(cls, pct, level) {
  const n = Math.round(Number(pct) || 0);
  const label = level || 'this range';
  if (cls === 'healthy') {
    return `Your check-in lands at ${n}% — ${label}. You are not deep in burnout right now; the body of your answers still points to enough reserve to recover and protect what works.`;
  }
  if (cls === 'mild') {
    return `Your check-in lands at ${n}% — ${label}. That usually means load is rising: you can still function, but more of your answers show strain than comfort.`;
  }
  if (cls === 'severe') {
    return `Your check-in lands at ${n}% — ${label}. Across the questions, many of your answers sit at the high end of depletion, so this is a strong signal to prioritise rest and support — not push harder.`;
  }
  return `Your check-in lands at ${n}% — ${label}. Enough of your answers cluster in the mid-to-high strain range that sustained stress is showing up in how you feel day to day.`;
}

function dimensionSentence(tops) {
  if (!tops.length) {
    return 'The score reflects the pattern across the whole set of questions — intensity of drain, not a performance target.';
  }
  if (tops.length === 1) {
    const t = tops[0];
    if (t.inverted) {
      return `What stands out most is pressure around ${labelDim(t.key)}: your answers there suggest less sense of progress than you need.`;
    }
    return `What stands out most in your answers is elevated ${labelDim(t.key)} (around ${Math.round(t.raw)}% on that area).`;
  }
  const a = tops[0];
  const b = tops[1];
  return `Your answers load most heavily on ${labelDim(a.key)} and ${labelDim(b.key)} — the two areas that pull this score up the most.`;
}

function personalitySentence(personality) {
  const traits = personality?.traits ?? [];
  const typeName = personality?.type?.title || personality?.type?.name || personality?.typeCode;
  const ei = traits.find((t) => t.poleA === 'E');
  const tf = traits.find((t) => t.poleA === 'T');
  const jp = traits.find((t) => t.poleA === 'J');

  const bits = [];
  if (ei) {
    if (ei.pct <= 45) {
      bits.push('you tend to restore more through quieter space and fewer demands than constant social stimulation');
    } else if (ei.pct >= 55) {
      bits.push('you usually top up energy through people and outward motion — isolation as "rest" can backfire for you');
    }
  }
  if (tf?.pct <= 45) {
    bits.push('values and emotional climate hit hard when load is high');
  } else if (tf?.pct >= 55) {
    bits.push('clear boundaries and problems you can solve matter more than vague encouragement');
  }
  if (jp?.pct >= 55) {
    bits.push('unfinished loops and vague plans tend to cost you extra');
  } else if (jp?.pct <= 45) {
    bits.push('rigid schedules can feel like pressure, so recovery needs room to breathe');
  }

  if (!bits.length && typeName) {
    return `Read with your ${typeName} pattern in mind: recovery should fit how you actually work and restore, not a one-size wellness list.`;
  }
  if (!bits.length) return '';
  return `Given your profile${typeName ? ` (${typeName})` : ''}, ${bits.slice(0, 2).join(', and ')}.`;
}

function closingByLevel(cls) {
  if (cls === 'healthy') {
    return 'Protect the practices that already work — sleep, boundaries, and honest downtime — so this level of risk stays low.';
  }
  if (cls === 'mild') {
    return 'Small steps this week (shorter days, clearer no, real rest) matter more than overhauling everything.';
  }
  if (cls === 'severe') {
    return 'Treat recovery as urgent: reduce non-essential load, ask for help where you can, and do not wait for a collapse to act.';
  }
  return 'Use the recovery steps as a practical plan for this week — shrink load where you can, and build rest back in on purpose.';
}

/**
 * Build a plain-language burnout explanation from scored results.
 * @param {{ pct, cls, level, dimensions?, calibrationNote?, rawPct? }} burnout
 * @param {object} [personality]
 */
export function buildBurnoutNarrative(burnout, personality = null) {
  const pct = burnout?.pct ?? 0;
  const cls = String(burnout?.cls || 'moderate').toLowerCase();
  const level = burnout?.level;
  const tops = topLoadDimensions(burnout?.dimensions, 2);

  const parts = [
    levelOpening(cls, pct, level),
    dimensionSentence(tops),
    personalitySentence(personality),
    closingByLevel(cls),
  ].filter(Boolean);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Prefer a meaningful summary: reject empty / KPI-style LLM text.
 */
export function resolveBurnoutSummary(burnout, personality = null) {
  const existing = String(burnout?.summary ?? '').trim();
  if (existing && !isGenericBurnoutSummary(existing)) {
    return existing;
  }
  return buildBurnoutNarrative(burnout, personality);
}

function traitPole(traits, poleA) {
  return traits?.find((t) => t.poleA === poleA);
}

/**
 * Moodboard caption grounded in the four trait poles (+ optional burnout).
 */
export function buildMoodboardCaption(personality, burnout = null) {
  const traits = personality?.traits ?? [];
  const typeName = personality?.type?.title || personality?.type?.name || '';
  const ei = traitPole(traits, 'E');
  const sn = traitPole(traits, 'S');
  const tf = traitPole(traits, 'T');
  const jp = traitPole(traits, 'J');

  const energy =
    ei == null
      ? 'how you top up energy'
      : ei.pct >= 55
        ? `outward energy (${ei.pct}% Extraversion) — people and activity usually refill you`
        : ei.pct <= 45
          ? `inward energy (${100 - ei.pct}% Introversion) — quiet and fewer demands refill you`
          : 'a balance of social and solo recharge';

  const style =
    sn == null
      ? 'how you take in the world'
      : sn.pct >= 55
        ? `concrete, practical focus (${sn.pct}% Sensing)`
        : sn.pct <= 45
          ? `pattern-seeking, big-picture focus (${100 - sn.pct}% Intuition)`
          : 'a mix of detail and possibility';

  const decisions =
    tf == null
      ? 'how you decide under pressure'
      : tf.pct >= 55
        ? `clear criteria and logic (${tf.pct}% Thinking)`
        : tf.pct <= 45
          ? `people impact and values (${100 - tf.pct}% Feeling)`
          : 'both head and heart under pressure';

  const structure =
    jp == null
      ? 'how you handle structure'
      : jp.pct >= 55
        ? `plans and closure (${jp.pct}% Judging)`
        : jp.pct <= 45
          ? `flexibility and open options (${100 - jp.pct}% Perceiving)`
          : 'some structure with room to adapt';

  let pressure = '';
  if (burnout?.cls === 'severe' || (burnout?.pct ?? 0) >= 70) {
    pressure = ' Right now your burnout check-in says load is high — this image leans quieter so recovery can match the data.';
  } else if (burnout?.cls === 'moderate' || (burnout?.pct ?? 0) >= 45) {
    pressure = ' Your burnout score is elevated, so the mood is intended as a calm counterweight — not more performance push.';
  }

  const typeBit = typeName ? `${typeName}: ` : '';
  return `${typeBit}shaped around ${energy}; ${style}; ${decisions}; and ${structure}.${pressure}`.replace(
    /\s+/g,
    ' ',
  );
}
