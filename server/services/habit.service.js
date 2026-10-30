/**
 * Habit Service — CRUD operations, state building, import/export.
 *
 * Delegates all metric calculations to habitMetrics.service.js.
 */

import crypto from 'node:crypto';
import HabitModel from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import Streak from '../models/Streak.js';
import AnalyticsModel from '../models/Analytics.js';
import Settings from '../models/Settings.js';
import { getToday, isValidDate } from '../services/dateUtils.js';
import {
  deriveOverallAnalytics,
  deriveHabitMetrics,
  getCompletionTrend,
  getBadHabitTrend,
  getWeeklyData,
  getMonthlyData,
  getHabitComparison,
  getOverallStatus,
  getGoodVsBadStats,
  calculateGrowthScore,
  calculateOverallSuccessRate,
  getGoodHabitDashboardStats,
  getBadHabitDashboardStats,
  getHabitSuccessTrend,
  getHabitImpactScore,
  buildHistoryMap,
} from '../services/habitMetrics.service.js';
import { validateHabitInput, sanitizeString } from '../validators/habit.validator.js';

const generateId = () => crypto.randomBytes(12).toString('hex');

// ─── State Memoization Cache ───────────────────────────────────────────────

const stateCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/** Invalidate cached state for a user (called on all mutations). */
export const invalidateUserCache = (userId, preservePerHabit = false) => {
  if (!userId) return;
  const idStr = userId.toString();
  for (const [key, value] of stateCache.entries()) {
    if (key.startsWith(`${idStr}:`) || key === idStr) {
      if (preservePerHabit) {
        // Expire timestamp so buildState recalculates, but preserve per-habit cache for incremental updates
        value.timestamp = 0;
      } else {
        stateCache.delete(key);
      }
    }
  }
};

// ─── Settings ───────────────────────────────────────────────────────────────

export const ensureSettings = async (userId) => {
  const existing = await Settings.findOne({ userId }).lean();
  if (existing) return existing;
  return Settings.create({ userId, theme: 'light' });
};

// ─── Read ───────────────────────────────────────────────────────────────────

