# Momentum: Comprehensive Performance & Security Testing Report

**Date:** October 30, 2026  
**Application:** Momentum (HabitFlow Full-Stack Habit Tracker)  
**Author:** Senior Backend Performance & Application Security Engineering Audit  
**Status:** Audit Complete & Test Suites Deployed  

---

## Executive Summary

A comprehensive architectural inspection, performance test suite, and automated security audit were conducted on the **Momentum** full-stack habit tracking application. 

The application demonstrates strong architectural patterns in several areas:
- **Clean multi-tenant query scoping:** All habit and log operations explicitly filter by `{ userId, appId }` or `{ userId, habitAppId }`.
- **In-memory analytical caching:** The `buildState` service leverages a memoization cache and single-pass O(M) log groupings to reduce analytical calculation overhead.
- **Defensive input sanitization:** Habit names, categories, and enum constraints are sanitized and validated with custom validation logic.
- **Dedicated authentication rate limiting:** An in-memory sliding-window limiter guards registration and login against brute-force attacks.

However, several high-impact architectural bottlenecks and security vulnerabilities were identified:
1. **Concurrency Race Condition on Habit Completion:** Concurrent toggles on the same date cause MongoDB `E11000 duplicate key` exceptions, triggering unexpected HTTP 500 errors to clients.
2. **Resource Exhaustion Risk on Analytics:** Expensive analytical computations (`/api/state?days=90`) have no concurrency controls, rate limits, or pagination, exposing the backend to Denial of Service (DoS).
3. **Information Disclosure in Error Handling:** The global Express error handler reflects raw `err.message` values directly to clients in HTTP 500 responses.
4. **Missing Content Security Policy (CSP):** While clickjacking and MIME-sniffing protections are present, CSP is absent.

---

## 1. Discovered Architecture & API Inventory

### Discovered API Endpoints

| HTTP Method | Route | Auth Required | Purpose & Behavior |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | MongoDB connectivity check (returns 200 or 503) |
| `POST` | `/api/auth/register` | No (Rate Limited: 30 / 15m) | Registers user (bcrypt salt 12), returns JWT & user object |
| `POST` | `/api/auth/login` | No (Rate Limited: 30 / 15m) | Verifies credentials, returns signed JWT & user object |
| `GET` | `/api/auth/me` | Yes (`protect`) | Returns current authenticated user record |
| `POST` | `/api/auth/logout` | Yes (`protect`) | Stateless logout acknowledgment |
| `GET` | `/api/state` | Yes (`protect`) | Full app state: habits, logs, settings, in-memory analytics (`?days=N`) |
| `POST` | `/api/habits` | Yes (`protect`) | Creates new habit, recalculates analytics, returns full state |
| `PUT` | `/api/habits/reorder` | Yes (`protect`) | Bulk reorders habit display indexes |
| `PUT` | `/api/habits/:id` | Yes (`protect`) | Updates habit metadata, invalidates cache |
| `DELETE` | `/api/habits/:id` | Yes (`protect`) | Cascades deletion across logs, streaks, and analytics |
| `POST` | `/api/habits/:id/toggle` | Yes (`protect`) | Toggles completion status for a date, returns updated state |
| `POST` | `/api/import` | Yes (`protect`) | Bulk imports habits (supports replace or merge) |
| `DELETE` | `/api/data` | Yes (`protect`) | Cascades reset of all habits, logs, streaks, and analytics |
| `GET` | `/api/settings` | Yes (`protect`) | Retrieves user theme settings (`light` / `dark`) |
| `PUT` | `/api/settings` | Yes (`protect`) | Updates user theme setting |

*Note: Endpoints such as `/api/products`, `/api/orders`, or separate `/api/dashboard` and `/api/analytics` routes do not exist. All dashboard and analytics metrics are embedded in `GET /api/state`.*

---

## 2. Security Assessment & Findings

### Classification Matrix

| Finding ID | Vulnerability / Issue | Severity | Status |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Concurrency Race Condition on `POST /api/habits/:id/toggle` | **High** | Confirmed by Code & Test Suite |
| **SEC-02** | Absence of Rate Limiting on Expensive Analytics (`/api/state`) | **Medium** | Confirmed by Code & Test Suite |
| **SEC-03** | Error Reflection Leaking Internal Messages in HTTP 500 Responses | **Medium** | Confirmed by Code Inspection |
| **SEC-04** | Missing Content-Security-Policy (CSP) & HSTS Headers | **Low** | Confirmed by Security Header Test |
| **SEC-05** | In-Memory Rate Limiter Does Not Scale Across Clusters | **Informational**| Architectural Limitation |

---

### Detailed Findings

