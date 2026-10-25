import type { Habit } from '../types';
import { getToday, subDays, getDaysInRange, getHabitRecord, formatDate, isDateScheduled } from './helpers';

export const getHabitActiveDates = (habit: Habit, start: string, end: string): string[] => {
  const activeStart = start > habit.startDate ? start : habit.startDate;
  if (activeStart > end) return [];
  return getDaysInRange(activeStart, end);
};

export const isBadHabitOccurrenceOnDate = (habit: Habit, date: string): boolean => {
  if (habit.type !== 'bad' || date < habit.startDate) return false;
  return Boolean(getHabitRecord(habit, date)?.completed);
};

export const isHabitSuccessOnDate = (habit: Habit, date: string): boolean => {
  if (date < habit.startDate) return false;
  const record = getHabitRecord(habit, date);
  return habit.type === 'good' ? Boolean(record?.completed) : !record?.completed;
};

/**
 * Calculate the current streak for a habit.
 * - Good habit: consecutive COMPLETED days from today backward.
 * - Bad habit:  consecutive AVOIDED days (not completed) from today backward.
 */
export const calculateStreak = (habit: Habit): number => {
  const today = getToday();
  if (habit.startDate > today) return 0;

  let streak = 0;
  let current = today;

  while (current >= habit.startDate) {
    const record = getHabitRecord(habit, current);
    const isSuccess = isHabitSuccessOnDate(habit, current);

    if (isSuccess) {
      // For bad habits on today with no record, still count as avoided
      // For good habits on today with no record, skip to yesterday
      if (habit.type === 'good' && current === today && !record) {
        current = subDays(current, 1);
        continue;
      }
      streak++;
      current = subDays(current, 1);
    } else if (habit.type === 'good' && current === today && !record) {
      // Good habit: today not yet checked, skip to yesterday
      current = subDays(current, 1);
    } else {
      break;
    }
  }
  return streak;
};

/**
 * Calculate the longest streak for a habit.
 * - Good habit: longest run of completed=true in history.
 * - Bad habit:  longest run of avoided days (not completed) across the full date range.
 */
export const calculateLongestStreak = (habit: Habit): number => {
  const range = getHabitActiveDates(habit, habit.startDate, getToday());
  let maxStreak = 0;
  let currentStreak = 0;

  for (const date of range) {
    if (isHabitSuccessOnDate(habit, date)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

/**
 * Calculate the success rate for a habit over the last N days.
 * - Good habit: % of days completed.
 * - Bad habit:  % of days AVOIDED (not completed).
 *
 * Renamed from calculateCompletionRate to reflect type-aware semantics.
 */
export const calculateSuccessRate = (habit: Habit, days: number = 30): number => {
  const today = getToday();
  const start = subDays(today, days - 1);
  const range = getHabitActiveDates(habit, start, today).filter((d) => isDateScheduled(habit, d));
  if (range.length === 0) return 0;

  let eligibleDenominator = 0;
  let successes = 0;

  for (const date of range) {
    if (date < today) {
      eligibleDenominator += 1;
      if (isHabitSuccessOnDate(habit, date)) successes += 1;
    } else if (date === today) {
      if (habit.type === 'good') {
        const isDone = Boolean(getHabitRecord(habit, today)?.completed);
        if (isDone) {
          eligibleDenominator += 1;
          successes += 1;
        }
        // If not completed yet today, it is pending; do not penalize denominator
      } else {
        const performed = isBadHabitOccurrenceOnDate(habit, today);
        eligibleDenominator += 1;
        if (!performed) successes += 1;
      }
    }
  }

  if (eligibleDenominator === 0) return 100;
  return Math.min(100, Math.max(0, Math.round((successes / eligibleDenominator) * 100)));
};

/**
 * @deprecated Use calculateSuccessRate instead. Kept for backward compatibility.
 */
export const calculateCompletionRate = calculateSuccessRate;

/**
 * Calculate total successes for a habit.
 * - Good habit: count of completed days.
 * - Bad habit:  count of AVOIDED days (total days since start minus times performed).
 */
export const calculateTotalSuccesses = (habit: Habit): number => {
  const range = getHabitActiveDates(habit, habit.startDate, getToday());
  return range.filter((date) => isHabitSuccessOnDate(habit, date)).length;
};

/**
 * @deprecated Use calculateTotalSuccesses instead. Kept for backward compatibility.
 */
export const calculateTotalCompletions = calculateTotalSuccesses;

/**
 * Count the number of times a bad habit was actually performed.
 * For good habits, returns 0 (not applicable).
 */
export const calculateTimesPerformed = (habit: Habit): number => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  return habit.history.filter((h) => h.completed && h.date >= habit.startDate && h.date <= today).length;
};

export const calculateOccurrenceCount = calculateTimesPerformed;

/**
 * Count the number of times a bad habit broke an avoidance streak (relapses).
 * A relapse = a day the bad habit was performed that was preceded by at least
 * one day of avoidance. The very first performance is also counted as a relapse.
 * For good habits, returns 0.
 */
export const calculateRelapseCount = (habit: Habit): number => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  const range = getDaysInRange(habit.startDate, today);
  let relapses = 0;
  let wasAvoiding = true; // Start as "avoiding" (no prior history)

  for (const date of range) {
    const performed = isBadHabitOccurrenceOnDate(habit, date);
    if (performed && wasAvoiding) {
      relapses++;
      wasAvoiding = false;
    } else if (!performed) {
      wasAvoiding = true;
    }
  }
  return relapses;
};

/**
 * Count how many times a bad habit was performed in the last N days.
 * For good habits, returns 0.
 */
export const calculateOccurrencesInPeriod = (habit: Habit, days: number): number => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  const start = subDays(today, days - 1);
  const range = getHabitActiveDates(habit, start, today);
  return range.filter((date) => isBadHabitOccurrenceOnDate(habit, date)).length;
};

