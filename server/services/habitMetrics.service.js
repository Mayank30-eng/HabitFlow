/**
 * Habit Metrics Service — single canonical implementation of all domain calculations.
 *
 * Every function is frequency-aware via getScheduledDates.
 * The frontend should consume these results from the API rather than recalculating.
 */

import {
  getScheduledDates,
  getToday,
  subDays,
  getDaysInRange,
  getDayOfWeek,
} from './dateUtils.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a Map<date, record> from a habit's history array for O(1) lookups.
 * Avoids repeated O(n) .find() inside loops.
 */
export const buildHistoryMap = (history) => {
  const map = new Map();
  for (const record of history) {
    map.set(record.date, record);
  }
  return map;
};

// ─── Core Predicates ────────────────────────────────────────────────────────

/** Is the given date a "success" for this habit? */
export const isHabitSuccessOnDate = (habit, date, historyMap) => {
  if (date < habit.startDate) return false;
  const record = historyMap.get(date);
  return habit.type === 'good'
    ? Boolean(record?.completed)
    : !record?.completed;
};

/** Did a bad habit occur (was performed) on the given date? */
export const isBadHabitOccurrenceOnDate = (habit, date, historyMap) => {
  if (habit.type !== 'bad' || date < habit.startDate) return false;
  return Boolean(historyMap.get(date)?.completed);
};

/**
 * Is a given date a scheduled date for this habit?
 * Respects frequency + customDays.
 */
export const isDateScheduled = (habit, date) => {
  if (date < habit.startDate) return false;

  const freq = habit.frequency || 'daily';
  if (freq === 'daily') return true;

  if (freq === 'weekly') {
    return getDayOfWeek(date) === getDayOfWeek(habit.startDate);
  }

  if (freq === 'custom') {
    const days = Array.isArray(habit.customDays) ? habit.customDays : [];
    if (days.length === 0) return false;
    return days.includes(getDayOfWeek(date));
  }

  return true; // fallback
};

// ─── Per-Habit Metrics ──────────────────────────────────────────────────────

/**
 * Current streak — consecutive scheduled successes from today backward.
 * Good habit: completed days. Bad habit: avoided days.
 *
 * For good habits, if today is scheduled but not yet recorded, skip to yesterday
 * (don't break the streak for an incomplete today).
 */
export const calculateStreak = (habit, precomputedMap = null) => {
  const today = getToday();
  if (habit.startDate > today) return 0;

  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  let streak = 0;
  let current = today;

  while (current >= habit.startDate) {
    // Skip non-scheduled days
    if (!isDateScheduled(habit, current)) {
      current = subDays(current, 1);
      continue;
    }

    const record = historyMap.get(current);
    const success = isHabitSuccessOnDate(habit, current, historyMap);

    if (success) {
      // Good habit on today with no record: skip (not yet done today)
      if (habit.type === 'good' && current === today && !record?.completed) {
        current = subDays(current, 1);
        continue;
      }
      streak += 1;
      current = subDays(current, 1);
    } else if (habit.type === 'good' && current === today && !record?.completed) {
      // Good habit: today not yet checked/completed, skip to yesterday
      current = subDays(current, 1);
    } else {
      break;
    }
  }

  return streak;
};

