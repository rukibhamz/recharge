import { Router } from 'express';
import { formatMbtiType } from '@recharge/shared/mbtiScoring';
import { getSessionByShareToken } from '../services/sessions.js';
import { getMbtiTypeProfile } from '../services/questionBank.js';

const router = Router();

router.get('/:shareToken', async (req, res) => {
  const { shareToken } = req.params;

  if (!shareToken || !/^[a-f0-9]{32}$/i.test(shareToken)) {
    return res.status(400).json({ error: 'Invalid share link.' });
  }

  const { data, error } = await getSessionByShareToken(shareToken);

  if (error) {
    console.error('Session fetch error:', error.message);
    return res.status(500).json({ error: 'Could not load shared result.' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Share link not found or expired.' });
  }

  const typeCode = String(data.personality_type ?? '').toUpperCase();
  let type = {
    id: data.personality_type,
    name: data.personality_name,
    desc: '',
    icon: '✨',
  };

  if (typeCode) {
    try {
      const profile = await getMbtiTypeProfile(typeCode);
      if (profile) type = formatMbtiType(profile);
    } catch (err) {
      console.error('MBTI profile lookup failed:', err.message);
    }
  }

  res.json({
    burnout: {
      level: data.burnout_level,
      cls: data.burnout_cls,
    },
    personality: {
      type,
      traits: data.traits,
    },
    recommendations: data.recommendations,
    createdAt: data.created_at,
  });
});

export default router;