export const calculateBadHabitPenaltyImpact = (habit: Habit, days: number = 30): number => {
  if (habit.type === 'good') return 0;
  const today = getToday();
  const start = subDays(today, days - 1);
  const range = getHabitActiveDates(habit, start, today);
  if (range.length === 0) return 0;
  const occurrences = range.filter((date) => isBadHabitOccurrenceOnDate(habit, date)).length;
  return Math.round((occurrences / range.length) * 100);
};

/**
 * Aggregated bad habit metrics for dashboard display.
 * Returns stats across ALL bad habits:
 * - bestAvoidanceStreak: best current avoidance streak among all bad habits
 * - longestAvoidanceStreak: best all-time avoidance streak among all bad habits
 * - totalRelapses: sum of relapse counts across all bad habits
 * - occurrencesThisWeek: total bad habit performances in last 7 days
 * - occurrencesThisMonth: total bad habit performances in last 30 days
 * - avoidanceRate: overall avoidance rate across all bad habits (30 days)
 */
export const getBadHabitDashboardStats = (habits: Habit[]): {
  bestAvoidanceStreak: number;
  longestAvoidanceStreak: number;
  totalRelapses: number;
  totalOccurrences: number;
  totalAvoidedDays: number;
  occurrencesThisWeek: number;
  occurrencesThisMonth: number;
  avoidanceRate: number;
  penaltyImpact: number;
} => {
  const badHabits = habits.filter((h) => h.type === 'bad');
  if (badHabits.length === 0) {
    return {
      bestAvoidanceStreak: 0,
      longestAvoidanceStreak: 0,
      totalRelapses: 0,
      totalOccurrences: 0,
      totalAvoidedDays: 0,
      occurrencesThisWeek: 0,
      occurrencesThisMonth: 0,
      avoidanceRate: 0,
      penaltyImpact: 0,
    };
  }

  const bestAvoidanceStreak = Math.max(...badHabits.map(calculateStreak));
  const longestAvoidanceStreak = Math.max(...badHabits.map(calculateLongestStreak));
  const totalRelapses = badHabits.reduce((sum, h) => sum + calculateRelapseCount(h), 0);
  const totalOccurrences = badHabits.reduce((sum, h) => sum + calculateTimesPerformed(h), 0);
  const totalAvoidedDays = badHabits.reduce((sum, h) => sum + calculateTotalSuccesses(h), 0);
  const occurrencesThisWeek = badHabits.reduce((sum, h) => sum + calculateOccurrencesInPeriod(h, 7), 0);
  const occurrencesThisMonth = badHabits.reduce((sum, h) => sum + calculateOccurrencesInPeriod(h, 30), 0);

  // Average avoidance rate across all bad habits (30-day window)
  const totalRate = badHabits.reduce((sum, h) => sum + calculateSuccessRate(h, 30), 0);
  const avoidanceRate = Math.round(totalRate / badHabits.length);
  const totalPenalty = badHabits.reduce((sum, h) => sum + calculateBadHabitPenaltyImpact(h, 30), 0);
  const penaltyImpact = Math.round(totalPenalty / badHabits.length);

  return {
    bestAvoidanceStreak,
    longestAvoidanceStreak,
    totalRelapses,
    totalOccurrences,
    totalAvoidedDays,
    occurrencesThisWeek,
    occurrencesThisMonth,
    avoidanceRate,
    penaltyImpact,
  };
};

