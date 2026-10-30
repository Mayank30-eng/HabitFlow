import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, createTestUser, cleanupTestUser } from './helpers.js';

describe('Security Test B: Multi-Tenant Authorization & IDOR Resistance', () => {
  it('prevents User B from accessing, modifying, toggling, or deleting User A habits (IDOR)', async () => {
    // 1. Create two completely isolated test users
    const userA = await createTestUser('tenant_a');
    const userB = await createTestUser('tenant_b');

    try {
      // 2. User A creates a private habit
      const createRes = await apiRequest('/api/habits', {
        method: 'POST',
        token: userA.token,
        body: {
          name: "User A's Confidential Habit",
          category: 'Finance',
          type: 'good',
          frequency: 'daily',
          startDate: '2026-10-01',
        },
      });

      assert.equal(createRes.status, 201, 'User A should successfully create habit');
      const habitAId = createRes.data?.habit?.id;
      assert.ok(habitAId, 'Created habit should have an ID');

      // ── Attack 1: User B tries to read User A's habit via GET /api/state ──
      const stateBRes = await apiRequest('/api/state', { token: userB.token });
      assert.equal(stateBRes.status, 200);
      const habitsInB = stateBRes.data.habits || [];
      const foundInB = habitsInB.some((h) => h.id === habitAId || h.name === "User A's Confidential Habit");
      assert.equal(foundInB, false, "CRITICAL: User B must not see User A's habit in their state");

      // ── Attack 2: User B tries to update User A's habit via PUT /api/habits/:id ──
      const updateRes = await apiRequest(`/api/habits/${habitAId}`, {
        method: 'PUT',
        token: userB.token,
        body: {
          name: 'Hacked by User B',
          category: 'Compromised',
        },
      });

      assert.equal(
        updateRes.status,
        404,
        `Expected 404 Not Found when User B attempts to update User A's habit. Received: ${updateRes.status}`
      );

      // Verify User A's habit was NOT changed in database
      const verifyStateA1 = await apiRequest('/api/state', { token: userA.token });
      const habitAAfterUpdate = verifyStateA1.data.habits.find((h) => h.id === habitAId);
      assert.equal(habitAAfterUpdate?.name, "User A's Confidential Habit", "User A's habit name must remain untouched");

      // ── Attack 3: User B tries to toggle User A's habit via POST /api/habits/:id/toggle ──
      const toggleRes = await apiRequest(`/api/habits/${habitAId}/toggle`, {
        method: 'POST',
        token: userB.token,
        body: { date: '2026-10-30' },
      });

      assert.equal(
        toggleRes.status,
        404,
        `Expected 404 Not Found when User B attempts to toggle User A's habit. Received: ${toggleRes.status}`
      );

      // Verify User A's completion history was NOT modified
      const verifyStateA2 = await apiRequest('/api/state', { token: userA.token });
      const habitAAfterToggle = verifyStateA2.data.habits.find((h) => h.id === habitAId);
      const completionLog = habitAAfterToggle?.history?.find((entry) => entry.date === '2026-10-30');
      assert.equal(completionLog, undefined, "User A's completion history must not contain unauthorized entry");

      // ── Attack 4: User B tries to delete User A's habit via DELETE /api/habits/:id ──
      const deleteRes = await apiRequest(`/api/habits/${habitAId}`, {
        method: 'DELETE',
        token: userB.token,
      });

      assert.equal(
        deleteRes.status,
        404,
        `Expected 404 Not Found when User B attempts to delete User A's habit. Received: ${deleteRes.status}`
      );

      // Verify User A's habit still exists
      const verifyStateA3 = await apiRequest('/api/state', { token: userA.token });
      const habitAStillExists = verifyStateA3.data.habits.some((h) => h.id === habitAId);
      assert.equal(habitAStillExists, true, "User A's habit must still exist after unauthorized delete attempt");

    } finally {
      await cleanupTestUser(userA.token);
      await cleanupTestUser(userB.token);
    }
  });

  it('ensures user-supplied userId parameters cannot override trusted JWT context in settings', async () => {
    const userA = await createTestUser('settings_a');
    const userB = await createTestUser('settings_b');

    try {
      // User B tries to inject userA's userId in body when updating settings
      const settingsTamperRes = await apiRequest('/api/settings', {
        method: 'PUT',
        token: userB.token,
        body: {
          theme: 'dark',
          userId: userA.user.id, // malicious override attempt
        },
      });

      assert.equal(settingsTamperRes.status, 200);

      // Verify User A's settings were NOT altered
      const userASettings = await apiRequest('/api/settings', { token: userA.token });
      assert.notEqual(
        userASettings.data?.theme,
        'dark',
        "User A's settings must not be affected by User B's request"
      );
    } finally {
      await cleanupTestUser(userA.token);
      await cleanupTestUser(userB.token);
    }
  });
});

