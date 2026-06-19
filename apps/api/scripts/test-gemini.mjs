import '../loadEnv.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiApiKey, geminiFeatures, geminiKeyFormat, isGeminiAvailable } from '../config/gemini.js';
import { generateJson, isCircuitOpen, geminiStats } from '../services/geminiClient.js';

console.log('keyFormat:', geminiKeyFormat());
console.log('configured:', isGeminiAvailable());
console.log('features:', geminiFeatures);
console.log('circuitOpen:', isCircuitOpen());
console.log('model:', process.env.GEMINI_MODEL);

const key = geminiApiKey();
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

try {
  const genAI = new GoogleGenerativeAI(key);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await m.generateContent('Return JSON: {"ok":true}');
  console.log('direct call success:', result.response.text());
} catch (e) {
  console.log('direct call error:', e.message);
}

try {
  const parsed = await generateJson('Return JSON: {"test":1}');
  console.log('generateJson success:', parsed);
} catch (e) {
  console.log('generateJson error:', e.message);
}

console.log('stats:', JSON.stringify(geminiStats, null, 2));
