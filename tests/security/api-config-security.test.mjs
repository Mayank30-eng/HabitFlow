import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, createTestUser, cleanupTestUser } from './helpers.js';

describe('Security Test E: API & Server Configuration Hardening', () => {
  it('enforces expected baseline HTTP security headers', async () => {
    const res = await apiRequest('/api/health');

    // 1. Verify X-Powered-By is suppressed
    const poweredBy = res.headers.get('x-powered-by');
    assert.equal(
      poweredBy,
      null,
      'X-Powered-By header must be disabled to avoid technology disclosure'
    );

    // 2. Verify MIME sniffing protection
    assert.equal(
      res.headers.get('x-content-type-options'),
      'nosniff',
      'X-Content-Type-Options must be set to nosniff'
    );

    // 3. Verify Clickjacking protection
    assert.equal(
      res.headers.get('x-frame-options'),
      'SAMEORIGIN',
      'X-Frame-Options must be SAMEORIGIN or DENY'
    );

    // 4. Verify Referrer policy
    assert.equal(
      res.headers.get('referrer-policy'),
      'strict-origin-when-cross-origin',
      'Referrer-Policy must be strict-origin-when-cross-origin'
    );
  });

  it('enforces request body size limit of 1MB with HTTP 413 Payload Too Large', async () => {
    const user = await createTestUser('payload_limit');

    try {
      // Construct a payload slightly exceeding the 1MB express.json limit (1.2 MB)
      const oversizedPayload = JSON.stringify({
        name: 'Oversized Habit',
        description: 'X'.repeat(1.2 * 1024 * 1024),
      });

      const res = await apiRequest('/api/habits', {
        method: 'POST',
        token: user.token,
        body: oversizedPayload,
      });

      assert.equal(
        res.status,
        413,
        `Expected HTTP 413 Payload Too Large for 1.2MB payload, received: ${res.status}`
      );
    } finally {
      await cleanupTestUser(user.token);
    }
  });

  it('verifies that unhandled routes return 404 or index HTML without leaking stack traces', async () => {
    const res = await apiRequest('/api/non_existent_endpoint_xyz_123');

    assert.ok(
      res.status === 404 || res.status === 401,
      `Expected 404/401 for non-existent API route, got: ${res.status}`
    );
    assert.equal(
      res.data?.stack,
      undefined,
      'Stack trace must not be leaked in API response'
    );
  });
});

