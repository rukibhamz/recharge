export const LLM_PROVIDERS = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    needsApiKey: true,
    needsBaseUrl: false,
    defaultModel: 'gemini-2.5-flash-lite',
    defaultBaseUrl: '',
    modelHints: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'],
  },
  {
    id: 'ollama',
    label: 'Ollama (self-hosted)',
    needsApiKey: false,
    needsBaseUrl: true,
    defaultModel: 'llama3.2',
    defaultBaseUrl: 'http://localhost:11434',
    modelHints: ['llama3.2', 'qwen2.5', 'mistral'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    needsApiKey: true,
    needsBaseUrl: false,
    defaultModel: 'gpt-4o-mini',
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelHints: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    needsApiKey: true,
    needsBaseUrl: false,
    defaultModel: 'google/gemini-2.0-flash-001',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    modelHints: ['google/gemini-2.0-flash-001', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    needsApiKey: true,
    needsBaseUrl: false,
    defaultModel: 'claude-3-5-haiku-latest',
    defaultBaseUrl: 'https://api.anthropic.com',
    modelHints: ['claude-3-5-haiku-latest', 'claude-sonnet-4-20250514'],
  },
];

export function providerMeta(providerId) {
  return LLM_PROVIDERS.find((p) => p.id === providerId) ?? null;
}

export function isValidProvider(providerId) {
  return Boolean(providerMeta(providerId));
}

export function maskApiKey(key) {
  const raw = String(key ?? '');
  if (!raw) return null;
  if (raw.length <= 8) return '••••••••';
  return `${raw.slice(0, 4)}…${raw.slice(-4)}`;
}
