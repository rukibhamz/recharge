import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { deleteUserAccount, exportUserData } from '../services/account.js';

const router = Router();

router.use(requireAuth);

router.get('/export', async (req, res) => {
  const { data, error } = await exportUserData(req.user.id, req.user.email);

  if (error) {
    console.error('Account export error:', error.message);
    return res.status(500).json({ error: 'Could not export your data.' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="recharge-export-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  res.send(JSON.stringify(data, null, 2));
});

router.delete('/', async (req, res) => {
  const { deleted, error } = await deleteUserAccount(req.user.id);

  if (!deleted) {
    console.error('Account delete error:', error?.message);
    return res.status(500).json({ error: error?.message || 'Could not delete account.' });
  }

  res.json({ deleted: true });
});

export default router;
