import {
  COACH_NAME,
  CRISIS_RESPONSE,
  detectsAdviceAcknowledgement,
  detectsCrisisLanguage,
  detectsOmaCloseSignal,
  OMA_OPENING,
  sanitizeOmaReply,
  omaWrapUpReply,
} from '@recharge/shared/coachPersona';
import { llmFeatures } from '../config/llm.js';
import { generateChat, hasAnyLlmProvider } from './llmProvider.js';
import { buildOmaSystemPrompt } from './coachContext.js';

const MAX_HISTORY = 20;

const FALLBACK_REPLY =
  "I'm here with you. I'm having trouble reaching my full coaching tools right now, but we can still keep it simple. What is one thing draining you most today, and what would a tiny recovery step look like in the next hour?";

export function getOmaOpening() {
  return OMA_OPENING;
}

export async function generateOmaReply({ session, history, userMessage }) {
  const trimmed = String(userMessage ?? '').trim();
  if (!trimmed) {
    return { reply: 'Take your time. What would you like to talk about?', source: 'validation' };
  }

  if (detectsCrisisLanguage(trimmed)) {
    return { reply: sanitizeOmaReply(CRISIS_RESPONSE), source: 'crisis' };
  }

  if (detectsOmaCloseSignal(trimmed)) {
    return { reply: sanitizeOmaReply(omaWrapUpReply()), source: 'wrap-up' };
  }

  if (!llmFeatures.coachChat || !(await hasAnyLlmProvider())) {
    return { reply: FALLBACK_REPLY, source: 'static' };
  }

  if (!session) {
    return {
      reply: `I'm ${COACH_NAME}. Once you save an assessment to your account, I can tailor our conversation to your profile. For now, what is weighing on you?`,
      source: 'no-session',
    };
  }

  const userTurnCount = history.filter((m) => m.role === 'user').length + 1;
  const adviceAcknowledged = detectsAdviceAcknowledgement(trimmed);
  const system = buildOmaSystemPrompt(session, { userTurnCount, adviceAcknowledged });
  const messages = [
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: String(m.content ?? '') })),
    { role: 'user', content: trimmed },
  ];

  try {
    const { text, provider } = await generateChat({ system, messages }, { source: 'coach' });
    return { reply: sanitizeOmaReply(text), source: provider ?? 'llm' };
  } catch (err) {
    console.error('[oma] chat failed:', err.message);
    return { reply: FALLBACK_REPLY, source: 'static' };
  }
}
