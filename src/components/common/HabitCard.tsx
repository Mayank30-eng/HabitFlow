import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Flame, Edit2, Trash2 } from 'lucide-react';
import type { Habit } from '../../types';
import { calculateStreak, calculateSuccessRate } from '../../utils/calculations';
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
  const streak = calculateStreak(habit);
  const rate = calculateSuccessRate(habit, 30);
  const todayRecord = getHabitRecord(habit, getToday());
  const isCompleted = todayRecord && todayRecord.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={`bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden ${
        habit.type === 'good' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <button
            onClick={onToggle}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isCompleted
                ? habit.type === 'good'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {isCompleted ? (
              habit.type === 'good' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4 rounded-sm border-2 border-slate-300 dark:border-slate-500" />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/habit/${habit.id}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-green-600 dark:hover:text-green-400 transition-colors truncate">
              {habit.name}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              habit.type === 'good'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {habit.type === 'good' ? 'Good' : 'Bad'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {habit.category}
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Flame className="w-3 h-3" />
                {streak} {habit.type === 'bad' ? (streak !== 1 ? 'days avoided' : 'day avoided') : (streak !== 1 ? 'days' : 'day')}
              </span>
            )}
          </div>
          <ProgressBar value={rate} color={habit.type === 'good' ? 'green' : 'red'} size="sm" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HabitCard;
