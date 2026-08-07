import React from 'react';
import { getToday, subDays, getDaysInRange, getHabitRecord } from '../../utils/helpers';
import type { Habit } from '../../types';

interface CalendarHeatmapProps {
  habits: Habit[];
  days?: number;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ habits, days = 365 }) => {
  const today = getToday();
  const start = subDays(today, days - 1);
  const allDates = getDaysInRange(start, today);

  const getColor = (date: string): string => {
    const goodCompleted = habits.filter((h) => h.type === 'good' && getHabitRecord(h, date)?.completed).length;
    const goodTotal = habits.filter((h) => h.type === 'good' && h.startDate <= date).length;
    const badPerformed = habits.filter((h) => h.type === 'bad' && getHabitRecord(h, date)?.completed).length;

    if (badPerformed > 0) {
      return 'bg-red-500';
    }
    if (goodTotal === 0) {
      return 'bg-slate-200 dark:bg-slate-700';
    }
    const ratio = goodCompleted / goodTotal;
    if (ratio === 0) return 'bg-slate-200 dark:bg-slate-700';
    if (ratio < 0.25) return 'bg-green-200 dark:bg-green-900/30';
    if (ratio < 0.5) return 'bg-green-300 dark:bg-green-800/50';
    if (ratio < 0.75) return 'bg-green-400 dark:bg-green-600/60';
    return 'bg-green-500 dark:bg-green-500';
  };

  const weeks: string[][] = [];
  let currentWeek: string[] = [];
  allDates.forEach((date) => {
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(date);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        <div className="flex flex-col gap-1 mr-2">
          {dayLabels.map((d, i) => (
            <div key={i} className="w-3 h-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center">
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date) => (
              <div
                key={date}
                title={date}
                className={`w-3 h-3 rounded-sm ${getColor(date)} transition-colors hover:ring-2 hover:ring-slate-400 dark:hover:ring-slate-500`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/30" />
          <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800/50" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600/60" />
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500" />
          <div className="w-3 h-3 rounded-sm bg-red-500" />
        </div>
        <span>More / Bad</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
