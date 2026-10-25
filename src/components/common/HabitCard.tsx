import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Flame, Edit2, Trash2 } from 'lucide-react';
import type { Habit } from '../../types';
import { useHabits } from '../../contexts/HabitContext';
import { getHabitRecord, getToday } from '../../utils/helpers';
import ProgressBar from './ProgressBar';

interface HabitCardProps {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle, onEdit, onDelete, index }) => {
  const { state } = useHabits();
  const [showSparkles, setShowSparkles] = useState(false);

  // Read metrics from backend-computed analytics
  const perHabit = state.analytics?.perHabit?.[habit.id];
  const streak = habit.type === 'good'
    ? (perHabit?.currentStreak ?? 0)
    : (perHabit?.avoidanceStreak ?? 0);
  const rate = perHabit?.successRate ?? 0;

  const todayRecord = getHabitRecord(habit, getToday());
  const isCompleted = Boolean(todayRecord && todayRecord.completed);

  const handleToggle = () => {
    if (!isCompleted && habit.type === 'good') {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 850);
    }
    onToggle();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={`bg-surface-light dark:bg-surface-dark rounded-2xl border transition-all duration-200 group relative p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 ${
        isCompleted
          ? habit.type === 'good'
            ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.1]'
            : 'border-rose-200/80 dark:border-rose-900/40 bg-rose-500/[0.02] dark:bg-rose-950/[0.1]'
          : 'border-slate-200/80 dark:border-slate-800/80'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle Button with Celebration Sparkle Animation */}
        <div className="relative flex-shrink-0">
          <button
            onClick={handleToggle}
            type="button"
            aria-label={
              habit.type === 'good'
                ? isCompleted
                  ? `Mark ${habit.name} as uncompleted`
                  : `Mark ${habit.name} as completed`
                : isCompleted
                ? `Remove occurrence for ${habit.name}`
                : `Record occurrence for ${habit.name}`
            }
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isCompleted
                ? habit.type === 'good'
                  ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95'
                  : 'bg-rose-500 text-white shadow-xs shadow-rose-500/30 hover:bg-rose-600 active:scale-95'
                : habit.type === 'good'
                ? 'border-2 border-dashed border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 active:scale-95'
                : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 active:scale-95'
            }`}
          >
            {isCompleted ? (
              habit.type === 'good' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              habit.type === 'good' ? <Check className="w-3 h-3 stroke-[2.5]" /> : <X className="w-3 h-3 stroke-[2.5]" />
            )}
          </button>

          <AnimatePresence>
            {showSparkles && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.2, 0.4],
                      x: Math.cos((angle * Math.PI) / 180) * 20,
                      y: Math.sin((angle * Math.PI) / 180) * 20,
                      opacity: [1, 1, 0],
                    }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-300 shadow-xs shadow-emerald-400"
                  />
                ))}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-xl ring-2 ring-emerald-400"
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/habit/${habit.id}`}
              className={`font-semibold text-sm sm:text-base transition-colors truncate block leading-tight ${
                isCompleted && habit.type === 'good'
                  ? 'text-slate-900 dark:text-slate-100 hover:text-primary dark:hover:text-primary-light'
                  : 'text-slate-900 dark:text-slate-100 hover:text-primary dark:hover:text-primary-light'
              }`}
            >
              {habit.name}
            </Link>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ${
                habit.type === 'good'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {habit.type === 'good' ? 'Good' : 'Bad'}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
              {habit.category}
            </span>
            {streak > 0 && (
              <span
                className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                  habit.type === 'good'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                {streak} {habit.type === 'bad' ? (streak !== 1 ? 'days avoided' : 'day avoided') : (streak !== 1 ? 'days' : 'day')}
              </span>
            )}
          </div>

          {/* Progress Bar & Rate */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1">
              <ProgressBar value={rate} color={habit.type === 'good' ? 'green' : 'red'} size="sm" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex-shrink-0">
              {rate}% 30d
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={onEdit}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit habit"
            aria-label="Edit habit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Delete habit"
            aria-label="Delete habit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HabitCard;
