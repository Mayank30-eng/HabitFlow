import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ListChecks, Flame, Target, TrendingUp, Zap, Shield, Activity,
  Plus, ChevronRight, Heart, Dumbbell, BookOpen, Briefcase, Brain, Users, Wallet, Palette, Tag
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
  calculateStreak, calculateLongestStreak, calculateOverallSuccessRate,
  calculateDailyCompletionRate, calculateGrowthScore, getOverallStatus, getGoodVsBadStats
} from '../utils/calculations';
import { getToday, categories, formatDate } from '../utils/helpers';
import type { HabitFormData } from '../types';

const categoryIconMap: Record<string, React.ElementType> = {
  Health: Heart,
  Fitness: Dumbbell,
  Learning: BookOpen,
  Productivity: Briefcase,
  Mindfulness: Brain,
  Social: Users,
  Finance: Wallet,
  Creative: Palette,
  Other: Tag,
};

const Dashboard: React.FC = () => {
  const { state, toggleHabit, deleteHabit, addHabit, updateHabit, getFilteredHabits } = useHabits();
  const { showToast } = useToast();
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);

  const habits = state.habits;
  const today = getToday();

  const stats = useMemo(() => {
    const total = habits.length;
    const goodHabits = habits.filter((h) => h.type === 'good');
    const completedToday = goodHabits.filter((h) => {
      const rec = h.history.find((r) => r.date === today);
      return rec && rec.completed;
    }).length;
    const currentStreak = habits.length > 0 ? Math.max(...habits.map(calculateStreak)) : 0;
    const longestStreak = habits.length > 0 ? Math.max(...habits.map(calculateLongestStreak)) : 0;
    const successRate = calculateOverallSuccessRate(habits);
    const dailyRate = calculateDailyCompletionRate(habits, today);
    const growth = calculateGrowthScore(habits);
    const { goodCompleted, badPerformed } = getGoodVsBadStats(habits);
    const totalDays = habits.length > 0
      ? Math.max(...habits.map((h) => h.history.length))
      : 0;
    const { completed, missed, pending } = getOverallStatus(habits);

    return {
      total, completedToday, currentStreak, longestStreak, successRate,
      dailyRate, growth, goodCompleted, badPerformed, totalDays, completed, missed, pending
    };
  }, [habits, today]);

  const recentHabits = useMemo(() => {
    return habits.slice(0, 6);
  }, [habits]);

  const recentActivity = useMemo(() => {
    const activity = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const dayHabits = habits.filter((h) => h.history.some((r) => r.date === dateStr && r.completed));
      if (dayHabits.length > 0) {
        activity.push({ date: dateStr, habits: dayHabits });
      }
    }
    return activity.slice(0, 5);
  }, [habits]);

  const handleToggle = (id: string) => {
    toggleHabit(id);
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      const rec = habit.history.find((r) => r.date === today);
      const wasCompleted = rec && rec.completed;
      showToast(
        wasCompleted ? `${habit.name} marked as missed` : `${habit.name} completed!`,
        wasCompleted ? 'info' : 'success'
      );
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

  const handleSave = (data: HabitFormData) => {
    if (editingHabit) {
      updateHabit(editingHabit, data);
      showToast('Habit updated successfully', 'success');
    } else {
      addHabit(data);
      showToast('Habit created successfully', 'success');
    }
    setEditingHabit(null);
  };

  const handleConfirmDelete = () => {
    if (deletingHabit) {
      deleteHabit(deletingHabit);
      showToast('Habit deleted', 'success');
      setDeletingHabit(null);
    }
  };

  const editingHabitData = editingHabit ? habits.find((h) => h.id === editingHabit) : undefined;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Habits" value={stats.total} icon={<ListChecks className="w-5 h-5" />} color="blue" />
        <StatCard title="Completed Today" value={`${stats.completedToday}/${stats.total}`} icon={<Target className="w-5 h-5" />} color="green" trend="up" trendValue={`${stats.dailyRate}%`} />
        <StatCard title="Current Streak" value={stats.currentStreak} icon={<Flame className="w-5 h-5" />} color="amber" subtitle="days" />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="purple" trend="up" trendValue={`${stats.growth > 0 ? '+' : ''}${stats.growth}%`} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Longest Streak" value={stats.longestStreak} icon={<Zap className="w-5 h-5" />} color="amber" />
        <StatCard title="Growth Score" value={`${stats.growth > 0 ? '+' : ''}${stats.growth}%`} icon={<Activity className="w-5 h-5" />} color="green" trend={stats.growth >= 0 ? 'up' : 'down'} trendValue="vs last month" />
        <StatCard title="Good Habits" value={stats.goodCompleted} icon={<Shield className="w-5 h-5" />} color="green" />
        <StatCard title="Bad Habits" value={stats.badPerformed} icon={<Shield className="w-5 h-5" />} color="red" />
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Completed</span>
              <span className="text-sm font-semibold text-green-600">{stats.completed}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Missed</span>
              <span className="text-sm font-semibold text-red-600">{stats.missed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{stats.pending}</span>
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
          <EmptyState title="No recent activity" description="Complete some habits to see activity here." />
        ) : (
          <div className="space-y-3">
            {recentActivity.map((day) => (
              <div key={day.date} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{day.date}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {day.habits.map((h) => h.name).join(', ')}
                  </p>
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
