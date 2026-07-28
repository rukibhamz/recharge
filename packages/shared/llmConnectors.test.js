import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isOpenAiCompatible,
  isValidProvider,
  providerMeta,
  LLM_PROVIDERS,
} from './llmConnectors.js';

describe('llmConnectors catalog', () => {
  it('includes mistral and openai-compat', () => {
    assert.equal(isValidProvider('mistral'), true);
    assert.equal(isValidProvider('openai-compat'), true);
    assert.equal(isValidProvider('groq'), true);
    assert.equal(providerMeta('mistral').defaultBaseUrl.includes('mistral.ai'), true);
  });

  it('treats mistral/groq/custom as OpenAI-compatible', () => {
    assert.equal(isOpenAiCompatible('mistral'), true);
    assert.equal(isOpenAiCompatible('groq'), true);
    assert.equal(isOpenAiCompatible('openai-compat'), true);
    assert.equal(isOpenAiCompatible('gemini'), false);
    assert.equal(isOpenAiCompatible('anthropic'), false);
  });

  it('requires base URL for custom openai-compat', () => {
    assert.equal(providerMeta('openai-compat').needsBaseUrl, true);
    assert.equal(providerMeta('openai-compat').needsApiKey, false);
  });

  it('exposes every provider id uniquely', () => {
    const ids = LLM_PROVIDERS.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});
