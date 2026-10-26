import { logError } from '@/lib/logger';
import { getRateLimitStore } from '@/lib/rate-limit-store';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const result = await getRateLimitStore().increment(key, windowMs);

    return {
      allowed: result.count <= limit,
      remaining: Math.max(0, limit - result.count),
      resetAt: result.resetAt
    };
  } catch (error) {
    logError('rate_limit.store_failed', error, {
      scope: key.split(':')[0]
    });

    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + windowMs
    };
  }
}
