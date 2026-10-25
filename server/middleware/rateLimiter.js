/**
 * In-memory sliding-window rate limiter for sensitive authentication endpoints.
 * Protects against credential stuffing and brute-force attacks.
 */

const tracker = new Map();

export const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 30, message = 'Too many requests, please try again later.' } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const entry = tracker.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count += 1;
    tracker.set(ip, entry);

    // Garbage collect expired entries periodically to prevent memory growth
    if (tracker.size > 2000) {
      for (const [key, val] of tracker.entries()) {
        if (now > val.resetTime) tracker.delete(key);
      }
    }

    if (entry.count > max) {
      const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Too many requests',
        message,
      });
    }

    next();
  };
};