/**
 * Aggregated good habit metrics for dashboard display.
 */
export const getGoodHabitDashboardStats = (habits: Habit[]): {
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  completedToday: number;
  totalGood: number;
} => {
  const today = getToday();
  const goodHabits = habits.filter((h) => h.type === 'good');
  if (goodHabits.length === 0) {
    return { completionRate: 0, currentStreak: 0, longestStreak: 0, completedToday: 0, totalGood: 0 };
  }

  const currentStreak = Math.max(...goodHabits.map(calculateStreak));
  const longestStreak = Math.max(...goodHabits.map(calculateLongestStreak));
  const completedToday = goodHabits.filter((h) => {
    const record = getHabitRecord(h, today);
    return record && record.completed;
  }).length;

  // Average completion rate across all good habits (30-day window)
  const totalRate = goodHabits.reduce((sum, h) => sum + calculateSuccessRate(h, 30), 0);
  const completionRate = Math.round(totalRate / goodHabits.length);

  return { completionRate, currentStreak, longestStreak, completedToday, totalGood: goodHabits.length };
};

/**
 * Calculate overall success rate across all habits.
 * - Good habits contribute success for each day completed.
 * - Bad habits contribute success for each day AVOIDED.
 * Result is always between 0% and 100%.
 */
export const calculateOverallSuccessRate = (habits: Habit[]): number => {
  if (habits.length === 0) return 0;
  const today = getToday();
  let totalPossible = 0;
  let totalSuccesses = 0;

  habits.forEach((habit) => {
    const range = getHabitActiveDates(habit, habit.startDate, today).filter((d) => isDateScheduled(habit, d));
    for (const date of range) {
      if (date < today) {
        totalPossible += 1;
        if (isHabitSuccessOnDate(habit, date)) totalSuccesses += 1;
      } else if (date === today) {
        if (habit.type === 'good') {
          if (getHabitRecord(habit, today)?.completed) {
            totalPossible += 1;
            totalSuccesses += 1;
          }
        } else {
          totalPossible += 1;
          if (!isBadHabitOccurrenceOnDate(habit, today)) totalSuccesses += 1;
        }
      }
    }
  });

  return totalPossible === 0 ? 100 : Math.min(100, Math.max(0, Math.round((totalSuccesses / totalPossible) * 100)));
};

/**
 * Calculate daily completion rate for GOOD habits only on a specific date.
 * (Already correct — no changes needed.)
 */
export const calculateDailyCompletionRate = (habits: Habit[], date: string): number => {
  if (habits.length === 0) return 0;
  const goodHabits = habits.filter((h) => h.type === 'good' && h.startDate <= date);
  if (goodHabits.length === 0) return 0;
  const completed = goodHabits.filter((h) => {
    const record = getHabitRecord(h, date);
    return record && record.completed;
  }).length;
  return Math.round((completed / goodHabits.length) * 100);
};

