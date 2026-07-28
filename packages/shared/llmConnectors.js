/**
 * Admin AI connector catalog.
 * OpenAI-compatible providers share one HTTP client; Gemini/Anthropic/Ollama stay specialized.
 */

export const OPENAI_COMPAT_PROVIDERS = new Set([
  'openai',
  'openrouter',
  'mistral',
  'groq',
  'together',
  'deepseek',
  'fireworks',
  'openai-compat',
]);

export function isOpenAiCompatible(providerId) {
  return OPENAI_COMPAT_PROVIDERS.has(String(providerId || '').toLowerCase());
}

export const LLM_PROVIDERS = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    category: 'Cloud',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: false,
    supportsJsonMode: true,
    defaultModel: 'gemini-2.5-flash-lite',
    defaultBaseUrl: '',
    modelHints: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'],
    docsHint: 'Google AI Studio API key',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    category: 'Cloud',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: true,
    defaultModel: 'mistral-small-latest',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    modelHints: [
      'mistral-small-latest',
      'mistral-medium-latest',
      'mistral-large-latest',
      'open-mistral-nemo',
      'ministral-8b-latest',
    ],
    docsHint: 'console.mistral.ai → API keys',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    category: 'Cloud',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: true,
    defaultModel: 'gpt-4o-mini',
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelHints: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    docsHint: 'platform.openai.com API key',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    category: 'Cloud',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: false,
    defaultModel: 'claude-3-5-haiku-latest',
    defaultBaseUrl: 'https://api.anthropic.com',
    modelHints: ['claude-3-5-haiku-latest', 'claude-sonnet-4-20250514'],
    docsHint: 'console.anthropic.com API key',
  },
  {
    id: 'groq',
    label: 'Groq',
    category: 'Fast / open models',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: true,
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    modelHints: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    docsHint: 'console.groq.com — open models at high speed',
  },
  {
    id: 'together',
    label: 'Together AI',
    category: 'Fast / open models',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: true,
    defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    modelHints: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-7B-Instruct-Turbo',
    ],
    docsHint: 'api.together.xyz — hosted open-source models',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    category: 'Fast / open models',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: true,
    defaultModel: 'deepseek-chat',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    modelHints: ['deepseek-chat', 'deepseek-reasoner'],
    docsHint: 'platform.deepseek.com API key',
  },
  {
    id: 'fireworks',
    label: 'Fireworks AI',
    category: 'Fast / open models',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: true,
    defaultModel: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
    defaultBaseUrl: 'https://api.fireworks.ai/inference/v1',
    modelHints: [
      'accounts/fireworks/models/llama-v3p1-8b-instruct',
      'accounts/fireworks/models/mixtral-8x7b-instruct',
    ],
    docsHint: 'fireworks.ai API key',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    category: 'Gateway',
    needsApiKey: true,
    needsBaseUrl: false,
    allowBaseUrlOverride: true,
    supportsJsonMode: true,
    defaultModel: 'mistralai/mistral-small',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    modelHints: [
      'mistralai/mistral-small',
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-haiku',
      'meta-llama/llama-3.1-8b-instruct',
    ],
    docsHint: 'One key for many models — openrouter.ai',
  },
  {
    id: 'ollama',
    label: 'Ollama (self-hosted)',
    category: 'Self-hosted',
    needsApiKey: false,
    needsBaseUrl: true,
    allowBaseUrlOverride: true,
    supportsJsonMode: false,
    defaultModel: 'llama3.2',
    defaultBaseUrl: 'http://localhost:11434',
    modelHints: ['llama3.2', 'qwen2.5', 'mistral', 'phi3'],
    docsHint: 'Local Ollama — no cloud key required',
  },
  {
    id: 'openai-compat',
    label: 'OpenAI-compatible (custom)',
    category: 'Self-hosted',
    needsApiKey: false,
    needsBaseUrl: true,
    allowBaseUrlOverride: true,
    supportsJsonMode: false,
    defaultModel: 'local-model',
    defaultBaseUrl: 'http://localhost:1234/v1',
    modelHints: [
      'Whatever your server exposes (LM Studio, vLLM, llama.cpp, LocalAI, …)',
    ],
    docsHint:
      'Any OpenAI Chat Completions API — paste Base URL + optional key from your open-source host',
  },
];

export function providersByCategory() {
  const map = new Map();
  for (const p of LLM_PROVIDERS) {
    const cat = p.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(p);
  }
  return [...map.entries()].map(([category, providers]) => ({ category, providers }));
}

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
