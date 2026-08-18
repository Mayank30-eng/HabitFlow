import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, RotateCcw, Search } from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import HabitCard from '../components/common/HabitCard';
import HabitModal from '../components/modals/HabitModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import { categories, getToday } from '../utils/helpers';
import type { HabitFormData } from '../types';

const AllHabits: React.FC = () => {
  const { state, toggleHabit, deleteHabit, addHabit, updateHabit, getFilteredHabits, setFilters, resetFilters } = useHabits();
  const { showToast } = useToast();
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const habits = getFilteredHabits();
  const { filters } = state;

  const handleToggle = async (id: string) => {
    const habit = state.habits.find((h) => h.id === id);
    const wasMarked = Boolean(habit?.history.find((r) => r.date === getToday())?.completed);
    if (!habit) return;
    try {
      await toggleHabit(id);
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

  const editingHabitData = editingHabit ? state.habits.find((h) => h.id === editingHabit) : undefined;

  const hasActiveFilters = filters.type !== 'all' || filters.category || filters.status !== 'all' || filters.searchQuery;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">All Habits</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => { setEditingHabit(null); setHabitModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 gap-3 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search habits by name..."
          value={filters.searchQuery || ''}
          onChange={(e) => setFilters({ searchQuery: e.target.value })}
          className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setFilters({ searchQuery: '' })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ type: e.target.value as 'all' | 'good' | 'bad' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="all">All Types</option>
                <option value="good">Good Habits</option>
                <option value="bad">Bad Habits</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ category: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value as 'all' | 'completed' | 'missed' | 'pending' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Habit Count */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {habits.length} of {state.habits.length} habits
      </p>

      {/* Habit List */}
      {habits.length === 0 ? (
        <EmptyState
          title="No habits found"
          description={hasActiveFilters ? "Try adjusting your filters to see more habits." : "Start by adding your first habit."}
          action={
            <button
              onClick={() => { setEditingHabit(null); setHabitModalOpen(true); }}
              className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Add Habit
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map((habit, i) => (
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

export default AllHabits;
