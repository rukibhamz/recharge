import { isCircuitOpen, generateGeminiJson, generateGeminiChat } from './geminiClient.js';
import { generateOllamaJson, generateOllamaChat } from './ollamaClient.js';
import {
  generateAnthropicJson,
  generateAnthropicChat,
  generateOpenAiCompatibleJson,
  generateOpenAiCompatibleChat,
} from './openaiCompatClient.js';
import { getRuntimeConnectors } from './connectors.js';
import { recordLlmCall } from './llmMonitor.js';
import { isOpenAiCompatible, providerMeta } from '@recharge/shared/llmConnectors';

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
  const meta = providerMeta(provider);

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

  if (provider === 'anthropic') {
    const data = await generateAnthropicJson(prompt, { apiKey, model, baseUrl });
    return { data, provider: `anthropic:${model}`, label: name };
  }

  if (isOpenAiCompatible(provider)) {
    const data = await generateOpenAiCompatibleJson(prompt, {
      apiKey,
      model,
      baseUrl: baseUrl || meta?.defaultBaseUrl,
      providerLabel: provider,
      supportsJsonMode: meta?.supportsJsonMode !== false,
      requireApiKey: meta?.needsApiKey !== false,
    });
    return { data, provider: `${provider}:${model}`, label: name };
  }

  throw new Error(`Unknown LLM provider: ${provider}`);
}

async function callConnectorChat(connector, { system, messages }) {
  const { provider, model, apiKey, baseUrl, name } = connector;
  const meta = providerMeta(provider);

  if (provider === 'gemini') {
    if (isCircuitOpen() && !apiKey) {
      throw new Error('Gemini circuit open');
    }
    const text = await generateGeminiChat({ system, messages }, { apiKey, model });
    return { text, provider: `gemini:${model}`, label: name };
  }

  if (provider === 'ollama') {
    const text = await generateOllamaChat({ system, messages }, { model, baseUrl });
    return { text, provider: `ollama:${model}`, label: name };
  }

  if (provider === 'anthropic') {
    const text = await generateAnthropicChat({ system, messages }, { apiKey, model, baseUrl });
    return { text, provider: `anthropic:${model}`, label: name };
  }

  if (isOpenAiCompatible(provider)) {
    const text = await generateOpenAiCompatibleChat(
      { system, messages },
      {
        apiKey,
        model,
        baseUrl: baseUrl || meta?.defaultBaseUrl,
        providerLabel: provider,
        requireApiKey: meta?.needsApiKey !== false,
      },
    );
    return { text, provider: `${provider}:${model}`, label: name };
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
    const started = Date.now();
    try {
      const { data, provider } = await callConnector(connector, prompt);
      const latencyMs = Date.now() - started;
      recordLlmCall({
        connector,
        success: true,
        latencyMs,
        source: 'assessment',
      });
      llmStats.totalCalls += 1;
      llmStats.lastProvider = provider;
      llmStats.lastConnectorId = connector.id;
      llmStats.lastError = null;
      return data;
    } catch (err) {
      const latencyMs = Date.now() - started;
      recordLlmCall({
        connector,
        success: false,
        latencyMs,
        error: err.message,
        source: 'assessment',
      });
      errors.push(`${connector.name} (${connector.provider}): ${err.message}`);
      llmStats.lastError = err.message;
      llmStats.lastErrorAt = new Date().toISOString();
      console.warn(`[llm] ${connector.name} failed — trying next:`, err.message);
    }
  }

  throw new Error(`All LLM providers failed (${errors.join(' | ')})`);
}

/** Multi-turn free-text chat (Oma coach). */
export async function generateChat({ system, messages }, { source = 'coach' } = {}) {
  const connectors = await getRuntimeConnectors();
  if (!connectors.length) {
    throw new Error('No LLM connectors configured');
  }

  const errors = [];

  for (const connector of connectors) {
    const started = Date.now();
    try {
      const { text, provider } = await callConnectorChat(connector, { system, messages });
      const latencyMs = Date.now() - started;
      recordLlmCall({
        connector,
        success: true,
        latencyMs,
        source,
      });
      llmStats.totalCalls += 1;
      llmStats.lastProvider = provider;
      llmStats.lastConnectorId = connector.id;
      llmStats.lastError = null;
      return { text, provider };
    } catch (err) {
      const latencyMs = Date.now() - started;
      recordLlmCall({
        connector,
        success: false,
        latencyMs,
        error: err.message,
        source,
      });
      errors.push(`${connector.name} (${connector.provider}): ${err.message}`);
      llmStats.lastError = err.message;
      llmStats.lastErrorAt = new Date().toISOString();
      console.warn(`[llm-chat] ${connector.name} failed — trying next:`, err.message);
    }
  }

  throw new Error(`All LLM providers failed (${errors.join(' | ')})`);
}

export async function testConnectorRuntime(connector, { source = 'test' } = {}) {
  const probe = 'Return JSON only: {"ok":true,"message":"connector-test"}';
  const started = Date.now();
  try {
    const { data, provider } = await callConnector(connector, probe);
    recordLlmCall({
      connector,
      success: true,
      latencyMs: Date.now() - started,
      source,
    });
    return { ok: true, provider, sample: data };
  } catch (err) {
    recordLlmCall({
      connector,
      success: false,
      latencyMs: Date.now() - started,
      error: err.message,
      source,
    });
    throw err;
  }
}