/** Longest streak — max consecutive scheduled successes in all history. */
export const calculateLongestStreak = (habit, precomputedMap = null, precomputedRange = null) => {
  const range = precomputedRange || getScheduledDates(habit, habit.startDate, getToday());
  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  let maxStreak = 0;
  let currentStreak = 0;

  for (const date of range) {
    if (isHabitSuccessOnDate(habit, date, historyMap)) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

/** Success rate over the last N days (only counting scheduled elapsed days + today if completed). */
export const calculateSuccessRate = (habit, days = 30, precomputedMap = null) => {
  const today = getToday();
  const range = getScheduledDates(habit, subDays(today, days - 1), today);
  if (range.length === 0) return 0;
  const historyMap = precomputedMap || buildHistoryMap(habit.history);

  let eligibleDenominator = 0;
  let successes = 0;

  for (const date of range) {
    if (date < today) {
      eligibleDenominator += 1;
      if (isHabitSuccessOnDate(habit, date, historyMap)) {
        successes += 1;
      }
    } else if (date === today) {
      if (habit.type === 'good') {
        const isDone = Boolean(historyMap.get(today)?.completed);
        if (isDone) {
          eligibleDenominator += 1;
          successes += 1;
        }
        // If not completed yet today, it is pending; do not penalize denominator before day ends
      } else {
        const performed = isBadHabitOccurrenceOnDate(habit, today, historyMap);
        eligibleDenominator += 1;
        if (!performed) {
          successes += 1;
        }
      }
    }
  }

  if (eligibleDenominator === 0) return 100;
  return Math.min(100, Math.max(0, Math.round((successes / eligibleDenominator) * 100)));
};

/** Total successes across all scheduled days since startDate. */
export const calculateTotalSuccesses = (habit, precomputedMap = null, precomputedRange = null) => {
  const range = precomputedRange || getScheduledDates(habit, habit.startDate, getToday());
  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  return range.filter((date) => isHabitSuccessOnDate(habit, date, historyMap)).length;
};

/** Count times a bad habit was performed (good habits → 0). */
export const calculateTimesPerformed = (habit) => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  return habit.history.filter(
    (log) => log.completed && log.date >= habit.startDate && log.date <= today
  ).length;
};

/**
 * Relapse count — number of times a bad habit broke an avoidance streak.
 * Uses scheduled dates only.
 */
export const calculateRelapseCount = (habit, precomputedMap = null, precomputedRange = null) => {
  if (habit.type === 'good') return 0;

  const range = precomputedRange || getScheduledDates(habit, habit.startDate, getToday());
  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  let relapses = 0;
  let wasAvoiding = true;

  for (const date of range) {
    const performed = isBadHabitOccurrenceOnDate(habit, date, historyMap);
    if (performed && wasAvoiding) {
      relapses += 1;
      wasAvoiding = false;
    } else if (!performed) {
      wasAvoiding = true;
    }
  }

  return relapses;
};

/** Bad habit occurrences in the last N days (scheduled days only). */
export const calculateOccurrencesInPeriod = (habit, days, precomputedMap = null) => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  const range = getScheduledDates(habit, subDays(today, days - 1), today);
  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  return range.filter((date) => isBadHabitOccurrenceOnDate(habit, date, historyMap)).length;
};

/** Penalty impact — % of scheduled days the bad habit was performed (last N days). */
export const calculateBadHabitPenaltyImpact = (habit, days = 30, precomputedMap = null) => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  const range = getScheduledDates(habit, subDays(today, days - 1), today);
  if (range.length === 0) return 0;
  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  const occurrences = range.filter((date) => isBadHabitOccurrenceOnDate(habit, date, historyMap)).length;
  return Math.round((occurrences / range.length) * 100);
};

// ─── Aggregated Metrics ─────────────────────────────────────────────────────

/** Derive per-habit metrics object, reusing historyMap and scheduled ranges. */
export const deriveHabitMetrics = (habit, precomputedMap = null) => {
  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  const fullScheduled = getScheduledDates(habit, habit.startDate, getToday());

  const current = calculateStreak(habit, historyMap);
  const longest = calculateLongestStreak(habit, historyMap, fullScheduled);

  return {
    currentStreak: habit.type === 'good' ? current : 0,
    longestStreak: habit.type === 'good' ? longest : 0,
    avoidanceStreak: habit.type === 'bad' ? current : 0,
    longestAvoidanceStreak: habit.type === 'bad' ? longest : 0,
    successRate: calculateSuccessRate(habit, 30, historyMap),
    totalSuccesses: calculateTotalSuccesses(habit, historyMap, fullScheduled),
    occurrences: calculateTimesPerformed(habit),
    relapseCount: calculateRelapseCount(habit, historyMap, fullScheduled),
    penaltyImpact: calculateBadHabitPenaltyImpact(habit, 30, historyMap),
  };
};

