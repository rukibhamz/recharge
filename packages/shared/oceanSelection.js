/** Select a balanced OCEAN item set (forward + reverse keyed per trait). */

export const OCEAN_TRAIT_CODES = ['O', 'C', 'E', 'A', 'N'];
export const OCEAN_ITEMS_PER_TRAIT = 4;
export const OCEAN_ITEMS_PER_DIRECTION = 2;

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sortStable(items, numberKey) {
  return [...items].sort((a, b) => {
    const an = Number(a?.[numberKey] ?? a?.question_number ?? 0);
    const bn = Number(b?.[numberKey] ?? b?.question_number ?? 0);
    if (an !== bn) return an - bn;
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
  });
}

function traitOf(q) {
  return String(q?.scoredTrait ?? q?.scored_trait ?? '').toUpperCase();
}

function isReverse(q) {
  return Boolean(q?.reverseScored ?? q?.reverse_scored);
}

/**
 * Pick balanced OCEAN questions: per trait, half forward-keyed and half reverse-keyed.
 */
export function selectBalancedOceanQuestions(allQuestions, options = {}) {
  const {
    stable = true,
    perDirection = OCEAN_ITEMS_PER_DIRECTION,
    traitCodes = OCEAN_TRAIT_CODES,
    numberKey = 'question_number',
  } = options;

  const selected = [];

  for (const trait of traitCodes) {
    const pool = (allQuestions ?? []).filter((q) => traitOf(q) === trait);
    const forward = pool.filter((q) => !isReverse(q));
    const reverse = pool.filter((q) => isReverse(q));

    const pickForward = stable ? sortStable(forward, numberKey) : shuffle(forward);
    const pickReverse = stable ? sortStable(reverse, numberKey) : shuffle(reverse);

    selected.push(...pickForward.slice(0, perDirection), ...pickReverse.slice(0, perDirection));
  }

  const expected = traitCodes.length * perDirection * 2;
  if (selected.length < expected) {
    throw new Error(`Could not select ${expected} balanced OCEAN questions (got ${selected.length})`);
  }

  return selected;
}
