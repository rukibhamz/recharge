export const DICHOTOMY_TRAITS = [
  { key: 'EI', poleA: 'E', poleB: 'I', name: 'Extraversion / Introversion' },
  { key: 'SN', poleA: 'S', poleB: 'N', name: 'Sensing / Intuition' },
  { key: 'TF', poleA: 'T', poleB: 'F', name: 'Thinking / Feeling' },
  { key: 'JP', poleA: 'J', poleB: 'P', name: 'Judging / Perceiving' },
];

export function scoreMbti(answers, questions) {
  const poles = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  questions.forEach((q, i) => {
    const pole = q.scoredPole ?? q.scored_pole;
    const score = answers[i] ?? 0;
    if (pole && Object.hasOwn(poles, pole)) {
      poles[pole] += score;
    }
  });

  const typeCode = [
    poles.E >= poles.I ? 'E' : 'I',
    poles.S >= poles.N ? 'S' : 'N',
    poles.T >= poles.F ? 'T' : 'F',
    poles.J >= poles.P ? 'J' : 'P',
  ].join('');

  const traits = DICHOTOMY_TRAITS.map(({ poleA, poleB, name }) => {
    const a = poles[poleA];
    const b = poles[poleB];
    const total = a + b;
    const pct = total > 0 ? Math.round((a / total) * 100) : 50;
    return { name, pct, poleA, poleB, scoreA: a, scoreB: b };
  });

  return {
    typeCode,
    poles,
    traits,
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