/** Derive overall analytics across all habits. */
export const deriveOverallAnalytics = (habits) => {
  const today = getToday();

  let totalPossible = 0;
  let totalSuccesses = 0;

  for (const habit of habits) {
    const range = getScheduledDates(habit, habit.startDate, today);
    const historyMap = buildHistoryMap(habit.history);

    for (const date of range) {
      if (date < today) {
        totalPossible += 1;
        if (isHabitSuccessOnDate(habit, date, historyMap)) {
          totalSuccesses += 1;
        }
      } else if (date === today) {
        if (habit.type === 'good') {
          if (historyMap.get(today)?.completed) {
            totalPossible += 1;
            totalSuccesses += 1;
          }
        } else {
          totalPossible += 1;
          if (!isBadHabitOccurrenceOnDate(habit, today, historyMap)) {
            totalSuccesses += 1;
          }
        }
      }
    }
  }

  const goodHabits = habits.filter((h) => h.type === 'good');
  const badHabits = habits.filter((h) => h.type === 'bad');
  const goodActiveToday = goodHabits.filter((h) => h.startDate <= today);
  const badActiveToday = badHabits.filter((h) => h.startDate <= today);

  const badPerformedToday = badActiveToday.filter((h) => {
    const historyMap = buildHistoryMap(h.history);
    return isBadHabitOccurrenceOnDate(h, today, historyMap);
  }).length;

  return {
    successRate: totalPossible === 0 ? 0 : Math.round((totalSuccesses / totalPossible) * 100),
    totalHabits: habits.length,
    good: {
      total: goodHabits.length,
      completedToday: goodActiveToday.filter((h) => {
        const historyMap = buildHistoryMap(h.history);
        return Boolean(historyMap.get(today)?.completed);
      }).length,
      completionRate: goodHabits.length === 0
        ? 0
        : Math.round(goodHabits.reduce((sum, h) => sum + calculateSuccessRate(h), 0) / goodHabits.length),
      currentStreak: goodHabits.length === 0 ? 0 : Math.max(...goodHabits.map(calculateStreak)),
      longestStreak: goodHabits.length === 0 ? 0 : Math.max(...goodHabits.map(calculateLongestStreak)),
    },
    bad: {
      total: badHabits.length,
      avoidedToday: badActiveToday.length - badPerformedToday,
      performedToday: badPerformedToday,
      avoidanceRate: badHabits.length === 0
        ? 0
        : Math.round(badHabits.reduce((sum, h) => sum + calculateSuccessRate(h), 0) / badHabits.length),
      bestAvoidanceStreak: badHabits.length === 0 ? 0 : Math.max(...badHabits.map(calculateStreak)),
      longestAvoidanceStreak: badHabits.length === 0 ? 0 : Math.max(...badHabits.map(calculateLongestStreak)),
      totalRelapses: badHabits.reduce((sum, h) => sum + calculateRelapseCount(h), 0),
      totalOccurrences: badHabits.reduce((sum, h) => sum + calculateTimesPerformed(h), 0),
      totalAvoidedDays: badHabits.reduce((sum, h) => sum + calculateTotalSuccesses(h), 0),
      occurrencesThisWeek: badHabits.reduce((sum, h) => sum + calculateOccurrencesInPeriod(h, 7), 0),
      occurrencesThisMonth: badHabits.reduce((sum, h) => sum + calculateOccurrencesInPeriod(h, 30), 0),
      penaltyImpact: badHabits.length === 0
        ? 0
        : Math.round(badHabits.reduce((sum, h) => sum + calculateBadHabitPenaltyImpact(h), 0) / badHabits.length),
    },
  };
};

// ─── Trend / Chart Data Generators ──────────────────────────────────────────

/** Completion trend for good habits over the last N days. */
export const getCompletionTrend = (habits, days = 30) => {
  const today = getToday();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const goodHabits = habits.filter(
      (h) => h.type === 'good' && h.startDate <= date && isDateScheduled(h, date)
    );
    const completed = goodHabits.filter((h) => {
      const historyMap = buildHistoryMap(h.history);
      return Boolean(historyMap.get(date)?.completed);
    }).length;

    const notCompleted = goodHabits.length - completed;
    const isToday = date === today;
    const missed = isToday ? 0 : notCompleted;
    const pending = isToday ? notCompleted : 0;

    result.push({
      date,
      completed,
      missed,
      pending,
      total: goodHabits.length,
      rate: goodHabits.length === 0 ? 0 : Math.round((completed / goodHabits.length) * 100),
      isToday,
    });
  }
  return result;
};

