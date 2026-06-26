import type { Habit, HabitRecord } from '../types';

/** Format a Date to YYYY-MM-DD using local timezone */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Parse YYYY-MM-DD to a local Date (midnight) */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const isSameDay = (d1: string, d2: string): boolean => {
  return d1 === d2;
};

export const getToday = (): string => {
  return formatDate(new Date());
};

export const getDayOfWeek = (dateStr: string): number => {
  return parseDate(dateStr).getDay();
};

export const addDays = (dateStr: string, days: number): string => {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

export const subDays = (dateStr: string, days: number): string => {
  return addDays(dateStr, -days);
};

export const startOfWeek = (dateStr: string): string => {
  const d = parseDate(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return formatDate(d);
};

export const startOfMonth = (dateStr: string): string => {
  const d = parseDate(dateStr);
  d.setDate(1);
  return formatDate(d);
};

export const endOfMonth = (dateStr: string): string => {
  const d = parseDate(dateStr);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return formatDate(d);
};

export const getDaysInRange = (start: string, end: string): string[] => {
  const days: string[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const categories = [
  'Health',
  'Fitness',
  'Learning',
  'Productivity',
  'Mindfulness',
  'Social',
  'Finance',
  'Creative',
  'Other',
];

export const getCategoryIcon = (category: string): string => {
  const map: Record<string, string> = {
    Health: 'Heart',
    Fitness: 'Dumbbell',
    Learning: 'BookOpen',
    Productivity: 'Briefcase',
    Mindfulness: 'Brain',
    Social: 'Users',
    Finance: 'Wallet',
    Creative: 'Palette',
    Other: 'Tag',
  };
  return map[category] || 'Tag';
};

export const getHabitRecord = (habit: Habit, date: string): HabitRecord | undefined => {
  return habit.history.find((h) => h.date === date);
};

export const getRecentHistory = (habit: Habit, days: number = 30): HabitRecord[] => {
  const today = getToday();
  const start = subDays(today, days - 1);
  const range = getDaysInRange(start, today);
  return range.map((date) => {
    const record = habit.history.find((h) => h.date === date);
    return record || { date, completed: false };
  });
};
