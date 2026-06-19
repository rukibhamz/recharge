import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import assessRouter from './routes/assess.js';
import questionsRouter from './routes/questions.js';
import sessionRouter from './routes/session.js';
import historyRouter from './routes/history.js';
import { rateLimit } from './middleware/rateLimit.js';
import { ENV_EXISTS, ENV_PATH } from './loadEnv.js';
import { geminiKeyFormat, isGeminiAvailable } from './config/gemini.js';
import { llmFeatures, llmProviderOrder, ollamaModel } from './config/llm.js';
import { geminiStats, getGeminiModel, isCircuitOpen } from './services/geminiClient.js';
import { checkOllamaConnection, isOllamaConfigured, ollamaStats } from './services/ollamaClient.js';
import { hasAnyLlmProvider, llmStats } from './services/llmProvider.js';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import { checkQuestionBankHealth } from './services/questionBank.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  const ollamaConnected = isOllamaConfigured() ? await checkOllamaConnection() : false;

  const llm = {
    providerOrder: llmProviderOrder(),
    anyProviderAvailable: hasAnyLlmProvider(),
    features: llmFeatures,
    callsPerAssessment:
      Number(llmFeatures.personalityQuestions) +
      Number(llmFeatures.burnoutQuestions) +
      Number(llmFeatures.recommendations),
    stats: llmStats,
    gemini: {
      configured: isGeminiAvailable(),
      keyFormat: geminiKeyFormat(),
      model: getGeminiModel(),
      circuitOpen: isCircuitOpen(),
      stats: geminiStats,
    },
    ollama: {
      configured: isOllamaConfigured(),
      connected: ollamaConnected,
      model: ollamaModel(),
      baseUrl: isOllamaConfigured() ? process.env.OLLAMA_BASE_URL || 'http://localhost:11434' : null,
      stats: ollamaStats,
    },
    hints: [
      ...(isCircuitOpen() ? ['Gemini circuit open — Ollama will be used if available'] : []),
      ...(!hasAnyLlmProvider()
        ? ['No LLM available — question banks and static recommendations will be used']
        : []),
    ],
  };

  const supabaseStatus = {
    configured: isSupabaseConfigured(),
    connected: false,
    demographicsColumn: null,
    error: null,
  };

  if (supabaseStatus.configured) {
    try {
      const { error } = await supabase.from('sessions').select('id', { head: true, count: 'exact' });
      if (error) throw error;
      supabaseStatus.connected = true;

      const { error: demoErr } = await supabase
        .from('sessions')
        .select('demographics', { head: true, count: 'exact' });
      supabaseStatus.demographicsColumn = !demoErr;
      if (demoErr && /demographics/i.test(demoErr.message)) {
        supabaseStatus.hint = 'Run migration 007_session_demographics.sql in Supabase SQL Editor';
      }
    } catch (err) {
      supabaseStatus.error = err.message;
    }
  }

  const questionBank = await checkQuestionBankHealth();

  res.json({
    status: 'ok',
    env: { path: ENV_PATH, exists: ENV_EXISTS },
    llm,
    supabase: supabaseStatus,
    questionBank: { ...questionBank, role: 'fallback-only' },
  });
});

app.use('/api/assess', rateLimit, assessRouter);
app.use('/api/questions', rateLimit, questionsRouter);
app.use('/api/session', sessionRouter);
app.use('/api/history', historyRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Recharge API listening on http://localhost:${PORT}`);
});