export const calculateWeeklyCompletionRate = (habits: Habit[]): number => {
  const today = getToday();
  let total = 0;
  let completed = 0;
  for (let i = 0; i < 7; i++) {
    const date = subDays(today, i);
    const dayRate = calculateDailyCompletionRate(habits, date);
    total += 100;
    completed += dayRate;
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
};

export const calculateMonthlyCompletionRate = (habits: Habit[]): number => {
  const today = getToday();
  let total = 0;
  let completed = 0;
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const dayRate = calculateDailyCompletionRate(habits, date);
    total += 100;
    completed += dayRate;
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
};

/**
 * Growth score: month-over-month improvement.
 * (Already correct — subtracts bad habit completions.)
 */
export const calculateGrowthScore = (habits: Habit[]): number => {
  if (habits.length === 0) return 0;
  const today = getToday();
  const prevMonthEnd = subDays(today, 30);
  const prevMonthStart = subDays(prevMonthEnd, 30);

  let currentScore = 0;
  let prevScore = 0;

  habits.forEach((habit) => {
    const currentRange = getHabitActiveDates(habit, subDays(today, 29), today);
    const prevRange = getHabitActiveDates(habit, prevMonthStart, prevMonthEnd);

    const currentCompleted = currentRange.filter((d) => isHabitSuccessOnDate(habit, d)).length;
    const prevCompleted = prevRange.filter((d) => isHabitSuccessOnDate(habit, d)).length;
    const currentOccurrences = currentRange.filter((d) => isBadHabitOccurrenceOnDate(habit, d)).length;
    const prevOccurrences = prevRange.filter((d) => isBadHabitOccurrenceOnDate(habit, d)).length;

    if (habit.type === 'good') {
      currentScore += currentCompleted;
      prevScore += prevCompleted;
    } else {
      currentScore -= currentOccurrences;
      prevScore -= prevOccurrences;
    }
  });

  if (prevScore === 0) return currentScore > 0 ? 100 : 0;
  return Math.round(((currentScore - prevScore) / Math.abs(prevScore)) * 100);
};

/**
 * Completion trend for GOOD habits only.
 * (Already correct — filters to good habits.)
 */
export const getCompletionTrend = (
  habits: Habit[],
  days: number = 30
): { date: string; completed: number; total: number; missed: number; pending: number; isToday: boolean }[] => {
  const today = getToday();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const goodHabits = habits.filter((h) => h.type === 'good' && h.startDate <= date && isDateScheduled(h, date));
    const completed = goodHabits.filter((h) => {
      const record = getHabitRecord(h, date);
      return record && record.completed;
    }).length;
    const notCompleted = goodHabits.length - completed;
    const isToday = date === today;
    const missed = isToday ? 0 : notCompleted;
    const pending = isToday ? notCompleted : 0;
    result.push({ date, completed, total: goodHabits.length, missed, pending, isToday });
  }
  return result;
};

export const getBadHabitTrend = (habits: Habit[], days: number = 30): { date: string; avoided: number; occurrences: number; total: number }[] => {
  const today = getToday();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const badHabits = habits.filter((h) => h.type === 'bad' && h.startDate <= date && isDateScheduled(h, date));
    const occurrences = badHabits.filter((h) => isBadHabitOccurrenceOnDate(h, date)).length;
    result.push({ date, avoided: badHabits.length - occurrences, occurrences, total: badHabits.length });
  }
  return result;
};

export const getHabitSuccessTrend = (
  habit: Habit,
  days: number = 30
): { date: string; successes: number; failures: number; total: number; status: string; pending: number; isToday: boolean }[] => {
  const today = getToday();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const scheduled = habit.startDate <= date && isDateScheduled(habit, date);
    const isToday = date === today;
    let status = 'unscheduled';
    let successes = 0;
    let failures = 0;
    let pending = 0;

    if (scheduled) {
      if (habit.type === 'good') {
        const isDone = Boolean(getHabitRecord(habit, date)?.completed);
        if (isDone) {
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
        const performed = isBadHabitOccurrenceOnDate(habit, date);
        if (performed) {
          status = 'performed';
          failures = 1;
        } else {
          status = 'avoided';
          successes = 1;
        }
      }
    }
    result.push({ date, successes, failures, total: scheduled ? 1 : 0, status, pending, isToday });
  }
  return result;
};

