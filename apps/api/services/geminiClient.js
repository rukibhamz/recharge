import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiApiKey } from '../config/gemini.js';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash-lite,gemini-2.5-flash,gemini-flash-latest')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const MIN_INTERVAL_MS = Number(process.env.GEMINI_MIN_INTERVAL_MS) || 4_000;
const MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES) || 2;
const CIRCUIT_BREAKER_MS = Number(process.env.GEMINI_CIRCUIT_BREAKER_MS) || 120_000;

let lastCallAt = 0;
let circuitOpenUntil = 0;
let queue = Promise.resolve();
let activeModel = PRIMARY_MODEL;

export const geminiStats = {
  totalCalls: 0,
  quotaErrors: 0,
  lastError: null,
  lastErrorAt: null,
  activeModel: PRIMARY_MODEL,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaError(err) {
  const msg = err?.message ?? '';
  return msg.includes('429') || /quota/i.test(msg) || /rate limit/i.test(msg);
}

function isModelUnavailable(err) {
  const msg = err?.message ?? '';
  return msg.includes('404') || /not found/i.test(msg) || /not supported/i.test(msg);
}

function parseRetryDelayMs(err) {
  const match = err?.message?.match(/retry in ([\d.]+)s/i);
  if (match) return Math.min(Math.ceil(parseFloat(match[1]) * 1000) + 500, 60_000);
  return 8_000;
}

export function isCircuitOpen() {
  return Date.now() < circuitOpenUntil;
}

export function getGeminiModel() {
  return activeModel;
}

async function generateWithModel(modelName, prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

export async function generateGeminiJson(prompt, options = {}) {
  const apiKey = options.apiKey || geminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  if (isCircuitOpen()) {
    throw new Error('Gemini quota cooldown active — using fallback content');
  }

  const candidates = options.model
    ? [options.model]
    : [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])];

  const run = async () => {
    const elapsed = Date.now() - lastCallAt;
    if (elapsed < MIN_INTERVAL_MS) {
      await sleep(MIN_INTERVAL_MS - elapsed);
    }

    let lastErr;

    for (const modelName of candidates) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          lastCallAt = Date.now();
          geminiStats.totalCalls += 1;
          const parsed = await generateWithModel(modelName, prompt, apiKey);
          activeModel = modelName;
          geminiStats.activeModel = modelName;
          return parsed;
        } catch (err) {
          lastErr = err;

          if (isModelUnavailable(err)) {
            console.warn(`Gemini model unavailable: ${modelName}`);
            break;
          }

          if (isQuotaError(err)) {
            geminiStats.quotaErrors += 1;
            geminiStats.lastError = err.message;
            geminiStats.lastErrorAt = new Date().toISOString();

            if (attempt < MAX_RETRIES) {
              const delay = parseRetryDelayMs(err);
              console.warn(`Gemini 429 on ${modelName} — retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
              await sleep(delay);
              continue;
            }

            console.warn(`Gemini quota exceeded on ${modelName} — trying next model`);
            break;
          }

          throw err;
        }
      }
    }

    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_MS;
    console.error(`All Gemini models failed — circuit open for ${CIRCUIT_BREAKER_MS / 1000}s`);
    throw lastErr;
  };

  const result = queue.then(run, run);
  queue = result.catch(() => {});
  return result;
}
