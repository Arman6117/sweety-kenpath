/**
 * Lightweight in-memory rate limiter middleware for sensitive endpoints
 * (e.g., registration and login) to prevent brute-force and credential stuffing.
 */

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 20; // 20 requests per window default
  const message = options.message || "Too many attempts from this IP. Please try again later.";

  // Store: Map<key, { count: number, resetTime: number }>
  const store = new Map();

  // Periodic cleanup of expired entries every 5 minutes (unref so process can exit cleanly)
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (interval.unref) {
    interval.unref();
  }

  const rateLimiter = (req, res, next) => {
    // Determine client identifier (IP address)
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || req.ip || "unknown-ip";

    const key = `${req.baseUrl || ""}:${ip}`;
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };

  rateLimiter.reset = () => {
    store.clear();
  };

  rateLimiter.getStoreSize = () => store.size;

  return rateLimiter;
}

// Default auth rate limiter instance
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 minutes
  message: "Too many authentication attempts. Please try again later."
});

module.exports = {
  createRateLimiter,
  authRateLimiter
};
