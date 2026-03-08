const rateLimitStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    maxRequests = 5,
    message = "Too many attempts. Try again later.",
    code = "RATE_LIMIT_EXCEEDED"
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set("Retry-After", retryAfter);
      return res.status(429).json({
        error: code,
        message: message,
        retryAfter: retryAfter
      });
    }

    next();
  };
}

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Too many login attempts. Try again in 15 minutes.",
  code: "RATE_LIMIT_LOGIN"
});

const impersonateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  message: "Too many impersonation attempts. Try again in 15 minutes.",
  code: "RATE_LIMIT_IMPERSONATE"
});

export {
  createRateLimiter,
  loginRateLimiter,
  impersonateRateLimiter
};
