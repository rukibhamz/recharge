import { Router } from 'express';
import { getSharedSessionResponse } from '../services/sessions.js';

const router = Router();

router.get('/:shareToken', async (req, res) => {
  const { shareToken } = req.params;

  if (!shareToken || !/^[a-f0-9]{32}$/i.test(shareToken)) {
    return res.status(400).json({ error: 'Invalid share link.' });
  }

  const { data, error } = await getSharedSessionResponse(shareToken);

  if (error) {
    console.error('Session fetch error:', error.message);
    return res.status(500).json({ error: 'Could not load shared result.' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Share link not found or expired.' });
  }

  res.json({
    burnout: data.burnout,
    personality: data.personality,
    recommendations: data.recommendations,
    createdAt: data.createdAt,
  });
});

export default router;
