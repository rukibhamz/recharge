/** Minimum burnout items that should focus on personal/social life, not work. */
export const MIN_LIFE_SOCIAL_BURNOUT = 2;

const WORK_KEYWORDS =
  /\b(work|workday|workplace|job|career|colleague|manager|boss|client|office|meeting|project|deadline|role|employer|shift|commute to work)\b/i;

const LIFE_SOCIAL_KEYWORDS =
  /\b(friends?|families|family|relationships?|personal|weekends?|evenings?|home|social|hobbies?|leisure|partner|loved ones?|community outside|outside work|free time|downtime)\b/i;

/** Classify burnout seed text as work-focused or personal/social life. */
export function inferBurnoutLifeDomain(text, explicitDomain) {
  if (explicitDomain === 'life_social' || explicitDomain === 'work') return explicitDomain;
  const copy = String(text ?? '');
  if (LIFE_SOCIAL_KEYWORDS.test(copy)) return 'life_social';
  if (WORK_KEYWORDS.test(copy)) return 'work';
  return 'work';
}

function burnoutLifeDomainOf(question) {
  return inferBurnoutLifeDomain(
    question?.question_text ?? question?.text,
    question?.lifeDomain,
  );
}

/** Fallback life/social burnout seeds when the bank selection is too work-heavy. */
export const LIFE_SOCIAL_BURNOUT_SEEDS = [
  {
    seedText: 'By the end of most weeks I have little energy left for friends or family.',
    dimension: 'exhaustion',
    scale: 'agreement',
    reverseScored: false,
  },
  {
    seedText: 'I feel disconnected from friends and social life outside my daily routine.',
    dimension: 'community',
    scale: 'agreement',
    reverseScored: false,
  },
  {
    seedText: 'I cancel social plans because I feel too drained to show up.',
    dimension: 'exhaustion',
    scale: 'frequency',
    reverseScored: false,
  },
  {
    seedText: 'My personal relationships suffer when life feels overwhelming.',
    dimension: 'community',
    scale: 'agreement',
    reverseScored: false,
  },
];

const PERSONALITY_DOMAIN_BY_DICHOTOMY = {
  'E/I': [
    'social energy, friendships, and time with people',
    'need for solitude and quiet recharge',
    'group settings versus one-on-one connection in everyday life',
  ],
  'S/N': [
    'concrete daily routines, hobbies, and hands-on activities',
    'imagination, ideas, and possibilities in personal life',
    'practical details versus big-picture thinking outside work',
  ],
  'T/F': [
    'how you make decisions that affect people you care about',
    'logic versus empathy in personal situations',
    'values and fairness in close relationships',
  ],
  'J/P': [
    'planning, structure, and routines in daily life',
    'flexibility, spontaneity, and keeping options open',
    'deadlines and organisation in personal projects or home life',
  ],
};

/**
 * Suggest a non-work life domain for personality question rewrites.
 * slotIndex is 0–2 within each dichotomy group.
 */
export function personalityQuestionDomainHint(dichotomy, slotIndex = 0) {
  const key = String(dichotomy ?? 'E/I');
  const options = PERSONALITY_DOMAIN_BY_DICHOTOMY[key] ?? ['everyday life outside work'];
  const domain = options[slotIndex % options.length];
  return [
    `Life domain for this item: ${domain}`,
    'Frame the statement around personality in daily life — friendships, family, hobbies, downtime, or personal habits.',
    'Do NOT mention work, job, meetings, colleagues, manager, or career unless the seed absolutely requires it.',
  ].join('\n');
}

export function burnoutLifeDomainCoaching(lifeDomain) {
  if (lifeDomain === 'life_social') {
    return [
      'Life domain: personal and social wellbeing (NOT work).',
      'Focus on friendships, family, downtime, hobbies, home life, or community outside employment.',
      'Do NOT mention meetings, manager, colleagues, office, or workplace.',
    ].join('\n');
  }
  return [
    'Life domain: work or role-related stress (match their work situation from context).',
    'You may include 1–2 work references, but keep wording natural for their situation.',
  ].join('\n');
}

/**
 * Ensure at least MIN_LIFE_SOCIAL_BURNOUT items focus on personal/social life.
 */
export function ensureLifeSocialBurnoutMix(selected, allQuestions, minCount = MIN_LIFE_SOCIAL_BURNOUT) {
  const picked = [...selected];
  const lifeCount = picked.filter((q) => burnoutLifeDomainOf(q) === 'life_social').length;

  if (lifeCount >= minCount) return picked;

  const selectedIds = new Set(picked.map((q) => q.id ?? q.bankId));
  const lifePool = allQuestions.filter(
    (q) => !selectedIds.has(q.id) && burnoutLifeDomainOf(q) === 'life_social',
  );

  let needed = minCount - lifeCount;
  const shuffledLife = [...lifePool].sort(() => Math.random() - 0.5);

  for (const lifeQ of shuffledLife) {
    if (needed <= 0) break;
    const workIdx = picked.findIndex((q) => burnoutLifeDomainOf(q) === 'work');
    if (workIdx === -1) break;
    picked[workIdx] = lifeQ;
    needed -= 1;
  }

  if (needed > 0) {
    for (const seed of LIFE_SOCIAL_BURNOUT_SEEDS) {
      if (needed <= 0) break;
      const workIdx = picked.findIndex((q) => burnoutLifeDomainOf(q) === 'work');
      if (workIdx === -1) break;
      picked[workIdx] = {
        id: `life-seed-${seed.dimension}-${workIdx}`,
        question_text: seed.seedText,
        dimension: seed.dimension,
        response_scale: seed.scale,
        lifeDomain: 'life_social',
        _syntheticLifeSocial: true,
      };
      needed -= 1;
    }
  }

  return picked;
}
