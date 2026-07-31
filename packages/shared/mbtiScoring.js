export const DICHOTOMY_TRAITS = [
  { key: 'EI', poleA: 'E', poleB: 'I', name: 'Extraversion / Introversion' },
  { key: 'SN', poleA: 'S', poleB: 'N', name: 'Sensing / Intuition' },
  { key: 'TF', poleA: 'T', poleB: 'F', name: 'Thinking / Feeling' },
  { key: 'JP', poleA: 'J', poleB: 'P', name: 'Judging / Perceiving' },
];

/** Share of a dichotomy total required to claim a letter without prior-type help. */
export const MBTI_CLEAR_THRESHOLD = 0.55;

/**
 * Pick a dichotomy letter with a clarity band.
 * Near 50/50 keeps priorType letter when available to reduce retake flip-flopping.
 */
export function pickDichotomyLetter(scoreA, scoreB, poleA, poleB, priorLetter = null) {
  const a = Number(scoreA) || 0;
  const b = Number(scoreB) || 0;
  const total = a + b;
  const prior =
    priorLetter === poleA || priorLetter === poleB ? priorLetter : null;

  if (total <= 0) {
    return { letter: prior ?? poleB, clear: false, pctTowardA: 50 };
  }

  const pctTowardA = a / total;
  if (pctTowardA >= MBTI_CLEAR_THRESHOLD) {
    return { letter: poleA, clear: true, pctTowardA: Math.round(pctTowardA * 100) };
  }
  if (pctTowardA <= 1 - MBTI_CLEAR_THRESHOLD) {
    return { letter: poleB, clear: true, pctTowardA: Math.round(pctTowardA * 100) };
  }

  // Unclear band: prefer prior letter, else slight lean, else poleB (I/N/F/P) for ties
  if (prior) {
    return { letter: prior, clear: false, pctTowardA: Math.round(pctTowardA * 100) };
  }
  if (pctTowardA > 0.5) {
    return { letter: poleA, clear: false, pctTowardA: Math.round(pctTowardA * 100) };
  }
  if (pctTowardA < 0.5) {
    return { letter: poleB, clear: false, pctTowardA: Math.round(pctTowardA * 100) };
  }
  return { letter: poleB, clear: false, pctTowardA: 50 };
}

/**
 * @param {number[]} answers
 * @param {object[]} questions
 * @param {{ priorTypeCode?: string|null }} [options]
 */
export function scoreMbti(answers, questions, options = {}) {
  const priorTypeCode = String(options.priorTypeCode ?? '')
    .toUpperCase()
    .replace(/[^EISNTFJP]/g, '');
  const priorLetters = priorTypeCode.length === 4 ? priorTypeCode.split('') : null;

  const poles = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  questions.forEach((q, i) => {
    const pole = q.scoredPole ?? q.scored_pole;
    const score = answers[i] ?? 0;
    if (pole && Object.hasOwn(poles, pole)) {
      poles[pole] += score;
    }
  });

  const traits = DICHOTOMY_TRAITS.map(({ poleA, poleB, name }, index) => {
    const scoreA = poles[poleA];
    const scoreB = poles[poleB];
    const total = scoreA + scoreB;
    const pct = total > 0 ? Math.round((scoreA / total) * 100) : 50;
    const picked = pickDichotomyLetter(
      scoreA,
      scoreB,
      poleA,
      poleB,
      priorLetters?.[index] ?? null,
    );
    return {
      name,
      pct,
      poleA,
      poleB,
      scoreA,
      scoreB,
      letter: picked.letter,
      clear: picked.clear,
    };
  });

  const typeCode = traits.map((t) => t.letter).join('');

  return {
    typeCode,
    poles,
    traits,
    stabilized: Boolean(priorLetters) && traits.some((t) => !t.clear),
  };
}

export function formatMbtiType(profile) {
  if (!profile) {
    return {
      id: 'unknown',
      code: '????',
      name: 'Unknown Type',
      title: 'Unknown',
      archetype: '',
      desc: 'Your personality profile could not be loaded.',
      icon: '✨',
    };
  }

  const desc =
    profile.description?.trim() ||
    `Your responses align with the ${profile.code} personality pattern.`;

  return {
    id: profile.code.toLowerCase(),
    code: profile.code,
    name: profile.title ? `${profile.code} — ${profile.title}` : profile.code,
    title: profile.title,
    archetype: profile.archetype,
    desc,
    strengths: profile.strengths,
    growthAreas: profile.growth_areas,
    icon: mbtiIcon(profile.code),
  };
}

function mbtiIcon(code) {
  const icons = {
    INTJ: '🏛️', INTP: '🔬', ENTJ: '👔', ENTP: '💡',
    INFJ: '🌿', INFP: '🎨', ENFJ: '🤝', ENFP: '🌟',
    ISTJ: '📋', ISFJ: '🛡️', ESTJ: '📊', ESFJ: '💛',
    ISTP: '🔧', ISFP: '🎭', ESTP: '⚡', ESFP: '🎉',
  };
  return icons[code] ?? '✨';
}
