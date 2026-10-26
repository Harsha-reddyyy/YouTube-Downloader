import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter } from '@/server/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  it('allows requests within threshold', () => {
    const ip = '192.0.2.1';
    const first = rateLimiter.check(ip);
    expect(first.allowed).toBe(true);
    expect(first.status.remaining).toBeGreaterThan(0);
  });

  it('blocks requests after exceeding limit', () => {
    const ip = '192.0.2.2';
    // Exhaust limit (60 requests configured default)
    let lastResult = rateLimiter.check(ip);
    for (let i = 0; i < 70; i++) {
      lastResult = rateLimiter.check(ip);
    }

    expect(lastResult.allowed).toBe(false);
    expect(lastResult.status.remaining).toBe(0);
    expect(lastResult.status.resetSeconds).toBeGreaterThan(0);
  });

  it('maintains separate counters for different client IPs', () => {
    const ip1 = '192.0.2.10';
    const ip2 = '192.0.2.20';

    for (let i = 0; i < 70; i++) {
      rateLimiter.check(ip1);
    }

    // IP1 should be blocked
    expect(rateLimiter.check(ip1).allowed).toBe(false);

    // IP2 should still be allowed
    const res2 = rateLimiter.check(ip2);
    expect(res2.allowed).toBe(true);
  });
});
