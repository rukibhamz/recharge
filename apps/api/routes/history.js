import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getSessionForUser,
  getSessionsForUser,
  linkSessionToUser,
} from '../services/sessions.js';

const router = Router();

router.use(requireAuth);

router.post('/link', async (req, res) => {
  const { sessionId } = req.body ?? {};

  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return res.status(400).json({ error: 'A valid session id is required.' });
  }

  const { linked, alreadyLinked, error } = await linkSessionToUser(
    req.user.id,
    sessionId,
    req.user.email,
  );

  if (!linked) {
    if (error?.message === 'Session not found') {
      return res.status(404).json({ error: 'Result not found.' });
    }
    console.error('Link session error:', error?.message);
    return res.status(500).json({ error: 'Could not save result to your account.' });
  }

  res.json({ linked: true, alreadyLinked: Boolean(alreadyLinked) });
});

router.get('/', async (req, res) => {
  const { data, error } = await getSessionsForUser(req.user.id);

  if (error) {
    console.error('History fetch error:', error.message);
    return res.status(500).json({ error: 'Could not load your history.' });
  }

  res.json({ sessions: data });
});

router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session id.' });
  }

  const { data, error } = await getSessionForUser(req.user.id, sessionId);

  if (error?.message === 'Session not found') {
    return res.status(404).json({ error: 'Result not found.' });
  }

  if (error) {
    console.error('Session fetch error:', error.message);
    return res.status(500).json({ error: 'Could not load this result.' });
  }

  res.json(data);
});

export default router;
