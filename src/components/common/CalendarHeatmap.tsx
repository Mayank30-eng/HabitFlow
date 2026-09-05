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
      return 'bg-rose-500 shadow-xs shadow-rose-500/20';
    }
    if (goodTotal === 0) {
      return 'bg-slate-100 dark:bg-slate-800';
    }
    const ratio = goodCompleted / goodTotal;
    if (ratio === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (ratio < 0.25) return 'bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-500/20';
    if (ratio < 0.5) return 'bg-emerald-300 dark:bg-emerald-800/60';
    if (ratio < 0.75) return 'bg-emerald-400 dark:bg-emerald-600';
    return 'bg-emerald-500 shadow-xs shadow-emerald-500/20';
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
    <div className="w-full overflow-x-auto scrollbar-hide py-1">
      <div className="flex gap-1.5 min-w-max">
        <div className="flex flex-col gap-1.5 mr-2">
          {dayLabels.map((d, i) => (
            <div key={i} className="w-3.5 h-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center">
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map((date) => (
              <div
                key={date}
                title={date}
                aria-label={`Activity on ${date}`}
                className={`w-3.5 h-3.5 rounded-xs ${getColor(date)} transition-transform hover:scale-125 cursor-pointer`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>Less</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800" />
          <div className="w-3 h-3 rounded-xs bg-emerald-200 dark:bg-emerald-950/60" />
          <div className="w-3 h-3 rounded-xs bg-emerald-300 dark:bg-emerald-800/60" />
          <div className="w-3 h-3 rounded-xs bg-emerald-400 dark:bg-emerald-600" />
          <div className="w-3 h-3 rounded-xs bg-emerald-500" />
          <div className="w-3 h-3 rounded-xs bg-rose-500" />
        </div>
        <span>More / Slips</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
