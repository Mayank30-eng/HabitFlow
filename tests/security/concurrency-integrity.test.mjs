import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, createTestUser, cleanupTestUser } from './helpers.js';

describe('Security Test F: Concurrency & Race Condition Integrity', () => {
  it('analyzes concurrent habit completion toggles for race conditions and data corruption', async () => {
    const user = await createTestUser('race_test');
    const today = '2026-10-30';

    try {
      // 1. Create a habit
      const createRes = await apiRequest('/api/habits', {
        method: 'POST',
        token: user.token,
        body: {
          name: 'Race Condition Habit',
          category: 'Integrity',
          type: 'good',
          frequency: 'daily',
          startDate: today,
        },
      });

      assert.equal(createRes.status, 201);
      const habitId = createRes.data.habit.id;

      // 2. Dispatch 10 simultaneous toggle requests for the EXACT SAME date
      const concurrentRequests = 10;
      const togglePromises = Array.from({ length: concurrentRequests }, () =>
        apiRequest(`/api/habits/${habitId}/toggle`, {
          method: 'POST',
          token: user.token,
          body: { date: today },
        })
      );

      const results = await Promise.all(togglePromises);
      const statuses = results.map((r) => r.status);
      const count200 = statuses.filter((s) => s === 200).length;
      const count500 = statuses.filter((s) => s === 500).length;
      const count400 = statuses.filter((s) => s === 400).length;

      console.log(`[CONCURRENCY AUDIT] 10 parallel toggles: ${count200}x 200 OK, ${count500}x 500 Server Error, ${count400}x 400 Bad Request`);

      // 3. Inspect the final database state
      const stateRes = await apiRequest('/api/state', { token: user.token });
      assert.equal(stateRes.status, 200);

      const habit = stateRes.data.habits.find((h) => h.id === habitId);
      assert.ok(habit, 'Habit must exist in final state');

      // 4. Verify that the unique index prevented duplicate history logs for the same date
      const historyOnDate = (habit.history || []).filter((e) => e.date === today);

      // Key assertion: Unique compound index on { userId, habitAppId, date } prevents duplicate records
      assert.ok(
        historyOnDate.length <= 1,
        `Integrity violation: Found ${historyOnDate.length} duplicate logs for date ${today}`
      );

      // Document whether unhandled E11000 caused 500 errors (finding for security report)
      if (count500 > 0) {
        console.warn(
          `[FINDING CONFIRMED] Concurrency race condition detected: ${count500} requests received HTTP 500 due to unhandled Mongo duplicate key collision`
        );
      }
    } finally {
      await cleanupTestUser(user.token);
    }
  });

  it('verifies concurrent habit updates do not result in corrupted habit properties', async () => {
    const user = await createTestUser('update_race');

    try {
      const createRes = await apiRequest('/api/habits', {
        method: 'POST',
        token: user.token,
        body: {
          name: 'Original Habit',
          category: 'Work',
          type: 'good',
          startDate: '2026-10-30',
        },
      });

      const habitId = createRes.data.habit.id;

      // Dispatch 5 parallel updates modifying different fields
      const updatePromises = [
        apiRequest(`/api/habits/${habitId}`, { method: 'PUT', token: user.token, body: { name: 'Update A' } }),
        apiRequest(`/api/habits/${habitId}`, { method: 'PUT', token: user.token, body: { name: 'Update B' } }),
        apiRequest(`/api/habits/${habitId}`, { method: 'PUT', token: user.token, body: { name: 'Update C' } }),
        apiRequest(`/api/habits/${habitId}`, { method: 'PUT', token: user.token, body: { category: 'Focus' } }),
      ];

      const responses = await Promise.all(updatePromises);
      for (const res of responses) {
        assert.equal(res.status, 200, `Expected 200 for update, received: ${res.status}`);
      }

      // Final state must be a valid, consistent object
      const stateRes = await apiRequest('/api/state', { token: user.token });
      const finalHabit = stateRes.data.habits.find((h) => h.id === habitId);
      assert.ok(['Update A', 'Update B', 'Update C'].includes(finalHabit.name));
      assert.ok(typeof finalHabit.order === 'number');
    } finally {
      await cleanupTestUser(user.token);
    }
  });
});

