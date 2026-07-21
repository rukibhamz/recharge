import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { isAdminConfigured, isAdminEmail } from '../config/admin.js';
import { getAdminStats } from '../services/adminStats.js';

const router = Router();

/** Lightweight check for nav — still requires a signed-in admin. */
router.get('/me', requireAdmin, (req, res) => {
  res.json({
    admin: true,
    email: req.user?.email ?? null,
    configured: isAdminConfigured(),
  });
});

router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    console.error('Admin stats failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not load admin stats.' });
  }
});

export default router;

/** Helper for tests / health — not mounted as a route. */
export function peekAdminAccess(email) {
  return isAdminConfigured() && isAdminEmail(email);
}
