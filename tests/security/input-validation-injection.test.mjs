import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, createTestUser, cleanupTestUser } from './helpers.js';

describe('Security Test C: Input Validation & Injection Resistance', () => {
  it('rejects NoSQL injection operators ($ne, $gt) in auth endpoints without crashing', async () => {
    // Attempt NoSQL injection in login
    const noSqlPayloads = [
      { email: { $ne: null }, password: { $ne: null } },
      { email: { $gt: '' }, password: 'password123' },
      { email: 'admin@test.local', password: { $regex: '.*' } },
    ];

    for (const body of noSqlPayloads) {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body,
      });

      // The server must reject non-string inputs cleanly with 400, not 500
      assert.equal(
        res.status,
        400,
        `Expected 400 validation error for NoSQL injection payload, received: ${res.status}`
      );
      assert.notEqual(res.status, 500, 'Server must not trigger 500 internal server error on injection payloads');
    }
  });

  it('rejects missing or empty required habit fields with 400', async () => {
    const user = await createTestUser('input_val');

    try {
      const invalidHabits = [
        {}, // Empty body
        { name: '' }, // Empty name
        { name: '   ', category: 'Health' }, // Whitespace name
        { name: 'Habit', category: '' }, // Empty category
        { name: 'Habit', category: 'Health', type: 'invalid_type' }, // Invalid enum
        { name: 'Habit', category: 'Health', type: 'good', frequency: 'unknown' }, // Invalid frequency
        { name: 'Habit', category: 'Health', type: 'good', customDays: [-1, 7, 10] }, // Out-of-bounds days
        { name: 'Habit', category: 'Health', type: 'good', startDate: 'not-a-date' }, // Invalid date
      ];

      for (const payload of invalidHabits) {
        const res = await apiRequest('/api/habits', {
          method: 'POST',
          token: user.token,
          body: payload,
        });

        assert.equal(
          res.status,
          400,
          `Expected 400 Bad Request for invalid payload ${JSON.stringify(payload)}, received: ${res.status}`
        );
        assert.ok(
          res.data?.error === 'Validation failed' || res.data?.message,
          'Response should contain validation error message'
        );
      }
    } finally {
      await cleanupTestUser(user.token);
    }
  });

  it('handles malformed JSON syntax gracefully with 400, not 500', async () => {
    const user = await createTestUser('malformed_json');

    try {
      const res = await apiRequest('/api/habits', {
        method: 'POST',
        token: user.token,
        body: '{"name": "broken json", category: ', // deliberately malformed
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(
        res.status,
        400,
        `Expected 400 for malformed JSON, received ${res.status}`
      );
    } finally {
      await cleanupTestUser(user.token);
    }
  });

  it('handles excessively long strings without crashing or buffer overflows', async () => {
    const user = await createTestUser('long_string');

    try {
      const hugeString = 'A'.repeat(50000); // 50KB string
      const res = await apiRequest('/api/habits', {
        method: 'POST',
        token: user.token,
        body: {
          name: hugeString,
          category: 'Health',
          type: 'good',
          startDate: '2026-10-30',
        },
      });

      // The server should either accept (and store sanitized string) or reject with 400, but NEVER crash or 500
      assert.notEqual(res.status, 500, 'Excessively large string must not crash the server');
    } finally {
      await cleanupTestUser(user.token);
    }
  });

  it('rejects path traversal or malformed MongoDB IDs in route parameters cleanly', async () => {
    const user = await createTestUser('path_traversal');

    try {
      const badIds = [
        '..%2F..%2Fetc%2Fpasswd',
        'undefined',
        'null',
        'false',
        '12345',
        '000000000000000000000000',
      ];

      for (const id of badIds) {
        const res = await apiRequest(`/api/habits/${id}`, {
          method: 'PUT',
          token: user.token,
          body: { name: 'Valid Name' },
        });

        // Should return 404 (or 400), but never 500
        assert.ok(
          res.status === 404 || res.status === 400,
          `Expected 404/400 for malformed ID "${id}", received: ${res.status}`
        );
      }
    } finally {
      await cleanupTestUser(user.token);
    }
  });
});

