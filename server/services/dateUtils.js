/**
 * Date utilities — single source of truth for date operations.
 *
 * All date strings use the YYYY-MM-DD format, interpreted as local midnight.
 */

/** Format a JS Date to YYYY-MM-DD using local timezone. */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Parse YYYY-MM-DD to a local Date (midnight). */
export const parseDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Return the day-of-week index (0=Sun … 6=Sat) for a date string. */
export const getDayOfWeek = (dateStr) => parseDate(dateStr).getDay();

/** Add `n` days to a date string (negative for subtraction). */
export const addDays = (dateStr, days) => {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

/** Subtract `n` days from a date string. */
export const subDays = (dateStr, days) => addDays(dateStr, -days);

/** Today as YYYY-MM-DD. */
export const getToday = () => formatDate(new Date());

/** Generate every date string from `start` through `end` (inclusive). */
export const getDaysInRange = (start, end) => {
  const days = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
};

/** Validate that a string is a well-formed YYYY-MM-DD date. */
export const isValidDate = (date) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return formatDate(parseDate(date)) === date;
};

/**
 * Return only the dates within [start, end] that are **scheduled** for a habit,
 * respecting its frequency and customDays configuration.
 *
 * Frequency semantics:
 *  - "daily"  → every day after startDate
 *  - "weekly" → same weekday as startDate, once per week
 *  - "custom" → only weekdays present in customDays (0=Sun … 6=Sat)
 *
 * Edge cases:
 *  - Dates before habit.startDate are never included.
 *  - If end > today, the range is capped at today (future dates are not active).
 *  - "custom" with empty customDays → no dates scheduled (returns []).
 *
 * @param {object} habit       Must have: startDate, frequency, customDays
 * @param {string} rangeStart  YYYY-MM-DD
 * @param {string} rangeEnd    YYYY-MM-DD
 * @returns {string[]}         Sorted array of scheduled date strings
 */
export const getScheduledDates = (habit, rangeStart, rangeEnd) => {
  const today = getToday();
  const effectiveEnd = rangeEnd > today ? today : rangeEnd;
  const activeStart = rangeStart > habit.startDate ? rangeStart : habit.startDate;

  if (activeStart > effectiveEnd) return [];

  const allDays = getDaysInRange(activeStart, effectiveEnd);

  const freq = habit.frequency || 'daily';

  if (freq === 'daily') {
    return allDays;
  }

  if (freq === 'weekly') {
    // Active on the same weekday as startDate
    const targetDay = getDayOfWeek(habit.startDate);
    return allDays.filter((d) => getDayOfWeek(d) === targetDay);
  }

  if (freq === 'custom') {
    const days = Array.isArray(habit.customDays) ? habit.customDays : [];
    if (days.length === 0) return [];
    const daySet = new Set(days);
    return allDays.filter((d) => daySet.has(getDayOfWeek(d)));
  }

  // Fallback: treat unknown frequency as daily
  return allDays;
};
