import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, getHeaders, authenticateUser, getRandomPastDate } from './helpers.js';

export const state30DaysLatency = new Trend('db_state_30days_latency', true);
export const state90DaysLatency = new Trend('db_state_90days_latency', true);
export const importLatency = new Trend('db_bulk_import_latency', true);
export const dbErrorRate = new Rate('db_heavy_error_rate');

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // 20 concurrent queries against large datasets
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // Database heavy analytics calculations should still complete within 600ms
    'db_state_30days_latency': ['p(95)<400', 'p(99)<800'],
    'db_state_90days_latency': ['p(95)<600', 'p(99)<1200'],
    'db_heavy_error_rate': ['rate<0.01'],
  },
};

const TEST_EMAIL = __ENV.TEST_USER_EMAIL || 'perf_db_heavy@example.com';
const TEST_PASSWORD = __ENV.TEST_USER_PASSWORD || 'Password123!';
const IS_LARGE_DATA = (__ENV.RUN_LARGE_DATA_TEST || '').toLowerCase() === 'true';

export function setup() {
  const auth = authenticateUser(TEST_EMAIL, TEST_PASSWORD, 'DB Heavy User');
  if (!auth) {
    throw new Error(`Failed to authenticate database heavy user against ${BASE_URL}`);
  }

  const headers = getHeaders(auth.token);

  // Seed representative synthetic dataset via POST /api/import
  // Simulates 15 habits with varying frequencies
  const habitCount = IS_LARGE_DATA ? 30 : 12;
  const sampleHabits = [];

  for (let i = 0; i < habitCount; i++) {
    const isGood = i % 3 !== 0;
    const history = [];

    // Populate up to 60 historical completion entries per habit
    const historyDays = IS_LARGE_DATA ? 90 : 45;
    for (let d = 0; d < historyDays; d++) {
      if (Math.random() > 0.3) {
        history.push({
          date: getRandomPastDate(historyDays),
          completed: true,
        });
      }
    }

    sampleHabits.push({
      id: `syn_h_${i + 1}`,
      name: `Synthetic ${isGood ? 'Good' : 'Bad'} Habit ${i + 1}`,
      category: i % 2 === 0 ? 'Fitness' : 'Mindset',
      type: isGood ? 'good' : 'bad',
      description: 'Synthetic historical habit for database load testing',
      frequency: i % 4 === 0 ? 'weekly' : 'daily',
      startDate: getRandomPastDate(historyDays),
      history,
    });
  }

  // Import into database
  const importRes = http.post(
    `${BASE_URL}/api/import`,
    JSON.stringify({ habits: sampleHabits, replace: true }),
    { headers, tags: { name: 'Setup_Bulk_Import' } }
  );

  console.log(`[SETUP] Seeded ${sampleHabits.length} habits with completion logs. Status: ${importRes.status}`);

  return { token: auth.token };
}

export default function (data) {
  const headers = getHeaders(data.token);

  // 1. Heavy Read: 30-Day Trend & State Computation
  group('Query: 30-Day State Computation', () => {
    const res = http.get(`${BASE_URL}/api/state?days=30`, {
      headers,
      tags: { name: 'DB_State_30' },
    });

    const isOk = check(res, {
      'state 30 status is 200': (r) => r.status === 200,
      'analytics present': (r) => Boolean(r.json()?.analytics),
    });

    state30DaysLatency.add(res.timings.duration);
    dbErrorRate.add(!isOk);
  });

  sleep(Math.random() * 0.5 + 0.5);

  // 2. Heavy Read: 90-Day Deep Trend & Metric Aggregation
  group('Query: 90-Day State Computation', () => {
    const res = http.get(`${BASE_URL}/api/state?days=90`, {
      headers,
      tags: { name: 'DB_State_90' },
    });

    const isOk = check(res, {
      'state 90 status is 200': (r) => r.status === 200,
      'growthScore calculated': (r) => typeof r.json()?.analytics?.growthScore === 'number',
    });

    state90DaysLatency.add(res.timings.duration);
    dbErrorRate.add(!isOk);
  });

  sleep(Math.random() * 0.5 + 0.5);
}

export function handleSummary(data) {
  return {
    stdout: null,
    'db-heavy-summary.json': JSON.stringify(data, null, 2),
  };
}

