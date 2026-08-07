import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ListChecks, Flame, Target, TrendingUp, Zap, Shield, Activity,
  Plus, ChevronRight
} from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import StatCard from '../components/common/StatCard';
import HabitCard from '../components/common/HabitCard';
import HabitModal from '../components/modals/HabitModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import CalendarHeatmap from '../components/common/CalendarHeatmap';
import EmptyState from '../components/common/EmptyState';
import {
  calculateOverallSuccessRate, calculateGrowthScore, getOverallStatus, getGoodVsBadStats,
  getGoodHabitDashboardStats, getBadHabitDashboardStats
} from '../utils/calculations';
import { getToday, formatDate } from '../utils/helpers';
import type { HabitFormData } from '../types';

const Dashboard: React.FC = () => {
  const { state, toggleHabit, deleteHabit, addHabit, updateHabit } = useHabits();
  const { showToast } = useToast();
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);

  const habits = state.habits;
  const today = getToday();

  const stats = useMemo(() => {
    const total = habits.length;
    const good = getGoodHabitDashboardStats(habits);
    const bad = getBadHabitDashboardStats(habits);
    const successRate = calculateOverallSuccessRate(habits);
    const growth = calculateGrowthScore(habits);
    const { badAvoided, badPerformed, badTotal } = getGoodVsBadStats(habits);
    const { completed, missed, pending } = getOverallStatus(habits);

    return {
      total, good, bad, successRate, growth, badAvoided, badPerformed, badTotal, completed, missed, pending
    };
  }, [habits]);

  const recentHabits = useMemo(() => {
    return habits.slice(0, 6);
  }, [habits]);

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
          ? wasMarked ? `${habit.name} marked as missed` : `${habit.name} completed!`
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

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Habits" value={stats.total} icon={<ListChecks className="w-5 h-5" />} color="blue" />
        <StatCard title="Overall Success" value={`${stats.successRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="purple" trend={stats.growth >= 0 ? 'up' : 'down'} trendValue={`${stats.growth > 0 ? '+' : ''}${stats.growth}%`} />
        <StatCard title="Growth Score" value={`${stats.growth > 0 ? '+' : ''}${stats.growth}%`} icon={<Activity className="w-5 h-5" />} color="green" trend={stats.growth >= 0 ? 'up' : 'down'} trendValue="vs last month" />
        <StatCard title="Good Completed Today" value={`${stats.good.completedToday}/${stats.good.totalGood}`} icon={<Target className="w-5 h-5" />} color="green" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Good Habits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Completion Rate" value={`${stats.good.completionRate}%`} icon={<Target className="w-5 h-5" />} color="green" />
          <StatCard title="Current Streak" value={stats.good.currentStreak} icon={<Flame className="w-5 h-5" />} color="amber" subtitle="days" />
          <StatCard title="Longest Streak" value={stats.good.longestStreak} icon={<Zap className="w-5 h-5" />} color="amber" subtitle="days" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bad Habits</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Avoidance Streak" value={stats.bad.bestAvoidanceStreak} icon={<Shield className="w-5 h-5" />} color="green" subtitle="best current" />
          <StatCard title="Relapse Count" value={stats.bad.totalRelapses} icon={<Activity className="w-5 h-5" />} color="red" />
          <StatCard title="Occurrences This Week" value={stats.bad.occurrencesThisWeek} icon={<Flame className="w-5 h-5" />} color="red" />
          <StatCard title="Occurrences This Month" value={stats.bad.occurrencesThisMonth} icon={<TrendingUp className="w-5 h-5" />} color="red" />
        </div>
      </div>

      {/* Heatmap + Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Activity Heatmap</h2>
            <Link to="/analytics" className="text-sm text-green-600 dark:text-green-400 hover:underline">View all</Link>
          </div>
          <CalendarHeatmap habits={habits} days={180} />
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Today's Status</h2>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Good Habits</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Completed</span>
              <span className="text-sm font-semibold text-green-600">{stats.completed}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.good.totalGood > 0 ? (stats.completed / stats.good.totalGood) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Missed</span>
              <span className="text-sm font-semibold text-red-600">{stats.missed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{stats.pending}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Bad Habits</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Avoided</span>
                <span className="text-sm font-semibold text-green-600">{stats.badAvoided}/{stats.badTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Occurred</span>
                <span className="text-sm font-semibold text-red-600">{stats.badPerformed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Habits</h2>
          <button
            onClick={() => { setEditingHabit(null); setHabitModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>
        </div>
        {habits.length === 0 ? (
          <EmptyState
            title="No habits yet"
            description="Start building better habits by adding your first one."
            action={
              <button
                onClick={() => { setEditingHabit(null); setHabitModalOpen(true); }}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Add First Habit
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <Link to="/habits" className="flex items-center justify-center gap-1 mt-4 text-sm text-green-600 dark:text-green-400 hover:underline">
            View all {habits.length} habits <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <EmptyState title="No recent activity" description="Track some habits to see activity here." />
        ) : (
          <div className="space-y-3">
            {recentActivity.map((day) => (
              <div key={day.date} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${day.badHabits.length > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{day.date}</p>
                  {day.goodHabits.length > 0 && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Completed: {day.goodHabits.map((h) => h.name).join(', ')}
                    </p>
                  )}
                  {day.badHabits.length > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Occurred: {day.badHabits.map((h) => h.name).join(', ')}
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
    </div>
  );
};

export default Dashboard;
