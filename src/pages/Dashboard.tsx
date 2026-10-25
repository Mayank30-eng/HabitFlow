import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Target, TrendingUp, Zap, Shield, Activity,
  Plus, ChevronRight, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import StatCard from '../components/common/StatCard';
import HabitCard from '../components/common/HabitCard';
import HabitModal from '../components/modals/HabitModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import MotivationalQuoteModal from '../components/common/MotivationalQuoteModal';
import CalendarHeatmap from '../components/common/CalendarHeatmap';
import EmptyState from '../components/common/EmptyState';
import CircularProgress from '../components/common/CircularProgress';
import { getToday, formatDate } from '../utils/helpers';
import type { HabitFormData } from '../types';

const Dashboard: React.FC = () => {
  const { state, toggleHabit, deleteHabit, addHabit, updateHabit } = useHabits();
  const { showToast } = useToast();
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [habitFilter, setHabitFilter] = useState<'all' | 'good' | 'bad'>('all');

  // Trigger motivational quote overlay only on entrance following a successful login
  useEffect(() => {
    if (sessionStorage.getItem('habitflow_just_logged_in') === 'true') {
      sessionStorage.removeItem('habitflow_just_logged_in');
      setQuoteModalOpen(true);
    }
  }, []);

  const habits = state.habits;
  const analytics = state.analytics;
  const today = getToday();

  // All stats now come from backend-computed analytics
  const stats = useMemo(() => {
    const good = analytics?.goodStats ?? { completionRate: 0, currentStreak: 0, longestStreak: 0, completedToday: 0, totalGood: 0 };
    const bad = analytics?.badStats ?? { bestAvoidanceStreak: 0, longestAvoidanceStreak: 0, totalRelapses: 0, totalOccurrences: 0, totalAvoidedDays: 0, occurrencesThisWeek: 0, occurrencesThisMonth: 0, avoidanceRate: 0, penaltyImpact: 0 };
    const successRate = analytics?.overallSuccessRate ?? 0;
    const growth = analytics?.growthScore ?? 0;
    const gvb = analytics?.goodVsBad ?? { goodCompleted: 0, badAvoided: 0, badPerformed: 0, badTotal: 0 };
    const todayStatus = analytics?.todayStatus ?? { completed: 0, missed: 0, pending: 0 };

    return {
      total: habits.length,
      good,
      bad,
      successRate,
      growth,
      badAvoided: gvb.badAvoided,
      badPerformed: gvb.badPerformed,
      badTotal: gvb.badTotal,
      completed: todayStatus.completed,
      missed: todayStatus.missed,
      pending: todayStatus.pending,
    };
  }, [habits, analytics]);

  const recentHabits = useMemo(() => {
    let filtered = habits;
    if (habitFilter === 'good') filtered = habits.filter(h => h.type === 'good');
    else if (habitFilter === 'bad') filtered = habits.filter(h => h.type === 'bad');
    return filtered.slice(0, 6);
  }, [habits, habitFilter]);

  const recentActivity = useMemo(() => {
    const activity = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const goodHabits = habits.filter((h) => h.type === 'good' && h.history.some((r) => r.date === dateStr && r.completed));
      const badHabits = habits.filter((h) => h.type === 'bad' && h.history.some((r) => r.date === dateStr && r.completed));
      if (goodHabits.length > 0 || badHabits.length > 0) {
        activity.push({ date: dateStr, goodHabits, badHabits });
      }
    }
    return activity.slice(0, 5);
  }, [habits]);

  const handleToggle = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const rec = habit.history.find((r) => r.date === today);
    const wasMarked = Boolean(rec?.completed);
    try {
      await toggleHabit(id);
      showToast(
        habit.type === 'good'
          ? wasMarked ? `${habit.name} marked uncompleted` : `${habit.name} completed!`
          : wasMarked ? `${habit.name} occurrence removed` : `${habit.name} occurrence tracked`,
        habit.type === 'bad' && !wasMarked ? 'info' : 'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update habit', 'error');
    }
  };

  const handleEdit = (id: string) => {
    setEditingHabit(id);
    setHabitModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingHabit(id);
    setConfirmModalOpen(true);
  };

  const handleSave = async (data: HabitFormData) => {
    try {
      if (editingHabit) {
        await updateHabit(editingHabit, data);
        showToast('Habit updated successfully', 'success');
      } else {
        await addHabit(data);
        showToast('Habit created successfully', 'success');
      }
      setEditingHabit(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save habit', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingHabit) {
      try {
        await deleteHabit(deletingHabit);
        showToast('Habit deleted', 'success');
        setDeletingHabit(null);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to delete habit', 'error');
      }
    }
  };

  const editingHabitData = editingHabit ? habits.find((h) => h.id === editingHabit) : undefined;
  const todayCompletionRate = stats.good.totalGood > 0 ? Math.round((stats.good.completedToday / stats.good.totalGood) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero: Today's Focus Card (Matches Reference Image) */}
      <div className="relative overflow-hidden bg-surface-light dark:bg-[#0c1220] rounded-3xl border border-slate-200/80 dark:border-slate-800/90 p-6 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-light border border-primary/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today's Focus</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {todayCompletionRate === 100 && stats.good.totalGood > 0
                ? 'All good habits completed! 🎉'
                : todayCompletionRate > 0
                ? `${stats.good.completedToday} of ${stats.good.totalGood} completed today`
                : 'Ready to build momentum today?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
              {todayCompletionRate === 100 && stats.good.totalGood > 0
                ? 'Fantastic work! You have hit 100% of your good habits today.'
                : stats.good.totalGood > 0
                ? `You have completed ${stats.good.completedToday} out of ${stats.good.totalGood} good habits. Stay consistent to keep your streaks alive!`
                : 'Get started by creating your first habit to track your daily progress.'}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                onClick={() => { setEditingHabit(null); setHabitModalOpen(true); }}
                type="button"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xs shadow-primary/25 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add New Habit
              </button>
              <Link
                to="/habits"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#182033] hover:bg-slate-200 dark:hover:bg-[#202b44] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/50 text-sm font-semibold transition-colors"
              >
                Manage All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Progress Ring & Mini Indicators */}
          <div className="flex items-center gap-6 self-center md:self-auto bg-slate-50/90 dark:bg-[#070b14]/90 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/90 flex-shrink-0 shadow-xs">
            <CircularProgress
              value={todayCompletionRate}
              size={96}
              strokeWidth={8}
              color="primary"
              sublabel="TODAY"
            />
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Completed: <strong className="text-slate-900 dark:text-slate-100 font-bold">{stats.completed}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Pending: <strong className="text-slate-900 dark:text-slate-100 font-bold">{stats.pending}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                <Shield className="w-4 h-4 text-primary dark:text-primary-light flex-shrink-0" />
                <span>Bad Avoided: <strong className="text-slate-900 dark:text-slate-100 font-bold">{stats.badAvoided}/{stats.badTotal}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Habits"
          value={`${stats.good.completedToday}/${stats.good.totalGood}`}
          icon={<Target className="w-5 h-5" />}
          color="green"
          subtitle={`${todayCompletionRate}% completed`}
        />
        <StatCard
          title="Current Streak"
          value={stats.good.currentStreak}
          icon={<Flame className="w-5 h-5" />}
          color="amber"
          subtitle={`Best: ${stats.good.longestStreak} days`}
        />
        <StatCard
          title="Overall Success"
          value={`${stats.successRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
          trend={stats.growth >= 0 ? 'up' : 'down'}
          trendValue={`${stats.growth > 0 ? '+' : ''}${stats.growth}%`}
          subtitle="Monthly trend"
        />
        <StatCard
          title="Bad Habits Avoided"
          value={`${stats.badAvoided}/${stats.badTotal}`}
          icon={<Shield className="w-5 h-5" />}
          color="blue"
          subtitle={`Best streak: ${stats.bad.bestAvoidanceStreak}d`}
        />
      </div>

      {/* Habits Section */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Today's Habits
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Check off your accomplishments and maintain your momentum
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setHabitFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                habitFilter === 'all'
                  ? 'bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              All ({habits.length})
            </button>
            <button
              onClick={() => setHabitFilter('good')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                habitFilter === 'good'
                  ? 'bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Good ({stats.good.totalGood})
            </button>
            <button
              onClick={() => setHabitFilter('bad')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                habitFilter === 'bad'
                  ? 'bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Bad ({stats.badTotal})
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <EmptyState
            title="No habits yet"
            description="Start building better habits by adding your first one."
            action={
              <button
                onClick={() => { setEditingHabit(null); setHabitModalOpen(true); }}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
              >
                Add First Habit
              </button>
            }
          />
        ) : recentHabits.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No habits found in this filter category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentHabits.map((habit, i) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                index={i}
                onToggle={() => handleToggle(habit.id)}
                onEdit={() => handleEdit(habit.id)}
                onDelete={() => handleDelete(habit.id)}
              />
            ))}
          </div>
        )}

        {habits.length > 6 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-center">
            <Link
              to="/habits"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-primary-light hover:underline"
            >
              View all {habits.length} habits <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Heatmap & Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Activity Heatmap
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consistency over the last 180 days
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-primary dark:text-primary-light hover:underline flex items-center gap-1"
            >
              View analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CalendarHeatmap habits={habits} days={180} />
        </div>

        {/* Today's Status Breakdown */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
              Today's Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time daily status tracker
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  <span>Good Habits</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{stats.completed}/{stats.good.totalGood}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.good.totalGood > 0 ? (stats.completed / stats.good.totalGood) * 100 : 0}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/15">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Done</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{stats.completed}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/15">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">Pending</span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{stats.pending}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-500/15">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">Missed</span>
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{stats.missed}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  <span>Bad Habits</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{stats.badAvoided}/{stats.badTotal}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-center">
                  <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/15">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Avoided</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{stats.badAvoided}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-500/15">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">Relapses</span>
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{stats.badPerformed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Detailed Habit Analytics */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Performance Breakdown
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Good Habit Rate"
            value={`${stats.good.completionRate}%`}
            icon={<Target className="w-5 h-5" />}
            color="green"
            subtitle="Overall 30-day average"
          />
          <StatCard
            title="Longest Good Streak"
            value={stats.good.longestStreak}
            icon={<Zap className="w-5 h-5" />}
            color="amber"
            subtitle="All-time record"
          />
          <StatCard
            title="Relapses This Week"
            value={stats.bad.occurrencesThisWeek}
            icon={<Flame className="w-5 h-5" />}
            color="red"
            subtitle="Bad habit triggers"
          />
          <StatCard
            title="Relapses This Month"
            value={stats.bad.occurrencesThisMonth}
            icon={<Activity className="w-5 h-5" />}
            color="red"
            subtitle={`Total: ${stats.bad.totalRelapses} all-time`}
          />
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
          Recent Activity Timeline
        </h3>
        {recentActivity.length === 0 ? (
          <EmptyState title="No recent activity" description="Track some habits to see activity history here." />
        ) : (
          <div className="space-y-3">
            {recentActivity.map((day) => (
              <div key={day.date} className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${day.badHabits.length > 0 ? 'bg-rose-500 ring-4 ring-rose-500/20' : 'bg-emerald-500 ring-4 ring-emerald-500/20'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{day.date}</p>
                  {day.goodHabits.length > 0 && (
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Completed: </strong>
                      {day.goodHabits.map((h) => h.name).join(', ')}
                    </p>
                  )}
                  {day.badHabits.length > 0 && (
                    <p className="text-sm text-rose-600 dark:text-rose-400 mt-0.5">
                      <strong className="font-semibold">Occurred: </strong>
                      {day.badHabits.map((h) => h.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => { setHabitModalOpen(false); setEditingHabit(null); }}
        onSubmit={handleSave}
        title={editingHabit ? 'Edit Habit' : 'Create Habit'}
        initialData={editingHabitData ? {
          name: editingHabitData.name,
          category: editingHabitData.category,
          type: editingHabitData.type,
          description: editingHabitData.description || '',
          frequency: editingHabitData.frequency,
          customDays: editingHabitData.customDays || [],
          startDate: editingHabitData.startDate,
        } : undefined}
      />
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setDeletingHabit(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Habit"
        message="Are you sure you want to delete this habit? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
      <MotivationalQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
