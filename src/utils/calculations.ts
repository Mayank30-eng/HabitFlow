import type { Habit } from '../types';
import { getToday, subDays, addDays, getDaysInRange, parseDate, getHabitRecord } from './helpers';

export const calculateStreak = (habit: Habit): number => {
  const today = getToday();
  let streak = 0;
  let current = today;

  while (true) {
    const record = getHabitRecord(habit, current);
    if (record && record.completed) {
      streak++;
      current = subDays(current, 1);
    } else if (current === today && !record) {
      // Today not yet checked, skip to yesterday
      current = subDays(current, 1);
    } else {
      break;
    }
  }
  return streak;
};

export const calculateLongestStreak = (habit: Habit): number => {
  const sortedHistory = [...habit.history].sort((a, b) => a.date.localeCompare(b.date));
  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < sortedHistory.length; i++) {
    if (sortedHistory[i].completed) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  return maxStreak;
};

export const calculateCompletionRate = (habit: Habit, days: number = 30): number => {
  const today = getToday();
  const start = subDays(today, days - 1);
  const range = getDaysInRange(start, today);
  const completed = range.filter((date) => {
    const record = getHabitRecord(habit, date);
    return record && record.completed;
  }).length;
  return Math.round((completed / range.length) * 100);
};

export const calculateTotalCompletions = (habit: Habit): number => {
  return habit.history.filter((h) => h.completed).length;
};

export const calculateOverallSuccessRate = (habits: Habit[]): number => {
  if (habits.length === 0) return 0;
  let total = 0;
  let completed = 0;
  habits.forEach((habit) => {
    const today = getToday();
    const start = habit.startDate;
    const range = getDaysInRange(start, today);
    total += range.length;
    completed += range.filter((date) => {
      const record = getHabitRecord(habit, date);
      return record && record.completed;
    }).length;
  });
  return total === 0 ? 0 : Math.round((completed / total) * 100);
};

export const calculateDailyCompletionRate = (habits: Habit[], date: string): number => {
  if (habits.length === 0) return 0;
  const goodHabits = habits.filter((h) => h.type === 'good');
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

export const calculateGrowthScore = (habits: Habit[]): number => {
  if (habits.length === 0) return 0;
  const today = getToday();
  const prevMonthEnd = subDays(today, 30);
  const prevMonthStart = subDays(prevMonthEnd, 30);

  let currentScore = 0;
  let prevScore = 0;

  habits.forEach((habit) => {
    const currentRange = getDaysInRange(subDays(today, 30), today);
    const prevRange = getDaysInRange(prevMonthStart, prevMonthEnd);

    const currentCompleted = currentRange.filter((d) => {
      const r = getHabitRecord(habit, d);
      return r && r.completed;
    }).length;
    const prevCompleted = prevRange.filter((d) => {
      const r = getHabitRecord(habit, d);
      return r && r.completed;
    }).length;

    if (habit.type === 'good') {
      currentScore += currentCompleted;
      prevScore += prevCompleted;
    } else {
      currentScore -= currentCompleted;
      prevScore -= prevCompleted;
    }
  });

  if (prevScore === 0) return currentScore > 0 ? 100 : 0;
  return Math.round(((currentScore - prevScore) / Math.abs(prevScore)) * 100);
};

export const getCompletionTrend = (habits: Habit[], days: number = 30): { date: string; completed: number; total: number }[] => {
  const today = getToday();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const goodHabits = habits.filter((h) => h.type === 'good');
    const completed = goodHabits.filter((h) => {
      const record = getHabitRecord(h, date);
      return record && record.completed;
    }).length;
    result.push({ date, completed, total: goodHabits.length });
  }
  return result;
};

export const getWeeklyData = (habits: Habit[]): { week: string; rate: number }[] => {
  const today = getToday();
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const weekEnd = subDays(today, i * 7);
    const weekStart = subDays(weekEnd, 6);
    let total = 0;
    let completed = 0;
    const goodHabits = habits.filter((h) => h.type === 'good');
    for (let d = 0; d < 7; d++) {
      const date = subDays(weekEnd, d);
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
    const goodHabits = habits.filter((h) => h.type === 'good');
    let total = 0;
    let completed = 0;
    const range = getDaysInRange(start, end);
    range.forEach((date) => {
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

export const getHabitComparison = (habits: Habit[]): { name: string; rate: number; type: 'good' | 'bad' }[] => {
  return habits.map((habit) => ({
    name: habit.name,
    rate: calculateCompletionRate(habit, 30),
    type: habit.type,
  }));
};

export const getOverallStatus = (habits: Habit[]): { completed: number; missed: number; pending: number } => {
  const today = getToday();
  const goodHabits = habits.filter((h) => h.type === 'good');
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

export const getGoodVsBadStats = (habits: Habit[]): { goodCompleted: number; badPerformed: number } => {
  const today = getToday();
  const goodHabits = habits.filter((h) => h.type === 'good');
  const badHabits = habits.filter((h) => h.type === 'bad');

  const goodCompleted = goodHabits.filter((h) => {
    const record = getHabitRecord(h, today);
    return record && record.completed;
  }).length;

  const badPerformed = badHabits.filter((h) => {
    const record = getHabitRecord(h, today);
    return record && record.completed;
  }).length;

  return { goodCompleted, badPerformed };
};

export const getHabitImpactScore = (habit: Habit, allHabits: Habit[]): number => {
  if (allHabits.length === 0) return 0;
  const rate = calculateCompletionRate(habit, 30);
  const streak = calculateStreak(habit);
  const longest = calculateLongestStreak(habit);
  const completions = calculateTotalCompletions(habit);
  const totalDays = getDaysInRange(habit.startDate, getToday()).length;
  const consistency = totalDays > 0 ? completions / totalDays : 0;
  const streakBonus = Math.min(streak / 10, 1);
  const longestBonus = Math.min(longest / 30, 1);
  const impact = (rate * 0.4 + consistency * 100 * 0.3 + streakBonus * 100 * 0.15 + longestBonus * 100 * 0.15) / 100;
  return Math.round(impact * 100);
};

export const formatDate = (d: Date): string => {
  return d.toISOString().split('T')[0];
};
