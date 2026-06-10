import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

async function resolveUser(token) {
  if (!isSupabaseConfigured() || !token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const user = await resolveUser(header.slice(7));
    if (user) req.user = user;
  }
  next();
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const user = await resolveUser(header.slice(7));
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  req.user = user;
  next();
}
