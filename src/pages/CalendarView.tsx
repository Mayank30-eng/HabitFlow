import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { getHabitRecord, getToday } from '../utils/helpers';

const CalendarView: React.FC = () => {
  const { state, toggleHabit } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const days = [];
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

  const today = getToday();

  const getDayStatus = (dateStr: string) => {
    const goodCompleted = state.habits.filter((h) => h.type === 'good' && getHabitRecord(h, dateStr)?.completed).length;
    const goodTotal = state.habits.filter((h) => h.type === 'good').length;
    const badPerformed = state.habits.filter((h) => h.type === 'bad' && getHabitRecord(h, dateStr)?.completed).length;

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 min-w-[180px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((dateStr, i) => {
            if (!dateStr) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            const status = getDayStatus(dateStr);
            const isToday = dateStr === today;
            const dayHabits = getDayHabits(dateStr);
            const completedCount = dayHabits.filter((h) => h.type === 'good' && getHabitRecord(h, dateStr)?.completed).length;
            const totalGood = state.habits.filter((h) => h.type === 'good').length;

            const statusColors = {
              great: 'bg-green-500 text-white',
              good: 'bg-green-400 text-white',
              partial: 'bg-green-300 text-slate-800',
              bad: 'bg-red-500 text-white',
              none: 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500',
            };

            return (
              <motion.div
                key={dateStr}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  statusColors[status]
                } ${isToday ? 'ring-2 ring-offset-2 ring-green-500 dark:ring-offset-slate-800' : ''}`}
              >
                <span className="text-sm font-semibold">{new Date(dateStr + 'T00:00:00').getDate()}</span>
                {totalGood > 0 && (
                  <span className="text-[10px] opacity-80">
                    {completedCount}/{totalGood}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" /> Great
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-400" /> Good
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-300" /> Partial
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" /> Bad
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" /> None
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
