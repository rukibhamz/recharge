/** Generic curated tips for display when stored recommendations use legacy/unknown keys. */
export const DEFAULT_RECOVERY_TIPS = [
  { icon: '📅', title: 'Schedule recovery', tip: 'Block thirty minutes daily for rest with no productivity goal.' },
  { icon: '🔕', title: 'Reduce input noise', tip: 'Turn off non-urgent notifications for the next forty-eight hours.' },
  { icon: '💬', title: 'Ask for support', tip: 'Tell one trusted person you are depleted and need help.' },
  { icon: '🎯', title: 'Shrink the list', tip: 'Pick only three priorities for this week and let the rest wait.' },
];

const TITLE_KEYS = ['title', 'name', 'heading', 'headline', 'label', 'recommendation_title'];
const TIP_KEYS = [
  'tip',
  'text',
  'description',
  'body',
  'content',
  'advice',
  'recommendation',
  'detail',
  'recommendation_text',
  'message',
];
const ICON_KEYS = ['icon', 'emoji', 'symbol'];

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function tryParseJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

/** Unwrap stringified JSON objects/arrays (including double-encoded values). */
export function coerceRecommendationInput(item) {
  let value = tryParseJson(item);
  if (typeof value === 'string') {
    value = tryParseJson(value);
  }
  return value;
}

function flattenRecommendationSource(item) {
  const coerced = coerceRecommendationInput(item);
  if (!coerced || typeof coerced !== 'object') return coerced;
  const nested = coerced.recommendation ?? coerced.recovery ?? coerced.item;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return { ...coerced, ...coerceRecommendationInput(nested) };
  }
  return coerced;
}

/** Normalize one recommendation object to { icon, title, tip }. */
export function normalizeRecommendationItem(item, fallback = null) {
  const source = flattenRecommendationSource(item);

  if (typeof source === 'string') {
    const tip = source.trim();
    if (!tip) return fallback ? { ...fallback } : null;
    return {
      icon: fallback?.icon ?? '💡',
      title: fallback?.title ?? 'Recovery step',
      tip,
    };
  }

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return fallback ? { ...fallback } : null;
  }

  const title = pickFirst(source, TITLE_KEYS);
  const tip = pickFirst(source, TIP_KEYS);
  const icon = pickFirst(source, ICON_KEYS) || fallback?.icon || '💡';

  if (!title && !tip) {
    return fallback ? { ...fallback } : null;
  }

  return {
    icon,
    title: title || fallback?.title || 'Recovery step',
    tip: tip || fallback?.tip || '',
  };
}

function extractRecommendationArray(parsed) {
  const input = coerceRecommendationInput(parsed);
  if (Array.isArray(input)) return input.map(coerceRecommendationInput);
  if (!input || typeof input !== 'object') return null;

  for (const key of ['recommendations', 'items', 'recovery_recommendations', 'tips', 'data']) {
    if (Array.isArray(input[key])) {
      return input[key].map(coerceRecommendationInput);
    }
    if (typeof input[key] === 'string') {
      const nested = coerceRecommendationInput(input[key]);
      if (Array.isArray(nested)) return nested.map(coerceRecommendationInput);
    }
  }

  if (pickFirst(input, TITLE_KEYS) || pickFirst(input, TIP_KEYS)) {
    return [input];
  }

  return null;
}

/**
 * Normalize LLM/DB recommendation payloads to a stable [{ icon, title, tip }] list.
 * Falls back to `fallbackList` entries when fields are missing.
 */
export function normalizeRecommendationsList(parsed, fallbackList = []) {
  const raw = extractRecommendationArray(parsed);
  if (!raw?.length) return fallbackList.slice(0, 4);

  const normalized = raw
    .slice(0, 4)
    .map((item, index) => normalizeRecommendationItem(item, fallbackList[index] ?? null))
    .filter(Boolean);

  for (let i = normalized.length; i < 4 && i < fallbackList.length; i += 1) {
    normalized.push({ ...fallbackList[i] });
  }

  return normalized.map((rec, index) => {
    const fallback = fallbackList[index];
    if (!fallback) return rec;
    return {
      icon: rec.icon || fallback.icon,
      title: rec.title?.trim() ? rec.title : fallback.title,
      tip: rec.tip?.trim() ? rec.tip : fallback.tip,
    };
  });
}

/** True when at least one item has displayable title or tip text. */
export function hasDisplayableRecommendations(recommendations) {
  const list = extractRecommendationArray(recommendations);
  if (!list?.length) return false;
  return list.some((item) => {
    const source = flattenRecommendationSource(item);
    if (typeof source === 'object' && source) {
      return pickFirst(source, TITLE_KEYS) || pickFirst(source, TIP_KEYS);
    }
    return typeof source === 'string' && source.trim().length > 0;
  });
}
