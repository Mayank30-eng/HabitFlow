import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, getHeaders, authenticateUser, randomString } from './helpers.js';

// ─── Metrics ─────────────────────────────────────────────────────────────────
export const workflowDuration = new Trend('workflow_total_duration', true);
export const workflowSuccessRate = new Rate('workflow_completion_rate');
export const stepDurations = {
  login: new Trend('step_1_login_duration', true),
  fetchState1: new Trend('step_2_initial_state_duration', true),
  createHabit: new Trend('step_3_create_habit_duration', true),
  toggleHabit: new Trend('step_4_toggle_duration', true),
  fetchState2: new Trend('step_5_verify_state_duration', true),
  deleteHabit: new Trend('step_6_cleanup_duration', true),
};
export const failedSteps = new Counter('workflow_failed_steps');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp to 50 concurrent workflows
    { duration: '3m', target: 50 },   // Sustain 50 concurrent workflows
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'workflow_total_duration': ['p(95)<1500', 'p(99)<3000'],
    'workflow_completion_rate': ['rate>0.98'], // > 98% end-to-end success
    'step_3_create_habit_duration': ['p(95)<300'],
    'step_4_toggle_duration': ['p(95)<300'],
  },
};

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const userEmail = `workflow_vu_${vuId}@test.local`;
  const userPassword = 'TestPassword123!';
  const startTime = Date.now();

  let isSuccess = true;
  let authToken = null;
  let createdHabitId = null;
  const today = new Date().toISOString().split('T')[0];

  // ── Step 1: Authenticate User (Isolated per VU) ──────────────────────────
  group('1. Authenticate', () => {
    const authStart = Date.now();
    const auth = authenticateUser(userEmail, userPassword, `VU User ${vuId}`);
    stepDurations.login.add(Date.now() - authStart);

    if (!auth || !auth.token) {
      failedSteps.add(1);
      isSuccess = false;
      return;
    }
    authToken = auth.token;
  });

  if (!isSuccess || !authToken) {
    workflowSuccessRate.add(false);
    return;
  }

  const headers = getHeaders(authToken);

  // ── Step 2: Retrieve Initial State ──────────────────────────────────────
  group('2. Fetch Initial State', () => {
    const sStart = Date.now();
    const res = http.get(`${BASE_URL}/api/state`, {
      headers,
      tags: { name: 'WF_State_1' },
    });
    stepDurations.fetchState1.add(Date.now() - sStart);

    const ok = check(res, {
      'initial state returns 200': (r) => r.status === 200,
    });
    if (!ok) {
      failedSteps.add(1);
      isSuccess = false;
    }
  });

  if (!isSuccess) {
    workflowSuccessRate.add(false);
    return;
  }

  // ── Step 3: Create Habit ────────────────────────────────────────────────
  group('3. Create Habit', () => {
    const habitName = `WF Habit ${vuId}_${iterId}_${randomString()}`;
    const cStart = Date.now();
    const res = http.post(
      `${BASE_URL}/api/habits`,
      JSON.stringify({
        name: habitName,
        category: 'Focus',
        type: 'good',
        frequency: 'daily',
        startDate: today,
      }),
      { headers, tags: { name: 'WF_Create_Habit' } }
    );
    stepDurations.createHabit.add(Date.now() - cStart);

    const ok = check(res, {
      'habit created 201': (r) => r.status === 201,
      'response contains habit id': (r) => Boolean(r.json()?.habit?.id),
    });

    if (ok) {
      createdHabitId = res.json()?.habit?.id;
    } else {
      failedSteps.add(1);
      isSuccess = false;
    }
  });

  if (!isSuccess || !createdHabitId) {
    workflowSuccessRate.add(false);
    return;
  }

  // ── Step 4: Toggle Completion ───────────────────────────────────────────
  group('4. Toggle Completion', () => {
    const tStart = Date.now();
    const res = http.post(
      `${BASE_URL}/api/habits/${createdHabitId}/toggle`,
      JSON.stringify({ date: today }),
      { headers, tags: { name: 'WF_Toggle' } }
    );
    stepDurations.toggleHabit.add(Date.now() - tStart);

    const ok = check(res, {
      'toggle returns 200': (r) => r.status === 200,
    });

    if (!ok) {
      failedSteps.add(1);
      isSuccess = false;
    }
  });

  if (!isSuccess) {
    workflowSuccessRate.add(false);
    return;
  }

  // ── Step 5: Verify Updated State Consistency ────────────────────────────
  group('5. Verify State Consistency', () => {
    const vStart = Date.now();
    const res = http.get(`${BASE_URL}/api/state?days=7`, {
      headers,
      tags: { name: 'WF_State_Verify' },
    });
    stepDurations.fetchState2.add(Date.now() - vStart);

    const ok = check(res, {
      'verify state returns 200': (r) => r.status === 200,
      'state contains created habit': (r) => {
        try {
          const habits = r.json()?.habits || [];
          const found = habits.find((h) => h.id === createdHabitId);
          if (!found) return false;
          // Verify completion history includes today
          const historyEntry = found.history?.find((entry) => entry.date === today);
          return Boolean(historyEntry?.completed);
        } catch {
          return false;
        }
      },
    });

    if (!ok) {
      failedSteps.add(1);
      isSuccess = false;
    }
  });

  // ── Step 6: Safe Cleanup ────────────────────────────────────────────────
  group('6. Cleanup Test Habit', () => {
    const dStart = Date.now();
    const res = http.del(`${BASE_URL}/api/habits/${createdHabitId}`, null, {
      headers,
      tags: { name: 'WF_Delete_Habit' },
    });
    stepDurations.deleteHabit.add(Date.now() - dStart);

    check(res, {
      'cleanup habit deleted 200': (r) => r.status === 200,
    });
  });

  const totalTime = Date.now() - startTime;
  workflowDuration.add(totalTime);
  workflowSuccessRate.add(isSuccess);

  sleep(Math.random() * 1.5 + 0.5);
}

export function handleSummary(data) {
  return {
    stdout: null,
    'workflow-summary.json': JSON.stringify(data, null, 2),
  };
}

