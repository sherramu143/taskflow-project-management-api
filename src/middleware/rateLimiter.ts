import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication requests, please try again after 1 minute',
    code: 'RATE_LIMIT_EXCEEDED',
    details: {},
  },
});
