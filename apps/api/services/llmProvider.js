import { geminiApiKey } from '../config/gemini.js';
import { isOllamaConfigured } from './ollamaClient.js';
import { llmProviderOrder } from '../config/llm.js';
import { generateGeminiJson, isCircuitOpen } from './geminiClient.js';
import { generateOllamaJson } from './ollamaClient.js';

export const llmStats = {
  totalCalls: 0,
  lastProvider: null,
  lastError: null,
  lastErrorAt: null,
};

export function getLastLlmProvider() {
  return llmStats.lastProvider;
}

function canUseGemini() {
  return Boolean(geminiApiKey()) && !isCircuitOpen();
}

function canUseOllama() {
  return isOllamaConfigured();
}

export function hasAnyLlmProvider() {
  return canUseGemini() || canUseOllama();
}

async function callProvider(name, prompt) {
  if (name === 'gemini') {
    if (!canUseGemini()) {
      throw new Error(isCircuitOpen() ? 'Gemini circuit open' : 'Gemini not configured');
    }
    const data = await generateGeminiJson(prompt);
    return { data, provider: 'gemini' };
  }

  if (name === 'ollama') {
    if (!canUseOllama()) throw new Error('Ollama not configured');
    const data = await generateOllamaJson(prompt);
    return { data, provider: 'ollama' };
  }

  throw new Error(`Unknown LLM provider: ${name}`);
}

/** Try providers in order (default: gemini → ollama). Banks/static are handled by callers. */
export async function generateJson(prompt) {
  const order = llmProviderOrder();
  const errors = [];

  for (const name of order) {
    try {
      const { data, provider } = await callProvider(name, prompt);
      llmStats.totalCalls += 1;
      llmStats.lastProvider = provider;
      llmStats.lastError = null;
      return data;
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
      llmStats.lastError = err.message;
      llmStats.lastErrorAt = new Date().toISOString();
      console.warn(`[llm] ${name} failed — trying next provider:`, err.message);
    }
  }

  throw new Error(`All LLM providers failed (${errors.join(' | ')})`);
}
