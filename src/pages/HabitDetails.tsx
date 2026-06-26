import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Flame, Target, TrendingUp, CalendarDays, Edit2, Trash2, Check, X
} from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import HabitModal from '../components/modals/HabitModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import ProgressBar from '../components/common/ProgressBar';
import {
  calculateStreak, calculateLongestStreak, calculateCompletionRate,
  calculateTotalCompletions, getHabitImpactScore, getCompletionTrend
} from '../utils/calculations';
import { getHabitRecord, getToday, getDaysInRange } from '../utils/helpers';
import type { HabitFormData } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const HabitDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, toggleHabit, deleteHabit, updateHabit } = useHabits();
  const { showToast } = useToast();
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const habit = useMemo(() => state.habits.find((h) => h.id === id), [state.habits, id]);

  const stats = useMemo(() => {
    if (!habit) return null;
    const streak = calculateStreak(habit);
    const longest = calculateLongestStreak(habit);
    const rate = calculateCompletionRate(habit, 30);
    const total = calculateTotalCompletions(habit);
    const allDays = getDaysInRange(habit.startDate, getToday()).length;
    const impact = getHabitImpactScore(habit, state.habits);
    const trend = getCompletionTrend([habit], 30);
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const range = getDaysInRange(start, end);
      const completed = range.filter((date) => {
        const record = getHabitRecord(habit, date);
        return record && record.completed;
      }).length;
      monthly.push({ month: monthName, completed, total: range.length });
    }
    return { streak, longest, rate, total, allDays, impact, trend, monthly };
  }, [habit, state.habits]);

  if (!habit) {
    return (
      <div className="py-12">
        <EmptyState
          title="Habit not found"
          description="The habit you're looking for doesn't exist."
          action={
            <button
              onClick={() => navigate('/habits')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Habits
            </button>
          }
        />
      </div>
    );
  }

  const handleSave = (data: HabitFormData) => {
    updateHabit(habit.id, data);
    showToast('Habit updated successfully', 'success');
  };

  const handleDelete = () => {
    deleteHabit(habit.id);
    showToast('Habit deleted', 'success');
    navigate('/habits');
  };

  const todayRecord = getHabitRecord(habit, getToday());
  const isCompleted = todayRecord && todayRecord.completed;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
          <p className="text-slate-500 dark:text-slate-400">{label}</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">Completed: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/habits')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{habit.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                habit.type === 'good'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {habit.type === 'good' ? 'Good Habit' : 'Bad Habit'}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{habit.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleHabit(habit.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCompleted
                ? habit.type === 'good'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isCompleted ? (
              habit.type === 'good' ? <><Check className="w-4 h-4" /> Completed</> : <><X className="w-4 h-4" /> Tracked</>
            ) : (
              habit.type === 'good' ? 'Mark Complete' : 'Mark Performed'
            )}
          </button>
          <button
            onClick={() => setHabitModalOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmModalOpen(true)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Current Streak</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.streak}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">days</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Longest Streak</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.longest}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">days</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">30-Day Rate</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.rate}%</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">completion</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Total</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">completions</div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Overall Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-300">Completion Rate</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{stats?.rate}%</span>
            </div>
            <ProgressBar value={stats?.rate || 0} color={habit.type === 'good' ? 'green' : 'red'} showLabel={false} />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-300">Lifetime Completion</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {stats?.total}/{stats?.allDays}
              </span>
            </div>
            <ProgressBar
              value={stats?.total || 0}
              max={stats?.allDays || 1}
              color={habit.type === 'good' ? 'green' : 'red'}
              showLabel={false}
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-300">Impact Score</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{stats?.impact}/100</span>
            </div>
            <ProgressBar value={stats?.impact || 0} max={100} color="blue" showLabel={false} />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {stats && stats.trend.length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">30-Day Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={habit.type === 'good' ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={habit.type === 'good' ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke={habit.type === 'good' ? '#22c55e' : '#ef4444'}
                  fill="url(#trendFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Stats */}
      {stats && stats.monthly.length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Monthly Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {stats.monthly.map((m) => (
              <div key={m.month} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{m.month}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0}%
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{m.completed}/{m.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Completion Calendar</h2>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{d}</div>
          ))}
          {(() => {
            const days = [];
            const start = new Date(habit.startDate + 'T00:00:00');
            const end = new Date();
            const startDayOfWeek = start.getDay();
            for (let i = 0; i < startDayOfWeek; i++) {
              days.push(<div key={`empty-${i}`} />);
            }
            const current = new Date(start);
            while (current <= end) {
              const dateStr = current.toISOString().split('T')[0];
              const record = getHabitRecord(habit, dateStr);
              const completed = record && record.completed;
              days.push(
                <div
                  key={dateStr}
                  title={dateStr}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                    completed
                      ? habit.type === 'good'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {current.getDate()}
                </div>
              );
              current.setDate(current.getDate() + 1);
            }
            return days;
          })()}
        </div>
      </div>

      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        onSubmit={handleSave}
        title="Edit Habit"
        initialData={{
          name: habit.name,
          category: habit.category,
          type: habit.type,
          description: habit.description || '',
          frequency: habit.frequency,
          customDays: habit.customDays || [],
          startDate: habit.startDate,
        }}
      />
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Habit"
        message={`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default HabitDetails;
