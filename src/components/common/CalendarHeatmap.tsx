import React, { useMemo } from 'react';
import { getToday, subDays, getDaysInRange, isDateScheduled } from '../../utils/helpers';
import type { Habit } from '../../types';

interface CalendarHeatmapProps {
  habits: Habit[];
  days?: number;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ habits, days = 365 }) => {
  const today = getToday();

  // Compute date range once when days or today changes
  const allDates = useMemo(() => {
    const start = subDays(today, days - 1);
    return getDaysInRange(start, today);
  }, [days, today]);

  // Pre-index each habit's completed dates in a Set for O(1) lookup
  const habitLookups = useMemo(() => {
    return habits.map((h) => {
      const completedSet = new Set<string>();
      for (const record of h.history) {
        if (record.completed) completedSet.add(record.date);
      }
      return {
        habit: h,
        type: h.type,
        completedSet,
      };
    });
  }, [habits]);

  // Pre-compute visual status for every date in a single pass without array allocations
  const dayInfoMap = useMemo(() => {
    const map = new Map<string, { color: string; label: string }>();

    for (const date of allDates) {
      let goodScheduled = 0;
      let goodCompleted = 0;
      let badPerformed = 0;

      for (const item of habitLookups) {
        if (isDateScheduled(item.habit, date)) {
          const isDone = item.completedSet.has(date);
          if (item.type === 'good') {
            goodScheduled += 1;
            if (isDone) goodCompleted += 1;
          } else if (item.type === 'bad') {
            if (isDone) badPerformed += 1;
          }
        }
      }

      let color = 'bg-slate-100 dark:bg-slate-800/40';
      let label = 'No habits scheduled';

      if (badPerformed > 0) {
        color = 'bg-rose-500 shadow-xs shadow-rose-500/20';
        label = `${badPerformed} bad habit slip(s)`;
      } else if (goodScheduled > 0) {
        const ratio = goodCompleted / goodScheduled;
        if (ratio === 0) {
          if (date < today) {
            color = 'bg-rose-500/20 dark:bg-rose-950/40 border border-rose-500/30';
            label = `0/${goodScheduled} completed (Missed)`;
          } else {
            color = 'bg-amber-500/25 dark:bg-amber-950/40 border border-amber-500/35';
            label = `Pending today (${goodScheduled} scheduled)`;
          }
        } else if (ratio < 0.4) {
          color = 'bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-500/20';
          label = `${goodCompleted}/${goodScheduled} completed`;
        } else if (ratio < 0.75) {
          color = 'bg-emerald-300 dark:bg-emerald-800/60';
          label = `${goodCompleted}/${goodScheduled} completed`;
        } else if (ratio < 1) {
          color = 'bg-emerald-400 dark:bg-emerald-600';
          label = `${goodCompleted}/${goodScheduled} completed`;
        } else {
          color = 'bg-emerald-500 shadow-xs shadow-emerald-500/20';
          label = `All ${goodScheduled} completed`;
        }
      }

      map.set(date, { color, label });
    }

    return map;
  }, [allDates, habitLookups, today]);

  // Partition dates into Sunday-aligned weeks (memoized)
  const weeks = useMemo(() => {
    const result: string[][] = [];
    let currentWeek: string[] = [];
    allDates.forEach((date) => {
      const dayOfWeek = new Date(date + 'T00:00:00').getDay();
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(date);
    });
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [allDates]);

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
            {week.map((date) => {
              const info = dayInfoMap.get(date) ?? {
                color: 'bg-slate-100 dark:bg-slate-800/40',
                label: 'No habits scheduled',
              };
              return (
                <div
                  key={date}
                  title={`${date}: ${info.label}`}
                  aria-label={`${date}: ${info.label}`}
                  className={`w-3.5 h-3.5 rounded-xs ${info.color} transition-transform hover:scale-125 cursor-pointer`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800" title="Unscheduled / None" />
            <div className="w-3 h-3 rounded-xs bg-emerald-200 dark:bg-emerald-950/60" title="Partial" />
            <div className="w-3 h-3 rounded-xs bg-emerald-300 dark:bg-emerald-800/60" />
            <div className="w-3 h-3 rounded-xs bg-emerald-400 dark:bg-emerald-600" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500" title="Complete" />
          </div>
          <span>More</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-xs bg-rose-500/20 border border-rose-500/30" />
            <span>Missed Day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-xs bg-amber-500/25 border border-amber-500/35" />
            <span>Pending Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-xs bg-rose-500" />
            <span>Bad Habit Slip</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