/** Load all habits for a user in client format with optimized single-pass log grouping. */
export const getClientHabits = async (userId) => {
  const habits = await HabitModel.find({ userId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  if (habits.length === 0) return [];

  const habitIds = habits.map((h) => h.appId);
  const logs = await HabitLog.find({ userId, habitAppId: { $in: habitIds } })
    .sort({ date: 1 })
    .lean();

  // Group logs by habitAppId in single O(M) pass
  const logsByHabit = new Map();
  for (const log of logs) {
    let list = logsByHabit.get(log.habitAppId);
    if (!list) {
      list = [];
      logsByHabit.set(log.habitAppId, list);
    }
    list.push({ date: log.date, completed: log.completed });
  }

  return habits.map((h) => ({
    id: h.appId,
    name: h.name,
    category: h.category,
    type: h.type,
    description: h.description || '',
    frequency: h.frequency,
    customDays: h.customDays || [],
    startDate: h.startDate,
    createdAt: h.createdAtDate,
    history: logsByHabit.get(h.appId) || [],
    order: h.order,
  }));
};

// ─── In-Memory Analytics Calculation ────────────────────────────────────────

/**
 * Compute enriched analytics in-memory without synchronous database writes.
 * Supports configurable trend days (default 7 days for fast initial response).
 * Reuses precomputed per-habit metrics when only a single habit was updated.
 */
export const computeAnalytics = (habits, trendDays = 7, cachedPerHabit = null, updatedHabitId = null) => {
  const overall = deriveOverallAnalytics(habits);
  const perHabit = {};

  for (const habit of habits) {
    if (cachedPerHabit && updatedHabitId && habit.id !== updatedHabitId && cachedPerHabit[habit.id]) {
      perHabit[habit.id] = cachedPerHabit[habit.id];
    } else {
      const historyMap = buildHistoryMap(habit.history);
      const metrics = deriveHabitMetrics(habit, historyMap);
      perHabit[habit.id] = {
        ...metrics,
        impactScore: getHabitImpactScore(habit, habits, metrics),
        trend: getHabitSuccessTrend(habit, trendDays, historyMap),
      };
    }
  }

  return {
    overall,
    perHabit,
    trends: {
      completion: getCompletionTrend(habits, trendDays),
      badHabit: getBadHabitTrend(habits, trendDays),
      weekly: getWeeklyData(habits),
      monthly: getMonthlyData(habits),
    },
    comparison: getHabitComparison(habits),
    todayStatus: getOverallStatus(habits),
    goodVsBad: getGoodVsBadStats(habits),
    growthScore: calculateGrowthScore(habits),
    overallSuccessRate: calculateOverallSuccessRate(habits),
    goodStats: getGoodHabitDashboardStats(habits),
    badStats: getBadHabitDashboardStats(habits),
  };
};

// ─── Asynchronous Derived Analytics Persistence ────────────────────────────

/**
 * Persist analytics snapshot asynchronously in the background.
 * Never blocks the client HTTP response.
 */
export const persistDerivedDataAsync = async (userId, habits, overall, perHabit) => {
  try {
    const activeHabitIds = habits.map((h) => h.id);

    const habitOps = habits.flatMap((habit) => {
      const metrics = perHabit[habit.id] || deriveHabitMetrics(habit);
      return [
        Streak.findOneAndUpdate(
          { userId, habitAppId: habit.id },
          {
            userId,
            habitAppId: habit.id,
            habitType: habit.type,
            currentStreak: metrics.currentStreak,
            longestStreak: metrics.longestStreak,
            avoidanceStreak: metrics.avoidanceStreak,
            longestAvoidanceStreak: metrics.longestAvoidanceStreak,
          },
          { upsert: true, new: true }
        ),
        AnalyticsModel.findOneAndUpdate(
          { userId, key: `${userId}:habit:${habit.id}` },
          {
            userId,
            key: `${userId}:habit:${habit.id}`,
            scope: 'habit',
            habitAppId: habit.id,
            metrics,
          },
          { upsert: true, new: true }
        ),
      ];
    });

    await Promise.all([
      AnalyticsModel.findOneAndUpdate(
        { userId, key: `${userId}:overall` },
        {
          userId,
          key: `${userId}:overall`,
          scope: 'overall',
          habitAppId: null,
          metrics: overall,
        },
        { upsert: true, new: true }
      ),
      ...habitOps,
      Streak.deleteMany({ userId, habitAppId: { $nin: activeHabitIds } }),
      AnalyticsModel.deleteMany({
        userId,
        scope: 'habit',
        habitAppId: { $nin: activeHabitIds },
      }),
    ]);
  } catch (err) {
    console.error('Async analytics persistence error:', err);
  }
};

/** Compatibility alias for existing callers. Computes analytics in-memory. */
export const persistDerivedData = async (userId, habits, trendDays = 7) => {
  const analytics = computeAnalytics(habits, trendDays);
  void persistDerivedDataAsync(userId, habits, analytics.overall, analytics.perHabit);
  return analytics;
};

// ─── Build Full State ───────────────────────────────────────────────────────

/**
 * Build the full app state for a user.
 * Uses in-memory memoization cache to return responses in < 1ms on cache hits.
 * Prunes trends to `days` (default 7) for lightweight responses.
 * Reuses unaffected per-habit metrics when updatedHabitId is provided.
 */
export const buildState = async (user, { days = 7, skipCache = false, updatedHabitId = null } = {}) => {
  const userIdStr = user._id.toString();
  const cacheKey = `${userIdStr}:${days}`;
  const today = getToday();

  const cached = stateCache.get(cacheKey);

  if (!skipCache && cached && cached.date === today && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.state;
  }

  const settings = await ensureSettings(user._id);
  const habits = await getClientHabits(user._id);
  const cachedPerHabit = cached?.state?.analytics?.perHabit || null;
  const analytics = computeAnalytics(habits, days, cachedPerHabit, updatedHabitId);

  const state = {
    habits,
    settings: { theme: settings.theme },
    analytics,
  };

  stateCache.set(cacheKey, {
    state,
    date: today,
    timestamp: Date.now(),
  });

  return state;
};

// ─── Create ─────────────────────────────────────────────────────────────────

export const createHabit = async (userId, data) => {
  invalidateUserCache(userId);
  const count = await HabitModel.countDocuments({ userId });
  const habit = await HabitModel.create({
    userId,
    appId: generateId(),
    ...data,
    createdAtDate: getToday(),
    order: count,
  });
  return habit.appId;
};

// ─── Update ─────────────────────────────────────────────────────────────────

export const updateHabit = async (userId, appId, data) => {
  invalidateUserCache(userId, true);
  const habit = await HabitModel.findOneAndUpdate(
    { userId, appId },
    { ...data },
    { new: true, runValidators: true }
  );

  if (!habit) return null;

  // For bad habits, remove false-completion logs
  if (data.type === 'bad') {
    await HabitLog.deleteMany({
      userId,
      habitAppId: appId,
      completed: false,
    });
  }

  return habit;
};

// ─── Delete ─────────────────────────────────────────────────────────────────

export const deleteHabit = async (userId, appId) => {
  invalidateUserCache(userId);
  const deleted = await HabitModel.findOneAndDelete({ userId, appId });
  if (!deleted) return false;

  await HabitLog.deleteMany({ userId, habitAppId: appId });
  await Streak.deleteMany({ userId, habitAppId: appId });
  await AnalyticsModel.deleteMany({
    userId,
    scope: 'habit',
    habitAppId: appId,
  });

  return true;
};

// ─── Toggle ─────────────────────────────────────────────────────────────────

export const toggleHabit = async (userId, appId, date) => {
  invalidateUserCache(userId, true);
  const habit = await HabitModel.findOne({ userId, appId });
  if (!habit) return null;

  const existing = await HabitLog.findOne({
    userId,
    habitAppId: appId,
    date,
  });

  if (existing) {
    if (habit.type === 'bad' && existing.completed) {
      await HabitLog.deleteOne({ _id: existing._id });
    } else {
      existing.completed = !existing.completed;
      if (habit.type === 'bad' && !existing.completed) {
        await HabitLog.deleteOne({ _id: existing._id });
      } else {
        await existing.save();
      }
    }
  } else {
    await HabitLog.create({
      userId,
      habitAppId: appId,
      date,
      completed: true,
    });
  }

  return habit;
};

// ─── Reorder ────────────────────────────────────────────────────────────────

export const reorderHabits = async (userId, habits) => {
  invalidateUserCache(userId);
  await Promise.all(
    habits.map((h, order) =>
      HabitModel.updateOne({ userId, appId: h.id }, { order })
    )
  );
};

// ─── Import ─────────────────────────────────────────────────────────────────

export const importHabits = async (userId, habits, replace = false) => {
  invalidateUserCache(userId);
  if (replace) {
    await HabitModel.deleteMany({ userId });
    await HabitLog.deleteMany({ userId });
    await Streak.deleteMany({ userId });
    await AnalyticsModel.deleteMany({ userId });
  }

  for (let index = 0; index < habits.length; index += 1) {
    await upsertImportedHabit(userId, habits[index], index);
  }
};

const upsertImportedHabit = async (userId, habit, importOrder) => {
  const validation = validateHabitInput(habit);
  if (!validation.valid) {
    throw new Error(
      `Invalid habit "${habit?.name || habit?.id || 'unknown'}": ${validation.errors.join(' ')}`
    );
  }

  const appId = sanitizeString(habit.id) || generateId();
  const createdAtDate = isValidDate(habit.createdAt)
    ? habit.createdAt
    : getToday();
  const order = Number.isFinite(habit.order) ? habit.order : importOrder;

  await HabitModel.findOneAndUpdate(
    { userId, appId },
    {
      userId,
      appId,
      ...validation.data,
      createdAtDate,
      order,
    },
    { upsert: true, new: true, runValidators: true }
  );

  if (Array.isArray(habit.history)) {
    await Promise.all(
      habit.history.map(async (record) => {
        if (!isValidDate(record.date) || typeof record.completed !== 'boolean')
          return;
        if (validation.data.type === 'bad' && !record.completed) return;

        await HabitLog.findOneAndUpdate(
          { userId, habitAppId: appId, date: record.date },
          {
            userId,
            habitAppId: appId,
            date: record.date,
            completed: record.completed,
          },
          { upsert: true, new: true, runValidators: true }
        );
      })
    );
  }
};

// ─── Reset ──────────────────────────────────────────────────────────────────

export const resetAllData = async (userId) => {
  invalidateUserCache(userId);
  await HabitModel.deleteMany({ userId });
  await HabitLog.deleteMany({ userId });
  await Streak.deleteMany({ userId });
  await AnalyticsModel.deleteMany({ userId });
};
