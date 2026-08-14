import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { isAdminConfigured, isAdminEmail } from '../config/admin.js';
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
import { getLlmMonitorSnapshot, probeConnectorAvailability } from '../services/llmMonitor.js';
import { LLM_PROVIDERS } from '@recharge/shared/llmConnectors';
import { getCoachSettings, updateCoachSettings } from '../services/coachSettings.js';
import { listFeedback, updateFeedback, countNewFeedback } from '../services/feedback.js';
import { FEEDBACK_STATUSES } from '@recharge/shared/feedback';

const router = Router();

/** Any signed-in user can probe admin status; no secrets returned. */
router.get('/me', requireAuth, (req, res) => {
  const configured = isAdminConfigured();
  const admin = configured && isAdminEmail(req.user?.email);
  res.json({
    admin,
    configured,
    email: req.user?.email ?? null,
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

router.get('/coach-settings', requireAdmin, async (_req, res) => {
  try {
    const settings = await getCoachSettings();
    res.json({ settings });
  } catch (err) {
    console.error('Coach settings load failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not load coach settings.' });
  }
});

router.put('/coach-settings', requireAdmin, async (req, res) => {
  try {
    const settings = await updateCoachSettings(req.body ?? {});
    res.json({ settings });
  } catch (err) {
    const status = /required|invalid/i.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message || 'Could not update coach settings.' });
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

router.get('/llm-monitor', requireAdmin, async (_req, res) => {
  try {
    const monitor = await getLlmMonitorSnapshot();
    res.json(monitor);
  } catch (err) {
    console.error('LLM monitor failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not load LLM monitor.' });
  }
});

router.post('/llm-monitor/probe', requireAdmin, async (_req, res) => {
  try {
    const probe = await probeConnectorAvailability((c) =>
      testConnectorRuntime(c, { source: 'probe' }),
    );
    const monitor = await getLlmMonitorSnapshot();
    res.json({ ...probe, monitor });
  } catch (err) {
    console.error('LLM probe failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not probe connectors.' });
  }
});

router.get('/feedback', requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || 'all').toLowerCase();
    const { data, error } = await listFeedback({ status });
    if (error) throw error;
    const unread = await countNewFeedback();
    res.json({ submissions: data, unread });
  } catch (err) {
    console.error('Admin feedback list failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not load feedback.' });
  }
});

router.patch('/feedback/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid feedback id.' });
  }
  const status = req.body?.status ? String(req.body.status).toLowerCase() : undefined;
  if (status && !FEEDBACK_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const { data, error } = await updateFeedback(id, {
      status,
      adminNote: req.body?.adminNote,
    });
    if (error) throw error;
    res.json({ submission: data });
  } catch (err) {
    console.error('Admin feedback update failed:', err.message);
    res.status(500).json({ error: err.message || 'Could not update feedback.' });
  }
});

export default router;