/** Bad habit trend over the last N days. */
export const getBadHabitTrend = (habits, days = 30) => {
  const today = getToday();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const badHabits = habits.filter(
      (h) => h.type === 'bad' && h.startDate <= date && isDateScheduled(h, date)
    );
    const occurrences = badHabits.filter((h) => {
      const historyMap = buildHistoryMap(h.history);
      return isBadHabitOccurrenceOnDate(h, date, historyMap);
    }).length;
    result.push({ date, avoided: badHabits.length - occurrences, occurrences, total: badHabits.length });
  }
  return result;
};

/** Per-habit success trend over the last N days (frequency-aware). */
export const getHabitSuccessTrend = (habit, days = 30, precomputedMap = null) => {
  const today = getToday();
  const historyMap = precomputedMap || buildHistoryMap(habit.history);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const scheduled = isDateScheduled(habit, date) && habit.startDate <= date;
    const isToday = date === today;

    let status = 'unscheduled';
    let successes = 0;
    let failures = 0;
    let pending = 0;

    if (scheduled) {
      if (habit.type === 'good') {
        const isCompleted = Boolean(historyMap.get(date)?.completed);
        if (isCompleted) {
          status = 'completed';
          successes = 1;
        } else if (isToday) {
          status = 'pending';
          pending = 1;
        } else {
          status = 'missed';
          failures = 1;
        }
      } else {
        const performed = isBadHabitOccurrenceOnDate(habit, date, historyMap);
        if (performed) {
          status = 'performed';
          failures = 1;
        } else {
          status = 'avoided';
          successes = 1;
        }
      }
    }

    result.push({
      date,
      scheduled,
      status,
      successes,
      failures,
      pending,
      total: scheduled ? 1 : 0,
      isToday,
    });
  }
  return result;
};

/** Weekly completion data (4 weeks, good habits, frequency-aware). */
export const getWeeklyData = (habits) => {
  const today = getToday();
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const weekEnd = subDays(today, i * 7);
    let total = 0;
    let completed = 0;
    for (let d = 0; d < 7; d++) {
      const date = subDays(weekEnd, d);
      const goodHabits = habits.filter(
        (h) => h.type === 'good' && h.startDate <= date && isDateScheduled(h, date)
      );
      total += goodHabits.length;
      completed += goodHabits.filter((h) => {
        const historyMap = buildHistoryMap(h.history);
        return Boolean(historyMap.get(date)?.completed);
      }).length;
    }
    const label = `W${4 - i}`;
    weeks.push({ week: label, rate: total === 0 ? 0 : Math.round((completed / total) * 100) });
  }
  return weeks;
};

/** Monthly completion data (6 months, good habits, frequency-aware). */
export const getMonthlyData = (habits) => {
  const months = [];
  const todayDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const end = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    let total = 0;
    let completed = 0;
    const range = getDaysInRange(start, end);
    range.forEach((date) => {
      const goodHabits = habits.filter(
        (h) => h.type === 'good' && h.startDate <= date && isDateScheduled(h, date)
      );
      total += goodHabits.length;
      completed += goodHabits.filter((h) => {
        const historyMap = buildHistoryMap(h.history);
        return Boolean(historyMap.get(date)?.completed);
      }).length;
    });
    months.push({ month: monthName, rate: total === 0 ? 0 : Math.round((completed / total) * 100) });
  }
  return months;
};

/** Habit comparison — success rate for each habit. */
export const getHabitComparison = (habits) => {
  return habits.map((habit) => ({
    name: habit.name,
    rate: calculateSuccessRate(habit, 30),
    type: habit.type,
  }));
};

