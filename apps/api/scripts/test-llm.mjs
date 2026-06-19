import '../loadEnv.js';
import { generateJson, getLastLlmProvider, hasAnyLlmProvider, llmStats } from '../services/llmProvider.js';
import { checkOllamaConnection } from '../services/ollamaClient.js';
import { llmProviderOrder } from '../config/llm.js';

console.log('providerOrder:', llmProviderOrder());
console.log('anyProvider:', hasAnyLlmProvider());
console.log('ollama:', await checkOllamaConnection());

try {
  const data = await generateJson('Return JSON: {"hello":"world"}');
  console.log('success via', getLastLlmProvider(), data);
} catch (e) {
  console.log('failed:', e.message);
}

console.log('stats:', llmStats);
