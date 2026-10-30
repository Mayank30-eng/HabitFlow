import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, getHeaders, authenticateUser, randomString, getRandomPastDate } from './helpers.js';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
export const readLatency = new Trend('read_latency', true);
export const writeLatency = new Trend('write_latency', true);
export const errorRate = new Rate('api_error_rate');

// ─── Options & Stages ────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp-up to 50 VUs
    { duration: '8m', target: 50 },  // Steady state 50 VUs for 8 minutes
    { duration: '1m', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    // Ordinary read endpoints target
    'read_latency': ['p(50)<80', 'p(95)<200', 'p(99)<500'],
    // Write operations target (permits slightly higher allowance for Mongoose writes)
    'write_latency': ['p(50)<150', 'p(95)<300', 'p(99)<700'],
    // Overall HTTP latency percentiles
    'http_req_duration': ['p(50)<100', 'p(95)<200', 'p(99)<500'],
    // Error rate must stay under 1%
    'api_error_rate': ['rate<0.01'],
    'http_req_failed': ['rate<0.01'],
  },
};

const TEST_EMAIL = __ENV.TEST_USER_EMAIL || 'perf_baseline@example.com';
const TEST_PASSWORD = __ENV.TEST_USER_PASSWORD || 'Password123!';

export function setup() {
  const auth = authenticateUser(TEST_EMAIL, TEST_PASSWORD, 'Baseline User');
  if (!auth) {
    throw new Error(`Failed to authenticate setup user (${TEST_EMAIL}) against ${BASE_URL}`);
  }

  // Pre-seed 3 sample habits so read operations have data to fetch
  const headers = getHeaders(auth.token);
  const habitIds = [];

  for (let i = 0; i < 3; i++) {
    const res = http.post(`${BASE_URL}/api/habits`, JSON.stringify({
      name: `Baseline Habit ${i + 1}`,
      category: 'Health',
      type: i % 2 === 0 ? 'good' : 'bad',
      description: 'Pre-seeded for performance testing',
      frequency: 'daily',
      startDate: getRandomPastDate(14),
    }), { headers, tags: { name: 'Setup_Seed' } });

    if (res.status === 201) {
      const data = res.json();
      if (data.habit?.id) habitIds.push(data.habit.id);
    }
  }

  return { token: auth.token, habitIds };
}

export default function (data) {
  const headers = getHeaders(data.token);

  // 1. Read: Full Application State (Habits + Completion Logs + In-Memory Analytics)
  group('Read: GET /api/state', () => {
    const res = http.get(`${BASE_URL}/api/state`, {
      headers,
      tags: { name: 'GET_State' },
    });

    const isOk = check(res, {
      'state status is 200': (r) => r.status === 200,
      'state has habits array': (r) => {
        try {
          const body = r.json();
          return Array.isArray(body.habits);
        } catch {
          return false;
        }
      },
    });

    readLatency.add(res.timings.duration);
    errorRate.add(!isOk);
  });

  sleep(Math.random() * 0.8 + 0.2);

  // 2. Read: User Settings
  group('Read: GET /api/settings', () => {
    const res = http.get(`${BASE_URL}/api/settings`, {
      headers,
      tags: { name: 'GET_Settings' },
    });

    const isOk = check(res, {
      'settings status is 200': (r) => r.status === 200,
      'settings has theme': (r) => {
        try {
          return Boolean(r.json()?.theme);
        } catch {
          return false;
        }
      },
    });

    readLatency.add(res.timings.duration);
    errorRate.add(!isOk);
  });

  sleep(Math.random() * 0.8 + 0.2);

  // 3. Write: Toggle Habit Completion (Frequent daily user interaction)
  let targetHabitId = data.habitIds[0];
  if (targetHabitId) {
    group('Write: POST /api/habits/:id/toggle', () => {
      const res = http.post(
        `${BASE_URL}/api/habits/${targetHabitId}/toggle`,
        JSON.stringify({ date: getRandomPastDate(7) }),
        { headers, tags: { name: 'POST_Toggle' } }
      );

      const isOk = check(res, {
        'toggle status is 200': (r) => r.status === 200,
        'toggle returns state': (r) => {
          try {
            return Boolean(r.json()?.state);
          } catch {
            return false;
          }
        },
      });

      writeLatency.add(res.timings.duration);
      errorRate.add(!isOk);
    });
  }

  sleep(Math.random() * 1.0 + 0.5);

  // 4. Periodic Write: Create & Update Habit (Simulated 10% of iterations)
  if (__ITER % 10 === 0) {
    group('Write: POST /api/habits', () => {
      const createRes = http.post(
        `${BASE_URL}/api/habits`,
        JSON.stringify({
          name: randomString('habit'),
          category: 'Productivity',
          type: 'good',
          description: 'Dynamic load-test habit',
          frequency: 'daily',
          startDate: getRandomPastDate(3),
        }),
        { headers, tags: { name: 'POST_CreateHabit' } }
      );

      const isCreateOk = check(createRes, {
        'create habit status is 201': (r) => r.status === 201,
      });

      writeLatency.add(createRes.timings.duration);
      errorRate.add(!isCreateOk);

      if (isCreateOk) {
        const createdId = createRes.json()?.habit?.id;
        if (createdId) {
          // Update habit
          const updateRes = http.put(
            `${BASE_URL}/api/habits/${createdId}`,
            JSON.stringify({
              name: `Updated ${randomString()}`,
              description: 'Updated description under load',
            }),
            { headers, tags: { name: 'PUT_UpdateHabit' } }
          );

          const isUpdateOk = check(updateRes, {
            'update habit status is 200': (r) => r.status === 200,
          });

          writeLatency.add(updateRes.timings.duration);
          errorRate.add(!isUpdateOk);
        }
      }
    });
  }
}

export function handleSummary(data) {
  return {
    stdout: null,
    'baseline-summary.json': JSON.stringify(data, null, 2),
  };
}

