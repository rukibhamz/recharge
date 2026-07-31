/** Select personality items with both poles represented per dichotomy. */

export const MBTI_DICHOTOMY_CODES = ['E/I', 'S/N', 'T/F', 'J/P'];

/** Default instrument: 4 items per dichotomy (2 per pole) = 16 questions. */
export const PERSONALITY_PER_DICHOTOMY = 4;
export const PERSONALITY_PER_POLE = 2;

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function poleOf(question, scoredPoleKey) {
  return String(question?.[scoredPoleKey] ?? question?.scoredPole ?? '').toUpperCase();
}

function dichotomyOf(question, dichotomyKey) {
  return String(question?.[dichotomyKey] ?? question?.dichotomy ?? '');
}

function sortStable(items, numberKey) {
  return [...items].sort((a, b) => {
    const an = Number(a?.[numberKey] ?? a?.question_number ?? a?.questionNumber ?? 0);
    const bn = Number(b?.[numberKey] ?? b?.question_number ?? b?.questionNumber ?? 0);
    if (an !== bn) return an - bn;
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
  });
}

/**
 * Pick a pole-balanced personality set.
 *
 * @param {object[]} allQuestions
 * @param {object} [options]
 * @param {boolean} [options.stable=true] Prefer lowest question numbers (fixed core form).
 * @param {number} [options.perPole=2] Items per pole within each dichotomy.
 * @param {string} [options.scoredPoleKey='scored_pole']
 * @param {string} [options.dichotomyKey='dichotomy']
 * @param {string} [options.numberKey='question_number']
 */
export function selectPoleBalancedPersonalityQuestions(allQuestions, options = {}) {
  const {
    stable = true,
    perPole = PERSONALITY_PER_POLE,
    scoredPoleKey = 'scored_pole',
    dichotomyKey = 'dichotomy',
    numberKey = 'question_number',
    dichotomyCodes = MBTI_DICHOTOMY_CODES,
  } = options;

  const byDichotomy = new Map();
  for (const q of allQuestions ?? []) {
    const key = dichotomyOf(q, dichotomyKey);
    if (!key) continue;
    if (!byDichotomy.has(key)) byDichotomy.set(key, []);
    byDichotomy.get(key).push(q);
  }

  const selected = [];

  for (const code of dichotomyCodes) {
    const [poleA, poleB] = code.split('/');
    const group = byDichotomy.get(code) ?? [];
    const aPool = group.filter((q) => poleOf(q, scoredPoleKey) === poleA);
    const bPool = group.filter((q) => poleOf(q, scoredPoleKey) === poleB);

    const aOrdered = stable ? sortStable(aPool, numberKey) : shuffle(aPool);
    const bOrdered = stable ? sortStable(bPool, numberKey) : shuffle(bPool);

    const pickedA = aOrdered.slice(0, perPole);
    const pickedB = bOrdered.slice(0, perPole);

    if (pickedA.length < perPole || pickedB.length < perPole) {
      // Fall back: fill remaining slots from either pole in this dichotomy
      const remaining = (stable ? sortStable(group, numberKey) : shuffle(group)).filter(
        (q) => !pickedA.includes(q) && !pickedB.includes(q),
      );
      const need = perPole * 2 - pickedA.length - pickedB.length;
      selected.push(...pickedA, ...pickedB, ...remaining.slice(0, Math.max(0, need)));
    } else {
      selected.push(...pickedA, ...pickedB);
    }
  }

  const expected = dichotomyCodes.length * perPole * 2;
  if (selected.length < expected) {
    throw new Error(
      `Could not select ${expected} pole-balanced personality questions (got ${selected.length})`,
    );
  }

  // Present in mixed order so poles aren't blocked together; keep item identity stable when stable=true
  if (stable) {
    return shuffle(selected);
  }
  return shuffle(selected);
}