/** Today's status for good habits. */
export const getOverallStatus = (habits) => {
  const today = getToday();
  const goodHabits = habits.filter(
    (h) => h.type === 'good' && h.startDate <= today && isDateScheduled(h, today)
  );
  let completed = 0;
  let pending = 0;

  goodHabits.forEach((habit) => {
    const historyMap = buildHistoryMap(habit.history);
    const record = historyMap.get(today);
    if (record?.completed) {
      completed++;
    } else {
      pending++;
    }
  });

  return { completed, missed: 0, pending, total: goodHabits.length };
};

/** Good vs Bad stats for today. */
export const getGoodVsBadStats = (habits) => {
  const today = getToday();
  const goodHabits = habits.filter(
    (h) => h.type === 'good' && h.startDate <= today && isDateScheduled(h, today)
  );
  const badHabits = habits.filter(
    (h) => h.type === 'bad' && h.startDate <= today && isDateScheduled(h, today)
  );

  const goodCompleted = goodHabits.filter((h) => {
    const historyMap = buildHistoryMap(h.history);
    return Boolean(historyMap.get(today)?.completed);
  }).length;

  const badPerformed = badHabits.filter((h) => {
    const historyMap = buildHistoryMap(h.history);
    return isBadHabitOccurrenceOnDate(h, today, historyMap);
  }).length;

  return {
    goodCompleted,
    badAvoided: badHabits.length - badPerformed,
    badPerformed,
    badTotal: badHabits.length,
  };
};

/** Growth score — month-over-month improvement. */
export const calculateGrowthScore = (habits) => {
  if (habits.length === 0) return 0;
  const today = getToday();
  const prevMonthEnd = subDays(today, 30);
  const prevMonthStart = subDays(prevMonthEnd, 30);

  let currentScore = 0;
  let prevScore = 0;

  for (const habit of habits) {
    const currentRange = getScheduledDates(habit, subDays(today, 29), today);
    const prevRange = getScheduledDates(habit, prevMonthStart, prevMonthEnd);
    const historyMap = buildHistoryMap(habit.history);

    const currentCompleted = currentRange.filter((d) => isHabitSuccessOnDate(habit, d, historyMap)).length;
    const prevCompleted = prevRange.filter((d) => isHabitSuccessOnDate(habit, d, historyMap)).length;
    const currentOccurrences = currentRange.filter((d) => isBadHabitOccurrenceOnDate(habit, d, historyMap)).length;
    const prevOccurrences = prevRange.filter((d) => isBadHabitOccurrenceOnDate(habit, d, historyMap)).length;

    if (habit.type === 'good') {
      currentScore += currentCompleted;
      prevScore += prevCompleted;
    } else {
      currentScore -= currentOccurrences;
      prevScore -= prevOccurrences;
    }
  }

  if (prevScore === 0) return currentScore > 0 ? 100 : 0;
  return Math.round(((currentScore - prevScore) / Math.abs(prevScore)) * 100);
};

/** Overall success rate across all habits (frequency-aware, elapsed denominator). */
export const calculateOverallSuccessRate = (habits) => {
  if (habits.length === 0) return 0;
  const today = getToday();
  let totalPossible = 0;
  let totalSuccesses = 0;

  for (const habit of habits) {
    const range = getScheduledDates(habit, habit.startDate, today);
    const historyMap = buildHistoryMap(habit.history);

    for (const date of range) {
      if (date < today) {
        totalPossible += 1;
        if (isHabitSuccessOnDate(habit, date, historyMap)) {
          totalSuccesses += 1;
        }
      } else if (date === today) {
        if (habit.type === 'good') {
          if (historyMap.get(today)?.completed) {
            totalPossible += 1;
            totalSuccesses += 1;
          }
        } else {
          totalPossible += 1;
          if (!isBadHabitOccurrenceOnDate(habit, today, historyMap)) {
            totalSuccesses += 1;
          }
        }
      }
    }
  }

  return totalPossible === 0 ? 100 : Math.min(100, Math.max(0, Math.round((totalSuccesses / totalPossible) * 100)));
};

