import { Router } from 'express';
import { resolveWorkspaceByHost } from '../services/workspaces.js';

const router = Router();

/** Public: resolve white-label branding by Host header or ?host= */
router.get('/resolve', async (req, res) => {
  try {
    const host =
      req.query.host ||
      req.get('x-forwarded-host')?.split(',')[0]?.trim() ||
      req.get('host');
    const workspace = await resolveWorkspaceByHost(host);
    if (!workspace) {
      return res.json({ workspace: null });
    }
    res.json({
      workspace: {
        id: workspace.id,
        slug: workspace.slug,
        brandName: workspace.brandName,
        customDomain: workspace.customDomain,
        primaryColor: workspace.primaryColor,
        logoUrl: workspace.logoUrl,
        content: workspace.content,
      },
    });
  } catch (err) {
    console.error('Tenant resolve failed:', err.message);
    res.status(500).json({ error: 'Could not resolve workspace.' });
  }
});

export default router;
