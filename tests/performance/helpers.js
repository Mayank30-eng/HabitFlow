import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3001';

/**
 * Generate standard JSON headers with optional Bearer token
 */
export function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authenticate a test user or register if new
 */
export function authenticateUser(email, password, name = 'LoadTest User') {
  const loginPayload = JSON.stringify({ email, password });
  let loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: getHeaders(),
    tags: { name: 'Auth_Login' },
  });

  if (loginRes.status === 200) {
    const body = loginRes.json();
    return { token: body.token, user: body.user };
  }

  // If user does not exist (401), register them
  if (loginRes.status === 401) {
    const regPayload = JSON.stringify({ name, email, password });
    const regRes = http.post(`${BASE_URL}/api/auth/register`, regPayload, {
      headers: getHeaders(),
      tags: { name: 'Auth_Register' },
    });

    if (regRes.status === 201) {
      const body = regRes.json();
      return { token: body.token, user: body.user };
    }
  }

  return null;
}

/**
 * Generate a random YYYY-MM-DD date within the past N days
 */
export function getRandomPastDate(daysBack = 30) {
  const date = new Date();
  const pastMs = Math.floor(Math.random() * daysBack * 86400000);
  date.setTime(date.getTime() - pastMs);
  return date.toISOString().split('T')[0];
}

/**
 * Generate a random string for habit names or categories
 */
export function randomString(prefix = 'habit') {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