/** Daily completion rate for good habits on a specific date (frequency-aware). */
export const calculateDailyCompletionRate = (habits, date) => {
  if (habits.length === 0) return 0;
  const goodHabits = habits.filter(
    (h) => h.type === 'good' && h.startDate <= date && isDateScheduled(h, date)
  );
  if (goodHabits.length === 0) return 0;
  const completed = goodHabits.filter((h) => {
    const historyMap = buildHistoryMap(h.history);
    return Boolean(historyMap.get(date)?.completed);
  }).length;
  return Math.round((completed / goodHabits.length) * 100);
};

/** Impact score for a habit (reuses precomputed metrics when provided). */
export const getHabitImpactScore = (habit, allHabits, metrics = null) => {
  if (allHabits.length === 0) return 0;
  const m = metrics || deriveHabitMetrics(habit);
  const rate = m.successRate;
  const streak = habit.type === 'good' ? m.currentStreak : m.avoidanceStreak;
  const longest = habit.type === 'good' ? m.longestStreak : m.longestAvoidanceStreak;
  const successes = m.totalSuccesses;
  const totalDays = getScheduledDates(habit, habit.startDate, getToday()).length;
  const consistency = totalDays > 0 ? successes / totalDays : 0;
  const streakBonus = Math.min(streak / 10, 1);
  const longestBonus = Math.min(longest / 30, 1);
  const impact = (rate * 0.4 + consistency * 100 * 0.3 + streakBonus * 100 * 0.15 + longestBonus * 100 * 0.15) / 100;
  return Math.round(impact * 100);
};

/** Good habit dashboard stats. */
export const getGoodHabitDashboardStats = (habits) => {
  const today = getToday();
  const goodHabits = habits.filter((h) => h.type === 'good');
  if (goodHabits.length === 0) {
    return { completionRate: 0, currentStreak: 0, longestStreak: 0, completedToday: 0, totalGood: 0 };
  }

  const currentStreak = Math.max(...goodHabits.map(calculateStreak));
  const longestStreak = Math.max(...goodHabits.map(calculateLongestStreak));
  const completedToday = goodHabits.filter((h) => {
    const historyMap = buildHistoryMap(h.history);
    return Boolean(historyMap.get(today)?.completed);
  }).length;

  const totalRate = goodHabits.reduce((sum, h) => sum + calculateSuccessRate(h, 30), 0);
  const completionRate = Math.round(totalRate / goodHabits.length);

  return { completionRate, currentStreak, longestStreak, completedToday, totalGood: goodHabits.length };
};

/** Bad habit dashboard stats. */
export const getBadHabitDashboardStats = (habits) => {
  const badHabits = habits.filter((h) => h.type === 'bad');
  if (badHabits.length === 0) {
    return {
      bestAvoidanceStreak: 0, longestAvoidanceStreak: 0, totalRelapses: 0,
      totalOccurrences: 0, totalAvoidedDays: 0, occurrencesThisWeek: 0,
      occurrencesThisMonth: 0, avoidanceRate: 0, penaltyImpact: 0,
    };
  }

  return {
    bestAvoidanceStreak: Math.max(...badHabits.map(calculateStreak)),
    longestAvoidanceStreak: Math.max(...badHabits.map(calculateLongestStreak)),
    totalRelapses: badHabits.reduce((sum, h) => sum + calculateRelapseCount(h), 0),
    totalOccurrences: badHabits.reduce((sum, h) => sum + calculateTimesPerformed(h), 0),
    totalAvoidedDays: badHabits.reduce((sum, h) => sum + calculateTotalSuccesses(h), 0),
    occurrencesThisWeek: badHabits.reduce((sum, h) => sum + calculateOccurrencesInPeriod(h, 7), 0),
    occurrencesThisMonth: badHabits.reduce((sum, h) => sum + calculateOccurrencesInPeriod(h, 30), 0),
    avoidanceRate: Math.round(badHabits.reduce((sum, h) => sum + calculateSuccessRate(h, 30), 0) / badHabits.length),
    penaltyImpact: Math.round(badHabits.reduce((sum, h) => sum + calculateBadHabitPenaltyImpact(h), 0) / badHabits.length),
  };
};
