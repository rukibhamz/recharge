import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { isAdminConfigured, isAdminEmail } from '../config/admin.js';

async function resolveUser(token) {
  if (!isSupabaseConfigured() || !token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const user = await resolveUser(header.slice(7));
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  if (!isAdminConfigured()) {
    return res.status(503).json({
      error: 'Admin access is not configured. Set ADMIN_EMAILS on the API host.',
    });
  }

  if (!isAdminEmail(user.email)) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  req.user = user;
  next();
}
