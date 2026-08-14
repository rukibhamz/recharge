export const FEEDBACK_CATEGORIES = [
  { id: 'questions', label: 'Questions in the assessment' },
  { id: 'advice', label: 'Recovery advice' },
  { id: 'coach', label: 'Oma / coach chat' },
  { id: 'results', label: 'Results and explanations' },
  { id: 'idea', label: 'A new idea' },
  { id: 'other', label: 'Something else' },
];

export const FEEDBACK_STATUSES = ['new', 'read', 'archived'];

const CATEGORY_IDS = new Set(FEEDBACK_CATEGORIES.map((c) => c.id));

export function sanitizeFeedbackMessage(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

export function sanitizeFeedbackEmail(email) {
  const value = String(email ?? '').trim().toLowerCase().slice(0, 120);
  if (!value) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '';
  return value;
}

export function sanitizeFeedbackRating(rating) {
  if (rating == null || rating === '') return null;
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export function validateFeedbackPayload(body = {}) {
  const category = String(body.category ?? '').toLowerCase();
  const message = sanitizeFeedbackMessage(body.message);
  const page = String(body.page ?? '')
    .trim()
    .slice(0, 80);
  const email = sanitizeFeedbackEmail(body.email);
  const rating = sanitizeFeedbackRating(body.rating);

  if (!CATEGORY_IDS.has(category)) {
    return { ok: false, error: 'Choose what this feedback is about.' };
  }
  if (message.length < 12) {
    return { ok: false, error: 'Tell us a bit more (at least a sentence).' };
  }

  return {
    ok: true,
    value: {
      category,
      message,
      page,
      email,
      rating,
    },
  };
}

export function feedbackCategoryLabel(id) {
  return FEEDBACK_CATEGORIES.find((c) => c.id === id)?.label || id;
}