#### SEC-01: Concurrency Race Condition on Habit Completion Toggle (Severity: High)
- **Component:** `server/services/habit.service.js` (`toggleHabit`)
- **Evidence:** 
  Lines 325–349 execute a read-then-write pattern:
  ```javascript
  const existing = await HabitLog.findOne({ userId, habitAppId: appId, date });
  if (existing) { ... }
  else {
    await HabitLog.create({ userId, habitAppId: appId, date, completed: true });
  }
  ```
  `HabitLog` has a compound unique index: `{ userId: 1, habitAppId: 1, date: 1 }`. Under concurrent traffic, two overlapping requests both observe `existing === null`. The second insertion violates the unique index and throws `E11000 duplicate key error`. Because `toggleHabit` lacks duplicate key handling, the error bubbles up as an unhandled HTTP 500 Server Error.
- **Potential Impact:** Service instability, elevated 5xx error rates under concurrent mobile/web client usage, user perceived failure despite database write.
- **Recommended Remediation:** Replace read-then-write with an atomic upsert or catch `11000` errors and perform a retry/noop:
  ```javascript
  await HabitLog.findOneAndUpdate(
    { userId, habitAppId: appId, date },
    { $setOnInsert: { completed: true } },
    { upsert: true, new: true }
  );
  ```

#### SEC-02: Absence of Rate Limiting on Expensive Analytics (Severity: Medium)
- **Component:** `server/routes/habits.js` (`GET /api/state`)
- **Evidence:** `authLimiter` is only applied to `/api/auth/register` and `/api/auth/login`. An authenticated user or script can execute hundreds of simultaneous `GET /api/state?days=90` requests, triggering heavy array aggregations, frequency evaluations, and background persistence without restriction.
- **Potential Impact:** CPU starvation on the Node.js event loop, event-loop lag, degraded response times for other tenants.
- **Recommended Remediation:** Introduce a tiered rate limiter for authenticated API routes (e.g. 120 requests/minute per user).

#### SEC-03: Error Reflection in HTTP 500 Responses (Severity: Medium)
- **Component:** `server/index.mjs` (Global Error Handler)
- **Evidence:**
  ```javascript
  app.use((err, req, res, next) => {
    res.status(500).json({
      error: 'Server error',
      message: err.message || 'Something went wrong while saving your data.',
    });
  });
  ```
  When MongoDB or internal libraries throw errors (e.g. connection strings, driver exceptions, validation failures), `err.message` can leak database schema details, collection names, or query specifics to clients.
- **Recommended Remediation:** Mask internal error messages in production mode:
  ```javascript
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'Server error',
    message: isDev ? err.message : 'An unexpected error occurred. Please try again.',
  });
  ```

---

## 3. Performance Testing Suite Architecture

The performance testing suite is organized into 5 scenarios in `tests/performance/`:

1. **Baseline Load (`baseline.js`):**
   - **Load:** 50 concurrent VUs sustained for 8 minutes (10m total including ramp).
   - **Target Endpoints:** `GET /api/state`, `GET /api/settings`, `POST /api/habits/:id/toggle`, periodic `POST /api/habits`.
   - **Configured Thresholds:** P95 < 200 ms (reads), P95 < 300 ms (writes), Error Rate < 1%.
2. **Spike Test (`spike.js`):**
   - **Load:** Rapid ramp from 50 to 500 VUs over 60 seconds, 1-minute hold, rapid ramp down.
   - **Breaking Point Monitoring:** Monitors at what concurrency level P95 exceeds 400ms or 5xx error rate exceeds 5%.
3. **Sustained Soak Test (`soak.js`):**
   - **Load:** 75 VUs sustained over 4 hours (safely guarded by `RUN_SOAK_TEST=true`).
   - **Objective:** Detects latency drift (> 20% degradation between hour 1 and hour 4) and connection-pool exhaustion.
4. **Database-Heavy Operations (`database-heavy.js`):**
   - **Load:** 20 concurrent VUs querying 30-day and 90-day deep analytical models with 1,000+ synthetic historical records.
   - **Objective:** Measures aggregation overhead and database index utilization.
5. **End-to-End Workflow (`workflow.js`):**
   - **Scenario:** Isolated user journey: Authenticate $\rightarrow$ Fetch State $\rightarrow$ Create Habit $\rightarrow$ Toggle Completion $\rightarrow$ Verify State Consistency $\rightarrow$ Clean up.
   - **Thresholds:** Workflow duration P95 < 1500 ms, completion rate > 98%.

---

## 4. Prioritized Remediation Plan

1. **Immediate (P0):** Wrap `toggleHabit` in an atomic MongoDB operation or catch `11000` duplicate key collisions to eliminate HTTP 500 race conditions.
2. **Short-Term (P1):** Sanitize production error messages in `server/index.mjs` to prevent database schema leakage.
3. **Medium-Term (P2):** Add authenticated rate limiting (120 req/min) on `/api/state` and mutation endpoints.
4. **Hardening (P3):** Add `helmet` or explicit `Content-Security-Policy` and `Strict-Transport-Security` headers.

