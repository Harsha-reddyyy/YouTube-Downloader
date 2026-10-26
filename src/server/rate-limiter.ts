import { RateLimitStatus } from '@/lib/types';
import { getServerConfig } from './config';

interface RateLimitEntry {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private hits: Map<string, RateLimitEntry> = new Map();
  private lastCleanup: number = Date.now();

  /**
   * Check rate limit for an identifier (e.g. client IP)
   */
  public check(ip: string): { allowed: boolean; status: RateLimitStatus } {
    const config = getServerConfig();
    const now = Date.now();
    const windowStart = now - config.rateLimitWindowMs;

    this.maybeCleanup(now, config.rateLimitWindowMs);

    let entry = this.hits.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      this.hits.set(ip, entry);
    }

    // Filter out timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const limit = config.rateLimitMaxRequests;
    const count = entry.timestamps.length;

    if (count >= limit) {
      const oldest = entry.timestamps[0] || now;
      const resetSeconds = Math.max(1, Math.ceil((oldest + config.rateLimitWindowMs - now) / 1000));
      return {
        allowed: false,
        status: {
          limit,
          remaining: 0,
          resetSeconds,
        },
      };
    }

    // Record this request
    entry.timestamps.push(now);

    const remaining = Math.max(0, limit - entry.timestamps.length);
    const resetSeconds = Math.ceil(config.rateLimitWindowMs / 1000);

    return {
      allowed: true,
      status: {
        limit,
        remaining,
        resetSeconds,
      },
    };
  }

  /**
   * Periodically cleans up stale entries to prevent memory leaks
   */
  private maybeCleanup(now: number, windowMs: number) {
    if (now - this.lastCleanup < 60000) return; // once per minute
    this.lastCleanup = now;
    const windowStart = now - windowMs;

    for (const [ip, entry] of this.hits.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
      if (entry.timestamps.length === 0) {
        this.hits.delete(ip);
      }
    }
  }

  /**
   * Reset hits for testing
   */
  public reset() {
    this.hits.clear();
  }
}

export const rateLimiter = new InMemoryRateLimiter();
