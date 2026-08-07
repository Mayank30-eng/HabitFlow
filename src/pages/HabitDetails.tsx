import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Flame, Target, TrendingUp, CalendarDays, Edit2, Trash2, Check, X, Shield, Activity
} from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import HabitModal from '../components/modals/HabitModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import ProgressBar from '../components/common/ProgressBar';
import {
  calculateStreak, calculateLongestStreak, calculateSuccessRate,
  calculateTotalSuccesses, calculateTimesPerformed, getHabitImpactScore,
  calculateRelapseCount, calculateOccurrencesInPeriod, calculateBadHabitPenaltyImpact,
  getHabitSuccessTrend, getHabitActiveDates, isHabitSuccessOnDate
} from '../utils/calculations';
import { getHabitRecord, getToday, formatDate } from '../utils/helpers';
import type { HabitFormData } from '../types';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
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
    const rate = calculateSuccessRate(habit, 30);
    const totalSuccesses = calculateTotalSuccesses(habit);
    const timesPerformed = habit.type === 'bad' ? calculateTimesPerformed(habit) : 0;
    const relapseCount = habit.type === 'bad' ? calculateRelapseCount(habit) : 0;
    const occurrencesThisWeek = habit.type === 'bad' ? calculateOccurrencesInPeriod(habit, 7) : 0;
    const occurrencesThisMonth = habit.type === 'bad' ? calculateOccurrencesInPeriod(habit, 30) : 0;
    const penaltyImpact = habit.type === 'bad' ? calculateBadHabitPenaltyImpact(habit, 30) : 0;
    const today = getToday();
    const allDays = getHabitActiveDates(habit, habit.startDate, today).length;
    const impact = getHabitImpactScore(habit, state.habits);
    const trend = getHabitSuccessTrend(habit, 30);
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const start = formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
      const end = formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      const cappedEnd = end > today ? today : end;
      const range = getHabitActiveDates(habit, start, cappedEnd);
      const successes = range.filter((date) => isHabitSuccessOnDate(habit, date)).length;
      monthly.push({ month: monthName, successes, total: range.length });
    }
    return {
      streak,
      longest,
      rate,
      totalSuccesses,
      timesPerformed,
      relapseCount,
      occurrencesThisWeek,
      occurrencesThisMonth,
      penaltyImpact,
      allDays,
      impact,
      trend,
      monthly,
    };
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

  const handleSave = async (data: HabitFormData) => {
    try {
      await updateHabit(habit.id, data);
      showToast('Habit updated successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save habit', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHabit(habit.id);
      showToast('Habit deleted', 'success');
      navigate('/habits');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete habit', 'error');
    }
  };

  const todayRecord = getHabitRecord(habit, getToday());
  const isCompleted = todayRecord && todayRecord.completed;
  const successLabel = habit.type === 'bad' ? 'Avoided' : 'Completed';

  const handleToggle = async () => {
    const wasMarked = Boolean(todayRecord?.completed);
    try {
      await toggleHabit(habit.id);
      showToast(
        habit.type === 'good'
          ? wasMarked ? `${habit.name} marked as missed` : `${habit.name} completed`
          : wasMarked ? `${habit.name} occurrence removed` : `${habit.name} occurrence tracked`,
        habit.type === 'bad' && !wasMarked ? 'info' : 'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update habit', 'error');
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
          <p className="text-slate-500 dark:text-slate-400">{label}</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{successLabel}: {payload[0].value}</p>
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
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCompleted
                ? habit.type === 'good'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isCompleted ? (
              habit.type === 'good' ? <><Check className="w-4 h-4" /> Completed</> : <><X className="w-4 h-4" /> Occurred</>
            ) : (
              habit.type === 'good' ? 'Mark Complete' : 'Mark Occurrence'
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
              <span className="text-sm text-slate-500 dark:text-slate-400">{habit.type === 'bad' ? 'Avoidance Streak' : 'Current Streak'}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.streak}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{habit.type === 'bad' ? 'day streak' : 'days'}</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{habit.type === 'bad' ? 'Best Avoidance' : 'Longest Streak'}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.longest}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">days</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{habit.type === 'bad' ? '30-Day Avoidance' : '30-Day Rate'}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.rate}%</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{habit.type === 'bad' ? 'avoidance' : 'completion'}</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{habit.type === 'bad' ? 'Total Avoided' : 'Total'}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalSuccesses}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              {habit.type === 'bad' ? `${stats.timesPerformed} times slipped` : 'completions'}
            </div>
          </div>
        </div>
      )}

      {habit.type === 'bad' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-5 h-5 text-red-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Occurrence Count</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.timesPerformed}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">all time</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-red-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Relapse Count</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.relapseCount}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">streak breaks</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5 text-red-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">This Week</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.occurrencesThisWeek}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">occurrences</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">This Month</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.occurrencesThisMonth}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">occurrences</div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Penalty Impact</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.penaltyImpact}%</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">30 day score loss</div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Overall Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-300">{habit.type === 'bad' ? 'Avoidance Rate' : 'Completion Rate'}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{stats?.rate}%</span>
            </div>
            <ProgressBar value={stats?.rate || 0} color={habit.type === 'good' ? 'green' : 'green'} showLabel={false} />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-300">{habit.type === 'bad' ? 'Lifetime Avoidance' : 'Lifetime Completion'}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {stats?.totalSuccesses}/{stats?.allDays}
              </span>
            </div>
            <ProgressBar
              value={stats?.totalSuccesses || 0}
              max={stats?.allDays || 1}
              color={habit.type === 'good' ? 'green' : 'green'}
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {habit.type === 'bad' ? '30-Day Avoidance Trend' : '30-Day Completion Trend'}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="successes"
                  stroke="#22c55e"
                  fill="url(#trendFill)"
                  strokeWidth={2}
                  name={successLabel}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Stats */}
      {stats && stats.monthly.length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {habit.type === 'bad' ? 'Monthly Avoidance' : 'Monthly Statistics'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {stats.monthly.map((m) => (
              <div key={m.month} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{m.month}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {m.total > 0 ? Math.round((m.successes / m.total) * 100) : 0}%
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{m.successes}/{m.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {habit.type === 'bad' ? 'Occurrence Calendar' : 'Completion Calendar'}
        </h2>
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
              const dateStr = formatDate(current);
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
