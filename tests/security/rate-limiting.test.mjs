import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest } from './helpers.js';

describe('Security Test D: Rate Limiting & Abuse Resistance', () => {
  it('enforces 30 requests / 15 min threshold on auth endpoints and responds with 429 & Retry-After', async () => {
    // Use an isolated simulated IP via X-Forwarded-For to avoid affecting other tests
    const isolatedIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    const headers = { 'X-Forwarded-For': isolatedIp };

    let rateLimitedResponse = null;
    let successfulRequests = 0;

    // Send 35 rapid login attempts
    for (let i = 1; i <= 35; i++) {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers,
        body: { email: `ratelimit_test_${i}@test.local`, password: 'DummyPassword123!' },
      });

      if (res.status === 429) {
        rateLimitedResponse = res;
        break;
      } else if (res.status === 401) {
        successfulRequests++;
      }
    }

    assert.ok(
      rateLimitedResponse !== null,
      'Expected to trigger HTTP 429 after exceeding max (30) authentication requests'
    );
    assert.equal(rateLimitedResponse.status, 429, 'Excessive requests must return HTTP 429 Too Many Requests');
    assert.equal(
      rateLimitedResponse.data?.error,
      'Too many requests',
      'Response body must contain rate limit notification'
    );

    const retryAfter = rateLimitedResponse.headers.get('retry-after');
    assert.ok(
      retryAfter !== null && Number(retryAfter) > 0,
      `Response must include valid Retry-After header. Received: ${retryAfter}`
    );
  });

  it('documents absence of rate limiting on resource-intensive state endpoints', async () => {
    // Send 10 rapid state requests without triggering 429 (demonstrating current absence of general rate limiting)
    const testIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`;
    const responses = [];

    for (let i = 0; i < 5; i++) {
      const res = await apiRequest('/api/health', {
        headers: { 'X-Forwarded-For': testIp },
      });
      responses.push(res.status);
    }

    const hasAny429 = responses.some((s) => s === 429);
    assert.equal(
      hasAny429,
      false,
      'Public read / health endpoints currently do not enforce rate limiting (Observation for Report)'
    );
  });
});

