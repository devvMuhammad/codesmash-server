import rateLimit from 'express-rate-limit';
import { submitCodeLimitConfig, runCodeLimitConfig } from '../config/rateLimiter';

/**
 * Rate limiter for code submission endpoint
 * 
 * Applies per-IP rate limiting to protect the code execution service.
 * Uses in-memory store by default, can be replaced with alternative storage.
 */
export const submitCodeLimiter = rateLimit({
  windowMs: submitCodeLimitConfig.windowMs,
  max: submitCodeLimitConfig.max,
  standardHeaders: submitCodeLimitConfig.standardHeaders,
  legacyHeaders: submitCodeLimitConfig.legacyHeaders,

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: submitCodeLimitConfig.message,
      retryAfter: Math.ceil(submitCodeLimitConfig.windowMs / 1000),
    });
  },

  // Skip successful requests that don't count toward limit (optional)
  skipSuccessfulRequests: false,

  // Skip failed requests that don't count toward limit (optional)
  skipFailedRequests: false,
});

/**
 * Rate limiter for code run/test endpoint
 * 
 * Applies per-IP rate limiting with more lenient limits for testing.
 * Uses in-memory store by default, can be replaced with alternative storage.
 */
export const runCodeLimiter = rateLimit({
  windowMs: runCodeLimitConfig.windowMs,
  max: runCodeLimitConfig.max,
  standardHeaders: runCodeLimitConfig.standardHeaders,
  legacyHeaders: runCodeLimitConfig.legacyHeaders,

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: runCodeLimitConfig.message,
      retryAfter: Math.ceil(runCodeLimitConfig.windowMs / 1000),
    });
  },

  // Skip successful requests that don't count toward limit (optional)
  skipSuccessfulRequests: false,

  // Skip failed requests that don't count toward limit (optional)
  skipFailedRequests: false,
});

