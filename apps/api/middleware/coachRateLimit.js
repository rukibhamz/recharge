const WINDOW_MS = Number(process.env.COACH_RATE_LIMIT_WINDOW_MS) || 3_600_000;
const MAX_REQUESTS = Number(process.env.COACH_RATE_LIMIT_MAX) || 60;

const hits = new Map();

/** Softer limit for multi-turn Oma chat (default 60 / hour / IP). */
export function coachRateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${ip}:${req.user?.id || 'anon'}`;
  const now = Date.now();
  const entry = hits.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  hits.set(key, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many coach messages. Try again later.' });
  }

  next();
}
