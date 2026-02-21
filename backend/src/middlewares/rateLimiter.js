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
    message = "Troppi tentativi. Riprova più tardi."
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
        error: message,
        retryAfter: retryAfter
      });
    }

    next();
  };
}

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Troppi tentativi di login. Riprova tra 15 minuti."
});

const impersonateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  message: "Troppi tentativi di impersonificazione. Riprova tra 15 minuti."
});

export {
  createRateLimiter,
  loginRateLimiter,
  impersonateRateLimiter
};
