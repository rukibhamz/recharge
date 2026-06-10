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
import { geminiFeatures, geminiKeyFormat, isGeminiAvailable } from './config/gemini.js';
import { geminiStats, getGeminiModel, isCircuitOpen } from './services/geminiClient.js';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import { checkQuestionBankHealth } from './services/questionBank.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  const gemini = {
    configured: isGeminiAvailable(),
    keyFormat: geminiKeyFormat(),
    model: getGeminiModel(),
    features: geminiFeatures,
    callsPerAssessment:
      Number(geminiFeatures.personalityQuestions) +
      Number(geminiFeatures.burnoutQuestions) +
      Number(geminiFeatures.recommendations),
    circuitOpen: isCircuitOpen(),
    stats: geminiStats,
    hints: isCircuitOpen()
      ? ['Quota cooldown active — wait 2 min; calls use fallback content until then']
      : getGeminiModel() === 'gemini-2.0-flash'
        ? ['gemini-2.0-flash free quota may be exhausted — use gemini-2.5-flash-lite in .env']
        : [],
  };

  const supabaseStatus = {
    configured: isSupabaseConfigured(),
    connected: false,
    error: null,
  };

  if (supabaseStatus.configured) {
    try {
      const { error } = await supabase.from('sessions').select('id', { head: true, count: 'exact' });
      if (error) throw error;
      supabaseStatus.connected = true;
    } catch (err) {
      supabaseStatus.error = err.message;
    }
  }

  const questionBank = await checkQuestionBankHealth();

  res.json({
    status: 'ok',
    env: { path: ENV_PATH, exists: ENV_EXISTS },
    gemini,
    supabase: supabaseStatus,
    questionBank,
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
