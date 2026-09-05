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
import StatCard from '../components/common/StatCard';
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
          description="The habit you're looking for doesn't exist or may have been deleted."
          action={
            <button
              onClick={() => navigate('/habits')}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
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
  const isCompleted = Boolean(todayRecord && todayRecord.completed);
  const successLabel = habit.type === 'bad' ? 'Avoided' : 'Completed';

  const handleToggle = async () => {
    const wasMarked = Boolean(todayRecord?.completed);
    try {
      await toggleHabit(habit.id);
      showToast(
        habit.type === 'good'
          ? wasMarked
            ? `${habit.name} marked as missed`
            : `${habit.name} completed!`
          : wasMarked
          ? `${habit.name} occurrence removed`
          : `${habit.name} occurrence tracked`,
        habit.type === 'bad' && !wasMarked ? 'info' : 'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update habit', 'error');
    }
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-lg text-xs">
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">{label}</p>
          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                habit.type === 'good' ? 'bg-emerald-500' : 'bg-primary'
              }`}
            />
            <span>{successLabel}:</span>
            <span>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            onClick={() => navigate('/habits')}
            type="button"
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-elevated-dark text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Back to All Habits"
            aria-label="Back to All Habits"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {habit.name}
              </h1>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                  habit.type === 'good'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {habit.type === 'good' ? 'Good Habit' : 'Bad Habit'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{habit.category}</span>
              <span>•</span>
              <span className="capitalize">{habit.frequency}</span>
              {habit.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-xs text-slate-400 dark:text-slate-500">
                    {habit.description}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleToggle}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-xs ${
              isCompleted
                ? habit.type === 'good'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                : habit.type === 'good'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isCompleted ? (
              habit.type === 'good' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Completed Today
                </>
              ) : (
                <>
                  <X className="w-4 h-4 stroke-[3]" /> Occurred Today
                </>
              )
            ) : habit.type === 'good' ? (
              <>
                <Check className="w-4 h-4" /> Mark Complete
              </>
            ) : (
              <>
                <X className="w-4 h-4" /> Record Occurrence
              </>
            )}
          </button>

          <button
            onClick={() => setHabitModalOpen(true)}
            type="button"
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-elevated-dark text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit habit"
            aria-label="Edit habit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setConfirmModalOpen(true)}
            type="button"
            className="p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-slate-50 dark:bg-elevated-dark text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Delete habit"
            aria-label="Delete habit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Key Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={habit.type === 'bad' ? 'Avoidance Streak' : 'Current Streak'}
            value={stats.streak}
            icon={<Flame className="w-5 h-5" />}
            color="amber"
            subtitle={habit.type === 'bad' ? 'Consecutive days' : 'Consecutive days'}
          />
          <StatCard
            title={habit.type === 'bad' ? 'Best Avoidance' : 'Longest Streak'}
            value={stats.longest}
            icon={<Target className="w-5 h-5" />}
            color="green"
            subtitle="All-time personal best"
          />
          <StatCard
            title={habit.type === 'bad' ? '30-Day Avoidance' : '30-Day Rate'}
            value={`${stats.rate}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="blue"
            subtitle="Rolling 30-day window"
          />
          <StatCard
            title={habit.type === 'bad' ? 'Total Avoided' : 'Total Completions'}
            value={stats.totalSuccesses}
            icon={<CalendarDays className="w-5 h-5" />}
            color="purple"
            subtitle={habit.type === 'bad' ? `${stats.timesPerformed} total slips` : 'Successful days'}
          />
        </div>
      )}

      {/* Bad Habit Specific Metrics */}
      {habit.type === 'bad' && stats && (
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Relapse & Occurrence Analysis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <StatCard
              title="Occurrence Count"
              value={stats.timesPerformed}
              icon={<X className="w-5 h-5" />}
              color="red"
              subtitle="All-time slips"
            />
            <StatCard
              title="Relapse Count"
              value={stats.relapseCount}
              icon={<Activity className="w-5 h-5" />}
              color="red"
              subtitle="Streak breaks"
            />
            <StatCard
              title="This Week"
              value={stats.occurrencesThisWeek}
              icon={<CalendarDays className="w-5 h-5" />}
              color="red"
              subtitle="Past 7 days"
            />
            <StatCard
              title="This Month"
              value={stats.occurrencesThisMonth}
              icon={<Shield className="w-5 h-5" />}
              color="red"
              subtitle="Past 30 days"
            />
            <StatCard
              title="Penalty Impact"
              value={`${stats.penaltyImpact}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="red"
              subtitle="Score reduction"
            />
          </div>
        </div>
      )}

      {/* Overall Progress & Impact Section */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-5">
          Progress & Consistency
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-elevated-dark/70 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300">
                {habit.type === 'bad' ? '30-Day Avoidance Rate' : '30-Day Completion Rate'}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats?.rate}%</span>
            </div>
            <ProgressBar value={stats?.rate || 0} color="green" showLabel={false} size="md" />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
              Based on active scheduled days in the past 30 days
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-elevated-dark/70 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300">
                {habit.type === 'bad' ? 'Lifetime Avoidance' : 'Lifetime Completion'}
              </span>
              <span className="text-primary dark:text-primary-light font-bold">
                {stats?.totalSuccesses} / {stats?.allDays}
              </span>
            </div>
            <ProgressBar
              value={stats?.totalSuccesses || 0}
              max={stats?.allDays || 1}
              color="indigo"
              showLabel={false}
              size="md"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
              Total successful days since starting this routine
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-elevated-dark/70 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300">Relative Impact Score</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">{stats?.impact} / 100</span>
            </div>
            <ProgressBar value={stats?.impact || 0} max={100} color="blue" showLabel={false} size="md" />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
              Weight relative to your overall habit catalog
            </p>
          </div>
        </div>
      </div>

      {/* 30-Day Trend Chart */}
      {stats && stats.trend.length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {habit.type === 'bad' ? '30-Day Avoidance Trend' : '30-Day Completion Trend'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily timeline tracking consistency and slips
              </p>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={habit.type === 'good' ? '#22c55e' : '#6366F1'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={habit.type === 'good' ? '#22c55e' : '#6366F1'}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="successes"
                  stroke={habit.type === 'good' ? '#22c55e' : '#6366F1'}
                  fill="url(#trendFill)"
                  strokeWidth={2.5}
                  name={successLabel}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Statistics Overview */}
      {stats && stats.monthly.length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
            {habit.type === 'bad' ? 'Monthly Avoidance Rate' : 'Monthly Performance'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {stats.monthly.map((m) => (
              <div
                key={m.month}
                className="text-center p-3.5 rounded-xl bg-slate-50/80 dark:bg-elevated-dark/80 border border-slate-200/60 dark:border-slate-800/60"
              >
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{m.month}</div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {m.total > 0 ? Math.round((m.successes / m.total) * 100) : 0}%
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  {m.successes} / {m.total} days
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {habit.type === 'bad' ? 'Occurrence Calendar' : 'Completion Calendar'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete history from start date ({habit.startDate}) to today
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-3 h-3 rounded-md ${
                  habit.type === 'good' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-600 dark:text-slate-400">
                {habit.type === 'good' ? 'Completed' : 'Occurred'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              <span className="text-slate-600 dark:text-slate-400">
                {habit.type === 'good' ? 'Not Marked' : 'Avoided'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1"
            >
              {d}
            </div>
          ))}
          {(() => {
            const days = [];
            const start = new Date(habit.startDate + 'T00:00:00');
            const end = new Date();
            const startDayOfWeek = start.getDay();
            for (let i = 0; i < startDayOfWeek; i++) {
              days.push(<div key={`empty-${i}`} className="aspect-square" />);
            }
            const current = new Date(start);
            while (current <= end) {
              const dateStr = formatDate(current);
              const record = getHabitRecord(habit, dateStr);
              const completed = Boolean(record && record.completed);
              days.push(
                <div
                  key={dateStr}
                  title={`${dateStr}: ${
                    completed
                      ? habit.type === 'good'
                        ? 'Completed'
                        : 'Occurred'
                      : habit.type === 'good'
                      ? 'Missed'
                      : 'Avoided'
                  }`}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-semibold transition-transform hover:scale-105 cursor-pointer ${
                    completed
                      ? habit.type === 'good'
                        ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20'
                        : 'bg-rose-500 text-white shadow-xs shadow-rose-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
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

      {/* Modals */}
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
