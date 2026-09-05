import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Shield } from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { getHabitRecord, getToday } from '../utils/helpers';

const CalendarView: React.FC = () => {
  const { state } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days: (string | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push(dateStr);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(today);
  };

  const getDayStatus = (dateStr: string) => {
    const goodCompleted = state.habits.filter(
      (h) => h.type === 'good' && getHabitRecord(h, dateStr)?.completed
    ).length;
    const goodTotal = state.habits.filter(
      (h) => h.type === 'good' && h.startDate <= dateStr
    ).length;
    const badPerformed = state.habits.filter(
      (h) => h.type === 'bad' && getHabitRecord(h, dateStr)?.completed
    ).length;

    if (badPerformed > 0) return 'bad';
    if (goodTotal > 0) {
      const ratio = goodCompleted / goodTotal;
      if (ratio >= 0.75) return 'great';
      if (ratio >= 0.5) return 'good';
      if (ratio > 0) return 'partial';
    }
    return 'none';
  };

  const getDayHabits = (dateStr: string) => {
    return state.habits.filter((h) => getHabitRecord(h, dateStr));
  };

  // Selected date details
  const selectedDayHabits = selectedDate ? getDayHabits(selectedDate) : [];
  const selectedDayGood = selectedDayHabits.filter((h) => h.type === 'good');
  const selectedDayBad = selectedDayHabits.filter((h) => h.type === 'bad');
  const selectedDayStatus = selectedDate ? getDayStatus(selectedDate) : 'none';

  const statusColors = {
    great: 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20',
    good: 'bg-emerald-400 dark:bg-emerald-600 text-white shadow-xs shadow-emerald-500/15',
    partial: 'bg-emerald-200 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-500/30',
    bad: 'bg-rose-500 text-white shadow-xs shadow-rose-500/20',
    none: 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700/60',
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Overview of your daily completion scores and habit consistency
          </p>
        </div>

        {/* Month Switcher Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={goToToday}
            type="button"
            className="px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface-light dark:bg-surface-dark text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center p-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <button
              onClick={prevMonth}
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous month"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 min-w-[140px] text-center select-none">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next month"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {days.map((dateStr, i) => {
            if (!dateStr) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            const status = getDayStatus(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayHabits = getDayHabits(dateStr);
            const completedCount = dayHabits.filter(
              (h) => h.type === 'good' && getHabitRecord(h, dateStr)?.completed
            ).length;
            const totalGood = state.habits.filter(
              (h) => h.type === 'good' && h.startDate <= dateStr
            ).length;
            const dayNumber = parseInt(dateStr.split('-')[2], 10);

            return (
              <motion.button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all relative ${
                  statusColors[status]
                } ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-md font-bold'
                    : isToday
                    ? 'ring-2 ring-slate-400/80 ring-offset-1 dark:ring-offset-slate-900'
                    : ''
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold">{dayNumber}</span>
                {totalGood > 0 && (
                  <span className="text-[10px] opacity-85 leading-tight font-medium mt-0.5">
                    {completedCount}/{totalGood}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs" />
              <span className="font-medium">Great (≥75%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-400 dark:bg-emerald-600" />
              <span className="font-medium">Good (≥50%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-500/30" />
              <span className="font-medium">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500" />
              <span className="font-medium">Slip / Relapse</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700" />
              <span className="font-medium">None</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Click any day to inspect details
          </div>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      {selectedDate && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {selectedDate === today ? "Today's Summary" : `Activity for ${selectedDate}`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDate === today ? `${selectedDate} (Current Date)` : selectedDate}
                </p>
              </div>
            </div>
            <span
              className={`text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg ${
                selectedDayStatus === 'great'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : selectedDayStatus === 'good'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : selectedDayStatus === 'partial'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  : selectedDayStatus === 'bad'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {selectedDayStatus}
            </span>
          </div>

          {selectedDayHabits.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 py-2">
              No habit activity recorded on this day.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Good Habits */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Good Habits ({selectedDayGood.length})
                </h3>
                <div className="space-y-1.5">
                  {selectedDayGood.map((h) => {
                    const isDone = Boolean(getHabitRecord(h, selectedDate)?.completed);
                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/60 dark:border-slate-800/60 text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {h.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isDone
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isDone ? 'Completed' : 'Missed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bad Habits */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-rose-500" />
                  Bad Habits ({selectedDayBad.length})
                </h3>
                <div className="space-y-1.5">
                  {selectedDayBad.map((h) => {
                    const occurred = Boolean(getHabitRecord(h, selectedDate)?.completed);
                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/60 dark:border-slate-800/60 text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {h.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            occurred
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {occurred ? 'Occurred' : 'Avoided'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
