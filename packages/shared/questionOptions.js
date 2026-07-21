/** Validate and normalize LLM-generated answer options (values 0..n-1). */

import { AGREEMENT_OPTIONS, FREQUENCY_OPTIONS, inferQuestionScale, resolveQuestionScale } from './questions.js';

export function looksLikeFrequencyScale(options) {
  if (!Array.isArray(options) || options.length < 2) return false;
  const labels = options.map((o) => String(o?.label ?? '').toLowerCase()).join(' ');
  return /\bnever\b/.test(labels) && /\balways\b/.test(labels);
}

export function looksLikeAgreementScale(options) {
  if (!Array.isArray(options) || options.length < 2) return false;
  const labels = options.map((o) => String(o?.label ?? '').toLowerCase()).join(' ');
  return /\bstrongly disagree\b/.test(labels) || (/\bagree\b/.test(labels) && /\bdisagree\b/.test(labels));
}

/** Fix stored options when scale and labels disagree (common LLM/bank mismatch). */
export function coerceOptionsToScale(options, scale) {
  const fallback = scale === 'frequency' ? FREQUENCY_OPTIONS : AGREEMENT_OPTIONS;
  if (!Array.isArray(options) || options.length === 0) return fallback;
  if (scale === 'agreement' && looksLikeFrequencyScale(options)) return AGREEMENT_OPTIONS;
  if (scale === 'frequency' && looksLikeAgreementScale(options)) return FREQUENCY_OPTIONS;
  return normalizeLlmOptions(options, fallback);
}

export function resolveOptionsForQuestion(question, phase = 'personality') {
  const scale = resolveQuestionScale(question, phase);
  const fallback = scale === 'frequency' ? FREQUENCY_OPTIONS : AGREEMENT_OPTIONS;
  const options = Array.isArray(question.options) && question.options.length
    ? coerceOptionsToScale(question.options, scale)
    : fallback;
  return { scale, options };
}

export function normalizeLlmOptions(rawOptions, fallback, expectedCount = 5) {
  if (!Array.isArray(rawOptions) || rawOptions.length !== expectedCount) {
    return fallback;
  }

  const normalized = rawOptions.map((opt, i) => {
    const label = String(opt?.label ?? opt?.text ?? '').trim();
    if (!label) return null;

    let value = opt?.value;
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      value = i;
    }

    return { value, label };
  });

  if (normalized.some((o) => o === null)) return fallback;

  const values = new Set(normalized.map((o) => o.value));
  const expectedValues = new Set(Array.from({ length: expectedCount }, (_, i) => i));
  const hasSequentialValues =
    values.size === expectedCount && [...expectedValues].every((v) => values.has(v));

  if (!hasSequentialValues) {
    return normalized.map((o, i) => ({ value: i, label: o.label }));
  }

  return normalized.sort((a, b) => a.value - b.value);
}

/** Personality items must be "I ..." statements — not either/or or second-person questions. */
export function isValidPersonalityStatement(text) {
  const t = String(text ?? '').trim();
  if (t.length < 12) return false;
  if (!/^I\b/i.test(t)) return false;

  const badPatterns = [
    /\bdo you\b/i,
    /\bdoes you\b/i,
    /\bwhich\b.+\bor\b/i,
    /\bmore .+ or .+\?/i,
    /\bothers?.+ or .+ alone/i,
  ];

  return !badPatterns.some((re) => re.test(t));
}

export function optionLabelForValue(options, value) {
  if (!Array.isArray(options)) return String(value);
  return options.find((o) => o.value === value)?.label ?? String(value);
}
