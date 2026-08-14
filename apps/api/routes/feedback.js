import { Router } from 'express';
import { validateFeedbackPayload } from '@recharge/shared/feedback';
import { optionalAuth } from '../middleware/requireAuth.js';
import { createFeedback } from '../services/feedback.js';

const router = Router();

router.post('/', optionalAuth, async (req, res) => {
  const check = validateFeedbackPayload(req.body ?? {});
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  const email = check.value.email || req.user?.email || '';
  const { data, error } = await createFeedback({
    userId: req.user?.id ?? null,
    email,
    category: check.value.category,
    rating: check.value.rating,
    message: check.value.message,
    page: check.value.page,
  });

  if (error) {
    console.error('Feedback submit failed:', error.message);
    return res.status(503).json({ error: error.message || 'Could not save feedback.' });
  }

  res.status(201).json({ ok: true, id: data.id });
});

export default router;
