import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, getHeaders, authenticateUser, getRandomPastDate } from './helpers.js';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
export const serverErrors = new Counter('http_5xx_errors');
export const clientErrors = new Counter('http_4xx_errors');
export const failureRate = new Rate('spike_failure_rate');
export const spikeLatency = new Trend('spike_req_duration', true);

// ─── Spike & Breaking Point Profile ──────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Pre-spike steady baseline
    { duration: '60s', target: 500 },  // Steep ramp-up: 50 -> 500 VUs in 60s
    { duration: '1m', target: 500 },   // Hold spike at 500 VUs
    { duration: '30s', target: 50 },   // Rapid recovery ramp-down
    { duration: '1m', target: 50 },    // Post-spike observation: test recovery
    { duration: '30s', target: 0 },    // Final ramp-down
  ],
  thresholds: {
    // Fail if server errors exceed 5% under spike
    'spike_failure_rate': ['rate<0.05'],
    // Recovery latency threshold
    'spike_req_duration': ['p(95)<400', 'p(99)<1000'],
  },
};

const TEST_EMAIL = __ENV.TEST_USER_EMAIL || 'perf_spike@example.com';
const TEST_PASSWORD = __ENV.TEST_USER_PASSWORD || 'Password123!';

export function setup() {
  const auth = authenticateUser(TEST_EMAIL, TEST_PASSWORD, 'Spike User');
  if (!auth) {
    throw new Error(`Failed to authenticate spike setup user (${TEST_EMAIL}) against ${BASE_URL}`);
  }

  // Pre-seed 1 habit to toggle during spike
  const headers = getHeaders(auth.token);
  const res = http.post(`${BASE_URL}/api/habits`, JSON.stringify({
    name: 'Spike Test Habit',
    category: 'Stress',
    type: 'good',
    frequency: 'daily',
    startDate: getRandomPastDate(7),
  }), { headers, tags: { name: 'Setup_Spike' } });

  const habitId = res.status === 201 ? res.json()?.habit?.id : null;
  return { token: auth.token, habitId };
}

export default function (data) {
  const headers = getHeaders(data.token);

  // 80% Read traffic (GET /api/state), 20% Write traffic (POST /api/habits/:id/toggle)
  const isRead = Math.random() < 0.8;

  let res;
  if (isRead || !data.habitId) {
    res = http.get(`${BASE_URL}/api/state`, {
      headers,
      tags: { name: 'Spike_GET_State' },
    });
  } else {
    res = http.post(
      `${BASE_URL}/api/habits/${data.habitId}/toggle`,
      JSON.stringify({ date: getRandomPastDate(3) }),
      { headers, tags: { name: 'Spike_POST_Toggle' } }
    );
  }

  // Track status code distributions
  if (res.status >= 500) {
    serverErrors.add(1);
    failureRate.add(1);
  } else if (res.status >= 400) {
    clientErrors.add(1);
    // 4xx errors are client errors, not necessarily server breakdown
    failureRate.add(0);
  } else {
    failureRate.add(0);
  }

  spikeLatency.add(res.timings.duration);

  check(res, {
    'response status is successful (<400)': (r) => r.status < 400,
    'server did not return 5xx': (r) => r.status < 500,
  });

  // Short dynamic sleep to maintain high concurrency pressure
  sleep(Math.random() * 0.4 + 0.1);
}

export function handleSummary(data) {
  const http5xx = data.metrics.http_5xx_errors?.values?.count || 0;
  const http4xx = data.metrics.http_4xx_errors?.values?.count || 0;
  const p95 = data.metrics.spike_req_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const p99 = data.metrics.spike_req_duration?.values['p(99)']?.toFixed(2) || 'N/A';

  console.log('\n================ SPIKE TEST RESULTS ================');
  console.log(`Peak Concurrency:       500 VUs`);
  console.log(`P95 Latency:            ${p95} ms`);
  console.log(`P99 Latency:            ${p99} ms`);
  console.log(`HTTP 5xx Server Errors: ${http5xx}`);
  console.log(`HTTP 4xx Client Errors: ${http4xx}`);
  console.log('====================================================\n');

  return {
    stdout: null,
    'spike-summary.json': JSON.stringify(data, null, 2),
  };
}

