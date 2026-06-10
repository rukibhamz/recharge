const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 3_600_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10;

const hits = new Map();

export function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  hits.set(ip, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  next();
}
