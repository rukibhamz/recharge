import { isCircuitOpen, generateGeminiJson } from './geminiClient.js';
import { generateOllamaJson } from './ollamaClient.js';
import {
  generateAnthropicJson,
  generateOpenAiCompatibleJson,
} from './openaiCompatClient.js';
import { getRuntimeConnectors } from './connectors.js';

export const llmStats = {
  totalCalls: 0,
  lastProvider: null,
  lastConnectorId: null,
  lastError: null,
  lastErrorAt: null,
};

export function getLastLlmProvider() {
  return llmStats.lastProvider;
}

async function callConnector(connector, prompt) {
  const { provider, model, apiKey, baseUrl, name } = connector;

  if (provider === 'gemini') {
    if (isCircuitOpen() && !apiKey) {
      throw new Error('Gemini circuit open');
    }
    const data = await generateGeminiJson(prompt, { apiKey, model });
    return { data, provider: `gemini:${model}`, label: name };
  }

  if (provider === 'ollama') {
    const data = await generateOllamaJson(prompt, { model, baseUrl });
    return { data, provider: `ollama:${model}`, label: name };
  }

  if (provider === 'openai' || provider === 'openrouter') {
    const data = await generateOpenAiCompatibleJson(prompt, {
      apiKey,
      model,
      baseUrl,
      providerLabel: provider,
    });
    return { data, provider: `${provider}:${model}`, label: name };
  }

  if (provider === 'anthropic') {
    const data = await generateAnthropicJson(prompt, { apiKey, model, baseUrl });
    return { data, provider: `anthropic:${model}`, label: name };
  }

  throw new Error(`Unknown LLM provider: ${provider}`);
}

export async function hasAnyLlmProvider() {
  const connectors = await getRuntimeConnectors();
  return connectors.length > 0;
}

/** Try configured connectors in priority order. Banks/static handled by callers. */
export async function generateJson(prompt) {
  const connectors = await getRuntimeConnectors();
  if (!connectors.length) {
    throw new Error('No LLM connectors configured');
  }

  const errors = [];

  for (const connector of connectors) {
    try {
      const { data, provider } = await callConnector(connector, prompt);
      llmStats.totalCalls += 1;
      llmStats.lastProvider = provider;
      llmStats.lastConnectorId = connector.id;
      llmStats.lastError = null;
      return data;
    } catch (err) {
      errors.push(`${connector.name} (${connector.provider}): ${err.message}`);
      llmStats.lastError = err.message;
      llmStats.lastErrorAt = new Date().toISOString();
      console.warn(`[llm] ${connector.name} failed — trying next:`, err.message);
    }
  }

  throw new Error(`All LLM providers failed (${errors.join(' | ')})`);
}

export async function testConnectorRuntime(connector) {
  const probe =
    'Return JSON only: {"ok":true,"message":"connector-test"}';
  const { data, provider } = await callConnector(connector, probe);
  return { ok: true, provider, sample: data };
}
