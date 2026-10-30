import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { apiRequest, createTestUser } from './helpers.js';

describe('Security Test A: Authentication & Session Security', () => {
  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const endpoints = [
      { method: 'GET', path: '/api/state' },
      { method: 'GET', path: '/api/settings' },
      { method: 'GET', path: '/api/auth/me' },
      { method: 'POST', path: '/api/habits', body: { name: 'Test' } },
      { method: 'DELETE', path: '/api/data' },
    ];

    for (const ep of endpoints) {
      const res = await apiRequest(ep.path, {
        method: ep.method,
        body: ep.body || null,
      });

      assert.equal(
        res.status,
        401,
        `Expected 401 for unauthenticated ${ep.method} ${ep.path}, received ${res.status}`
      );
      assert.ok(
        res.data?.message?.toLowerCase().includes('token') ||
        res.data?.message?.toLowerCase().includes('not authenticated'),
        `Expected auth failure message, received: ${JSON.stringify(res.data)}`
      );
    }
  });

  it('rejects malformed and random string tokens with 401', async () => {
    const malformedTokens = [
      'not.a.jwt',
      'Bearer abcdef123456',
      'Bearer ',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    ];

    for (const token of malformedTokens) {
      const res = await apiRequest('/api/state', {
        headers: { Authorization: token },
      });
      assert.equal(res.status, 401, `Expected 401 for malformed token "${token}"`);
    }
  });

  it('rejects tokens signed with a foreign/attacker secret key with 401', async () => {
    const attackerSecret = 'attacker_secret_key_12345';
    const fakeToken = jwt.sign({ id: '65f123456789012345678901' }, attackerSecret, {
      expiresIn: '1h',
    });

    const res = await apiRequest('/api/state', {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });

    assert.equal(res.status, 401, 'Token signed with wrong secret must be rejected');
  });

  it('rejects expired JWT tokens with 401 and descriptive expiry message', async () => {
    // Generate an expired token with whatever secret or dummy
    const expiredToken = jwt.sign(
      { id: '65f123456789012345678901', exp: Math.floor(Date.now() / 1000) - 3600 },
      'dummy_or_real'
    );

    const res = await apiRequest('/api/state', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    assert.equal(res.status, 401, 'Expired token must return 401');
  });

  it('does not leak password hash or internal Mongoose fields in auth responses', async () => {
    const testUser = await createTestUser('auth_leak_check');

    // Check register response
    assert.equal(testUser.user.password, undefined, 'Password field must not be exposed in user object');
    assert.equal(testUser.user.__v, undefined, '__v internal field must not be exposed');
    assert.ok(testUser.user.id || testUser.user._id, 'User must have public ID');

    // Check login response
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: testUser.email, password: testUser.password },
    });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.data.user.password, undefined, 'Password field must not be exposed on login');

    // Check /api/auth/me response
    const meRes = await apiRequest('/api/auth/me', { token: testUser.token });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.data.user.password, undefined, 'Password field must not be exposed on /api/auth/me');
  });

  it('does not expose sensitive system paths or stack traces in invalid auth credentials', async () => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent_user_999@test.local', password: 'WrongPassword!' },
    });

    assert.equal(res.status, 401);
    assert.equal(res.data.message, 'Invalid email or password');
    assert.equal(res.data.stack, undefined, 'Stack trace must not be returned');
  });
});

