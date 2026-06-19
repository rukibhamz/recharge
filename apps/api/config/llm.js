function flag(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return raw === 'true' || raw === '1';
}

function featureFlag(primary, legacy, defaultValue) {
  const primaryRaw = process.env[primary];
  if (primaryRaw !== undefined && primaryRaw !== '') {
    return flag(primary, defaultValue);
  }
  return flag(legacy, defaultValue);
}

/** Live LLM features — banks/static are fallbacks only when all providers fail. */
export const llmFeatures = {
  personalityQuestions: featureFlag('LLM_PERSONALITY_QUESTIONS', 'GEMINI_PERSONALITY_QUESTIONS', true),
  burnoutQuestions: featureFlag('LLM_BURNOUT_QUESTIONS', 'GEMINI_BURNOUT_QUESTIONS', true),
  recommendations: featureFlag('LLM_RECOMMENDATIONS', 'GEMINI_RECOMMENDATIONS', true),
};

/** Provider try order: gemini,ollama */
export function llmProviderOrder() {
  return (process.env.LLM_PROVIDER_ORDER || 'gemini,ollama')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

export function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
}

export function ollamaModel() {
  return process.env.OLLAMA_MODEL || 'aiengine-qwen3:latest';
}
