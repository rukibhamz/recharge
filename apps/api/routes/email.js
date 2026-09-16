import { Router } from 'express';
import {
  validateResultsEmailPayload,
  validateNewsletterSubscribePayload,
  sanitizeEmailAddress,
} from '@recharge/shared/emailMarketing';
import { optionalAuth } from '../middleware/requireAuth.js';
import { emailSessionResults } from '../services/resultEmail.js';
import { upsertNewsletterSubscriber, unsubscribeNewsletter } from '../services/newsletter.js';

const router = Router();

/** Email a results summary + optional newsletter opt-in. */
router.post('/results', optionalAuth, async (req, res) => {
  const check = validateResultsEmailPayload(req.body ?? {});
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const result = await emailSessionResults({
      sessionId: check.value.sessionId,
      email: check.value.email,
      newsletterOptIn: check.value.newsletterOptIn,
      userId: req.user?.id ?? null,
    });
    res.json(result);
  } catch (err) {
    const status = err.status || (/not found/i.test(err.message) ? 404 : /SMTP|not configured/i.test(err.message) ? 503 : 500);
    console.error('Email results failed:', err.message);
    res.status(status).json({ error: err.message || 'Could not send results email.' });
  }
});

/** Standalone newsletter subscribe. */
router.post('/newsletter', optionalAuth, async (req, res) => {
  const check = validateNewsletterSubscribePayload(req.body ?? {});
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const row = await upsertNewsletterSubscriber({
      email: check.value.email,
      source: check.value.source,
      userId: req.user?.id ?? null,
    });
    res.status(201).json({ ok: true, id: row.id, status: row.status });
  } catch (err) {
    console.error('Newsletter subscribe failed:', err.message);
    res.status(503).json({ error: err.message || 'Could not subscribe.' });
  }
});

/** Soft unsubscribe (no auth — email must match). */
router.post('/newsletter/unsubscribe', async (req, res) => {
  const email = sanitizeEmailAddress(req.body?.email);
  if (!email) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  try {
    const row = await unsubscribeNewsletter(email);
    res.json({ ok: true, status: row?.status || 'unsubscribed' });
  } catch (err) {
    res.status(503).json({ error: err.message || 'Could not unsubscribe.' });
  }
});

export default router;
