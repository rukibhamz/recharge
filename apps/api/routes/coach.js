import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { coachRateLimit } from '../middleware/coachRateLimit.js';
import {
  getCoachStatus,
  sendCoachMessage,
  startCoachConversation,
} from '../services/coachConversations.js';

const router = Router();

router.use(requireAuth);
router.use(coachRateLimit);

router.get('/status', async (req, res) => {
  const { data, error } = await getCoachStatus(req.user.id, req.user.email);
  if (error) {
    if (/coach_conversations|coach_messages|42P01/i.test(error.message)) {
      return res.status(503).json({
        error: 'Coach chat is not set up yet. Run migration 015_coach_chat.sql in Supabase.',
      });
    }
    console.error('Coach status error:', error.message);
    return res.status(500).json({ error: 'Could not load coach chat.' });
  }
  res.json(data);
});

router.post('/conversations', async (req, res) => {
  const sessionId = req.body?.sessionId ?? null;
  if (sessionId && !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return res.status(400).json({ error: 'A valid assessment session id is required.' });
  }

  const { data, error } = await startCoachConversation(req.user.id, req.user.email, sessionId);
  if (error) {
    if (/Save an assessment/i.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    if (/coach_conversations|coach_messages|42P01/i.test(error.message)) {
      return res.status(503).json({
        error: 'Coach chat is not set up yet. Run migration 015_coach_chat.sql in Supabase.',
      });
    }
    console.error('Coach start error:', error.message);
    return res.status(500).json({ error: 'Could not start a chat with Oma.' });
  }
  res.status(201).json(data);
});

router.post('/conversations/:id/messages', async (req, res) => {
  const { id } = req.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid conversation id.' });
  }

  const content = req.body?.content;
  const { data, error } = await sendCoachMessage(req.user.id, req.user.email, id, content);
  if (error) {
    if (/Conversation not found/i.test(error.message)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    if (/Message must be/i.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    if (/coach_conversations|coach_messages|42P01/i.test(error.message)) {
      return res.status(503).json({
        error: 'Coach chat is not set up yet. Run migration 015_coach_chat.sql in Supabase.',
      });
    }
    console.error('Coach message error:', error.message);
    return res.status(500).json({ error: 'Oma could not reply right now.' });
  }
  res.json(data);
});

export default router;
