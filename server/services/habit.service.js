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
} from '../services/habitMetrics.service.js';
import { validateHabitInput, sanitizeString } from '../validators/habit.validator.js';

const generateId = () => crypto.randomBytes(12).toString('hex');

// ─── Data Transformation ────────────────────────────────────────────────────

/** Convert a DB habit + its logs into the client-facing shape. */
const habitToClient = (habit, logs) => ({
  id: habit.appId,
  name: habit.name,
  category: habit.category,
  type: habit.type,
  description: habit.description || '',
  frequency: habit.frequency,
  customDays: habit.customDays || [],
  startDate: habit.startDate,
  createdAt: habit.createdAtDate,
  history: logs
    .filter((log) => log.habitAppId === habit.appId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({ date: log.date, completed: log.completed })),
  order: habit.order,
});

// ─── Settings ───────────────────────────────────────────────────────────────

export const ensureSettings = async (userId) => {
  return Settings.findOneAndUpdate(
    { userId },
    { $setOnInsert: { theme: 'light' } },
    { new: true, upsert: true }
  );
};

// ─── Read ───────────────────────────────────────────────────────────────────

/** Load all habits for a user in client format. */
export const getClientHabits = async (userId) => {
  const habits = await HabitModel.find({ userId })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  const habitIds = habits.map((h) => h.appId);
  const logs =
    habitIds.length > 0
      ? await HabitLog.find({ userId, habitAppId: { $in: habitIds } })
          .sort({ date: 1 })
          .lean()
      : [];
  return habits.map((h) => habitToClient(h, logs));
};

// ─── Derived Analytics Persistence ──────────────────────────────────────────

/**
 * Compute and persist derived analytics + streak data.
 * Returns the enriched analytics object for the API response.
 */
export const persistDerivedData = async (userId, habits) => {
  const overall = deriveOverallAnalytics(habits);

  await AnalyticsModel.findOneAndUpdate(
    { userId, key: `${userId}:overall` },
    {
      userId,
      key: `${userId}:overall`,
      scope: 'overall',
      habitAppId: null,
      metrics: overall,
    },
    { upsert: true, new: true }
  );

  const activeHabitIds = habits.map((h) => h.id);

  await Promise.all(
    habits.map(async (habit) => {
      const metrics = deriveHabitMetrics(habit);

      await Streak.findOneAndUpdate(
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
      );

      await AnalyticsModel.findOneAndUpdate(
        { userId, key: `${userId}:habit:${habit.id}` },
        {
          userId,
          key: `${userId}:habit:${habit.id}`,
          scope: 'habit',
          habitAppId: habit.id,
          metrics,
        },
        { upsert: true, new: true }
      );
    })
  );

  await Streak.deleteMany({ userId, habitAppId: { $nin: activeHabitIds } });
  await AnalyticsModel.deleteMany({
    userId,
    scope: 'habit',
    habitAppId: { $nin: activeHabitIds },
  });

  // Build enriched analytics response for the frontend
  const perHabit = {};
  for (const habit of habits) {
    perHabit[habit.id] = deriveHabitMetrics(habit);
    perHabit[habit.id].impactScore = getHabitImpactScore(habit, habits);
    perHabit[habit.id].trend = getHabitSuccessTrend(habit, 30);
  }

  return {
    overall,
    perHabit,
    trends: {
      completion: getCompletionTrend(habits, 30),
      badHabit: getBadHabitTrend(habits, 30),
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

// ─── Build Full State ───────────────────────────────────────────────────────

/** Build the full app state for a user. */
export const buildState = async (user) => {
  const settings = await ensureSettings(user._id);
  const habits = await getClientHabits(user._id);
  const analytics = await persistDerivedData(user._id, habits);
  return {
    habits,
    settings: { theme: settings.theme },
    analytics,
  };
};

// ─── Create ─────────────────────────────────────────────────────────────────

export const createHabit = async (userId, data) => {
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
  await Promise.all(
    habits.map((h, order) =>
      HabitModel.updateOne({ userId, appId: h.id }, { order })
    )
  );
};

// ─── Import ─────────────────────────────────────────────────────────────────

export const importHabits = async (userId, habits, replace = false) => {
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
  await HabitModel.deleteMany({ userId });
  await HabitLog.deleteMany({ userId });
  await Streak.deleteMany({ userId });
  await AnalyticsModel.deleteMany({ userId });
};
