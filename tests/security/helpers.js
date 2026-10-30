/**
 * Security Test Utilities and HTTP Helpers
 */

export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';

/**
 * Make an HTTP request against the test server
 */
export async function apiRequest(endpoint, {
  method = 'GET',
  token = null,
  body = null,
  headers = {},
} = {}) {
  const reqHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: reqHeaders,
  };

  if (body !== null && method !== 'GET' && method !== 'HEAD') {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

/**
 * Register a unique test user and return credentials + token
 */
export async function createTestUser(prefix = 'sec_user') {
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const email = `${prefix}_${randomSuffix}@test.local`;
  const password = 'TestPassword123!';
  const name = `SecTest ${prefix}`;

  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });

  if (res.status !== 201) {
    throw new Error(`Failed to create test user (${email}): Status ${res.status} - ${JSON.stringify(res.data)}`);
  }

  return {
    user: res.data.user,
    token: res.data.token,
    email,
    password,
  };
}

/**
 * Safely clean up all data for a test user
 */
export async function cleanupTestUser(token) {
  if (!token) return;
  try {
    await apiRequest('/api/data', {
      method: 'DELETE',
      token,
    });
  } catch (err) {
    // Non-fatal cleanup error
    console.warn(`[CLEANUP] Could not reset test user data: ${err.message}`);
  }
}

