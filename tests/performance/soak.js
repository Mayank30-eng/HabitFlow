import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, getHeaders, authenticateUser, getRandomPastDate } from './helpers.js';

// ─── Guard Flag ──────────────────────────────────────────────────────────────
// The 4-hour soak test MUST be explicitly enabled via RUN_SOAK_TEST=true
const IS_SOAK_ENABLED = (__ENV.RUN_SOAK_TEST || '').toLowerCase() === 'true';

if (!IS_SOAK_ENABLED) {
  console.log(
    'ℹ️  Soak test is disabled by default. Set RUN_SOAK_TEST=true to execute the 4-hour test.'
  );
}

export const soakLatency = new Trend('soak_latency', true);
export const soakErrorRate = new Rate('soak_error_rate');

export const options = {
  // If not enabled, run a 10s smoke pass instead of 4 hours
  stages: IS_SOAK_ENABLED
    ? [
        { duration: '15m', target: 75 },   // Ramp up to 75 VUs
        { duration: '3h30m', target: 75 }, // Sustain 75 VUs for 3.5 hours
        { duration: '15m', target: 0 },    // Ramp down
      ]
    : [{ duration: '5s', target: 1 }],

  thresholds: {
    'soak_latency': ['p(95)<300', 'p(99)<700'],
    'soak_error_rate': ['rate<0.01'],
    'http_req_failed': ['rate<0.01'],
  },
};

const TEST_EMAIL = __ENV.TEST_USER_EMAIL || 'perf_soak@example.com';
const TEST_PASSWORD = __ENV.TEST_USER_PASSWORD || 'Password123!';

export function setup() {
  if (!IS_SOAK_ENABLED) {
    return { token: null, habitId: null };
  }

  const auth = authenticateUser(TEST_EMAIL, TEST_PASSWORD, 'Soak User');
  if (!auth) {
    throw new Error(`Failed to authenticate soak user against ${BASE_URL}`);
  }

  const headers = getHeaders(auth.token);
  const res = http.post(`${BASE_URL}/api/habits`, JSON.stringify({
    name: 'Endurance Habit',
    category: 'Endurance',
    type: 'good',
    frequency: 'daily',
    startDate: getRandomPastDate(30),
  }), { headers });

  const habitId = res.status === 201 ? res.json()?.habit?.id : null;
  return { token: auth.token, habitId };
}

export default function (data) {
  if (!IS_SOAK_ENABLED) {
    sleep(1);
    return;
  }

  const headers = getHeaders(data.token);

  // 1. Read state
  const stateRes = http.get(`${BASE_URL}/api/state`, {
    headers,
    tags: { name: 'Soak_GET_State' },
  });

  const isStateOk = check(stateRes, {
    'soak state status is 200': (r) => r.status === 200,
  });

  soakLatency.add(stateRes.timings.duration);
  soakErrorRate.add(!isStateOk);

  sleep(Math.random() * 2 + 1);

  // 2. Periodic toggle
  if (data.habitId && Math.random() < 0.3) {
    const toggleRes = http.post(
      `${BASE_URL}/api/habits/${data.habitId}/toggle`,
      JSON.stringify({ date: getRandomPastDate(14) }),
      { headers, tags: { name: 'Soak_POST_Toggle' } }
    );

    const isToggleOk = check(toggleRes, {
      'soak toggle status is 200': (r) => r.status === 200,
    });

    soakLatency.add(toggleRes.timings.duration);
    soakErrorRate.add(!isToggleOk);
  }

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    stdout: null,
    'soak-summary.json': JSON.stringify(data, null, 2),
  };
}