export const getWeeklyData = (habits: Habit[]): { week: string; rate: number }[] => {
  const today = getToday();
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const weekEnd = subDays(today, i * 7);
    let total = 0;
    let completed = 0;
    for (let d = 0; d < 7; d++) {
      const date = subDays(weekEnd, d);
      const goodHabits = habits.filter((h) => h.type === 'good' && h.startDate <= date);
      total += goodHabits.length;
      completed += goodHabits.filter((h) => {
        const record = getHabitRecord(h, date);
        return record && record.completed;
      }).length;
    }
    const label = `W${4 - i}`;
    weeks.push({ week: label, rate: total === 0 ? 0 : Math.round((completed / total) * 100) });
  }
  return weeks;
};

export const getMonthlyData = (habits: Habit[]): { month: string; rate: number }[] => {
  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const start = formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
    const end = formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    let total = 0;
    let completed = 0;
    const range = getDaysInRange(start, end);
    range.forEach((date) => {
      const goodHabits = habits.filter((h) => h.type === 'good' && h.startDate <= date);
      total += goodHabits.length;
      completed += goodHabits.filter((h) => {
        const record = getHabitRecord(h, date);
        return record && record.completed;
      }).length;
    });
    months.push({ month: monthName, rate: total === 0 ? 0 : Math.round((completed / total) * 100) });
  }
  return months;
};

/**
 * Habit comparison: shows SUCCESS rate for each habit.
 * - Good habits: completion rate (days completed / total).
 * - Bad habits:  avoidance rate (days avoided / total).
 * Now uses calculateSuccessRate instead of raw completion.
 */
export const getHabitComparison = (habits: Habit[]): { name: string; rate: number; type: 'good' | 'bad' }[] => {
  return habits.map((habit) => ({
    name: habit.name,
    rate: calculateSuccessRate(habit, 30),
    type: habit.type,
  }));
};

/**
 * Today's status for GOOD habits only.
 * (Already correct — filters to good habits.)
 */
export const getOverallStatus = (habits: Habit[]): { completed: number; missed: number; pending: number } => {
  const today = getToday();
  const goodHabits = habits.filter((h) => h.type === 'good' && h.startDate <= today);
  let completed = 0;
  let missed = 0;
  let pending = 0;

  goodHabits.forEach((habit) => {
    const record = getHabitRecord(habit, today);
    if (record) {
      if (record.completed) completed++;
      else missed++;
    } else {
      pending++;
    }
  });

  return { completed, missed, pending };
};

/**
 * Good vs Bad stats for today.
 * - goodCompleted: good habits completed today
 * - badAvoided: bad habits NOT performed today (success)
 * - badPerformed: bad habits performed today (failure)
 */
export const getGoodVsBadStats = (habits: Habit[]): { goodCompleted: number; badAvoided: number; badPerformed: number; badTotal: number } => {
  const today = getToday();
  const goodHabits = habits.filter((h) => h.type === 'good' && h.startDate <= today);
  const badHabits = habits.filter((h) => h.type === 'bad' && h.startDate <= today);

  const goodCompleted = goodHabits.filter((h) => {
    const record = getHabitRecord(h, today);
    return record && record.completed;
  }).length;

  const badPerformed = badHabits.filter((h) => isBadHabitOccurrenceOnDate(h, today)).length;

  const badAvoided = badHabits.length - badPerformed;

  return { goodCompleted, badAvoided, badPerformed, badTotal: badHabits.length };
};

/**
 * Calculate impact score for a habit using type-aware metrics.
 * All sub-calculations (streak, success rate, consistency) now
 * properly account for good vs bad habit semantics.
 */
export const getHabitImpactScore = (habit: Habit, allHabits: Habit[]): number => {
  if (allHabits.length === 0) return 0;
  const rate = calculateSuccessRate(habit, 30);
  const streak = calculateStreak(habit);
  const longest = calculateLongestStreak(habit);
  const successes = calculateTotalSuccesses(habit);
  const totalDays = getHabitActiveDates(habit, habit.startDate, getToday()).length;
  const consistency = totalDays > 0 ? successes / totalDays : 0;
  const streakBonus = Math.min(streak / 10, 1);
  const longestBonus = Math.min(longest / 30, 1);
  const impact = (rate * 0.4 + consistency * 100 * 0.3 + streakBonus * 100 * 0.15 + longestBonus * 100 * 0.15) / 100;
  return Math.round(impact * 100);
};
