import { Router } from 'express';
import { getSharedSessionResponse } from '../services/sessions.js';

const router = Router();

router.get('/:shareToken', async (req, res) => {
  const { shareToken } = req.params;

  if (!shareToken || !/^[a-f0-9]{32}$/i.test(shareToken)) {
    return res.status(400).json({ error: 'Invalid share link.' });
  }

  try {
    const { data, error } = await getSharedSessionResponse(shareToken);

    if (error) {
      console.error('Session fetch error:', error.message, error.code, error.details);
      return res.status(500).json({ error: 'Could not load shared result. Please try again later.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'This share link has expired or does not exist. Share links are valid for 24 hours.' });
    }

    res.json({
      burnout: data.burnout,
      personality: data.personality,
      recommendations: data.recommendations,
      createdAt: data.createdAt,
    });
  } catch (err) {
    console.error('Session route uncaught error:', err);
    res.status(500).json({ error: 'Could not load shared result. Please try again later.' });
  }
});

export default router;
