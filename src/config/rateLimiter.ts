/**
 * Rate limiter configuration for code execution endpoints
 * 
 * Centralized configuration for all rate limiting settings.
 * This structure allows easy migration to alternative storage backends in the future.
 */

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

/**
 * Rate limit configuration for code submission endpoint
 * Limits: 10 requests per minute per IP
 */
export const submitCodeLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many code submissions from this IP, please try again after a minute.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

/**
 * Rate limit configuration for code run/test endpoint
 * Limits: 20 requests per minute per IP (more lenient for testing)
 */
export const runCodeLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many code test runs from this IP, please try again after a minute.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

