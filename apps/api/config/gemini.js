function flag(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return raw === 'true' || raw === '1';
}

export function geminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || '';
}

export function isGeminiAvailable() {
  return Boolean(geminiApiKey());
}

export function geminiKeyFormat() {
  const key = geminiApiKey();
  if (!key) return 'missing';
  if (key.startsWith('AIza')) return 'ai-studio';
  if (key.startsWith('AQ.')) return 'google-express';
  return 'other';
}

/** @deprecated Use llmFeatures from config/llm.js */
export const geminiFeatures = {
  personalityQuestions: flag('GEMINI_PERSONALITY_QUESTIONS', true),
  burnoutQuestions: flag('GEMINI_BURNOUT_QUESTIONS', true),
  recommendations: flag('GEMINI_RECOMMENDATIONS', true),
};
