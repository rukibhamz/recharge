import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { isAdminConfigured } from '../config/admin.js';
import { getAdminStats } from '../services/adminStats.js';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace,
} from '../services/workspaces.js';
import {
  createConnector,
  deleteConnector,
  getConnectorSecret,
  listConnectors,
  updateConnector,
} from '../services/connectors.js';
import { testConnectorRuntime } from '../services/llmProvider.js';
import { LLM_PROVIDERS } from '@recharge/shared/llmConnectors';

const router = Router();

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

router.get('/workspaces', requireAdmin, async (_req, res) => {
  try {
    const workspaces = await listWorkspaces();
    res.json({ workspaces });
  } catch (err) {
    console.error('List workspaces failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not load workspaces.' });
  }
});

router.get('/workspaces/:id', requireAdmin, async (req, res) => {
  try {
    const workspace = await getWorkspace(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });
    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not load workspace.' });
  }
});

router.post('/workspaces', requireAdmin, async (req, res) => {
  try {
    const workspace = await createWorkspace(req.body, req.user?.id ?? null);
    res.status(201).json({ workspace });
  } catch (err) {
    const status = /required|Invalid|already in use/i.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message || 'Could not create workspace.' });
  }
});

router.patch('/workspaces/:id', requireAdmin, async (req, res) => {
  try {
    const workspace = await updateWorkspace(req.params.id, req.body);
    res.json({ workspace });
  } catch (err) {
    const status = /required|Invalid|already in use|not found/i.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message || 'Could not update workspace.' });
  }
});

router.delete('/workspaces/:id', requireAdmin, async (req, res) => {
  try {
    await deleteWorkspace(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not delete workspace.' });
  }
});

router.get('/connectors/catalog', requireAdmin, (_req, res) => {
  res.json({ providers: LLM_PROVIDERS });
});

router.get('/connectors', requireAdmin, async (_req, res) => {
  try {
    const connectors = await listConnectors();
    res.json({ connectors, providers: LLM_PROVIDERS });
  } catch (err) {
    console.error('List connectors failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not load connectors.' });
  }
});

router.post('/connectors', requireAdmin, async (req, res) => {
  try {
    const connector = await createConnector(req.body);
    res.status(201).json({ connector });
  } catch (err) {
    const status = /required|Invalid/i.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message || 'Could not create connector.' });
  }
});

router.patch('/connectors/:id', requireAdmin, async (req, res) => {
  try {
    const connector = await updateConnector(req.params.id, req.body);
    res.json({ connector });
  } catch (err) {
    const status = /required|Invalid|not found/i.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message || 'Could not update connector.' });
  }
});

router.delete('/connectors/:id', requireAdmin, async (req, res) => {
  try {
    await deleteConnector(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not delete connector.' });
  }
});

router.post('/connectors/:id/test', requireAdmin, async (req, res) => {
  try {
    const connector = await getConnectorSecret(req.params.id);
    if (!connector) return res.status(404).json({ error: 'Connector not found.' });
    const result = await testConnectorRuntime(connector);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message || 'Connector test failed.', ok: false });
  }
});

export default router;
