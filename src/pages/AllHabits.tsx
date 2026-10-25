import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, RotateCcw, Search, CheckCircle2, Shield, Layers } from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import HabitCard from '../components/common/HabitCard';
import HabitModal from '../components/modals/HabitModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import { categories, getToday } from '../utils/helpers';
import type { HabitFormData } from '../types';

const AllHabits: React.FC = () => {
  const {
    state,
    toggleHabit,
    deleteHabit,
    addHabit,
    updateHabit,
    getFilteredHabits,
    setFilters,
    resetFilters,
  } = useHabits();
  const { showToast } = useToast();
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const habits = getFilteredHabits();
  const { filters } = state;

  const totalGood = state.habits.filter((h) => h.type === 'good').length;
  const totalBad = state.habits.filter((h) => h.type === 'bad').length;

  const handleToggle = async (id: string) => {
    const habit = state.habits.find((h) => h.id === id);
    const wasMarked = Boolean(habit?.history.find((r) => r.date === getToday())?.completed);
    if (!habit) return;
    try {
      await toggleHabit(id);
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

  const activeFilterCount =
    (filters.type !== 'all' ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const selectClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-elevated-dark text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            All Habits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Manage your complete routine, adjust schedules, and inspect track records
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            type="button"
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              hasActiveFilters || showFilters
                ? 'bg-primary/10 border-primary/30 text-primary dark:text-primary-light shadow-xs'
                : 'bg-surface-light dark:bg-surface-dark border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setEditingHabit(null);
              setHabitModalOpen(true);
            }}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xs shadow-primary/25 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
          </button>
        </div>
      </div>

      {/* Quick Category Metric Pills */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilters({ type: 'all' })}
          type="button"
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            filters.type === 'all'
              ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 shadow-xs'
              : 'bg-surface-light dark:bg-surface-dark border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {state.habits.length}
          </span>
        </button>

        <button
          onClick={() => setFilters({ type: 'good' })}
          type="button"
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            filters.type === 'good'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/40 shadow-xs'
              : 'bg-surface-light dark:bg-surface-dark border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Good</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {totalGood}
          </span>
        </button>

        <button
          onClick={() => setFilters({ type: 'bad' })}
          type="button"
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            filters.type === 'bad'
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-500/40 shadow-xs'
              : 'bg-surface-light dark:bg-surface-dark border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Shield className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Bad</span>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            {totalBad}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-surface-light dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800/80 rounded-2xl px-4 py-3 gap-3 shadow-xs focus-within:border-primary dark:focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search habits by name..."
          value={filters.searchQuery || ''}
          onChange={(e) => setFilters({ searchQuery: e.target.value })}
          className="flex-1 bg-transparent text-sm outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setFilters({ searchQuery: '' })}
            type="button"
            className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors text-xs"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Drawer / Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ type: e.target.value as 'all' | 'good' | 'bad' })}
                    className={selectClass}
                  >
                    <option value="all">All Types</option>
                    <option value="good">Good Habits</option>
                    <option value="bad">Bad Habits</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters({ category: e.target.value || null })}
                    className={selectClass}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ status: e.target.value as 'all' | 'completed' | 'missed' | 'pending' })
                    }
                    className={selectClass}
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
                    type="button"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-elevated-dark text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habit Count & Active Filters Indicator */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium px-1">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{habits.length}</strong> of{' '}
          {state.habits.length} habits
        </span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            type="button"
            className="text-xs text-primary dark:text-primary-light hover:underline font-semibold cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Habit List Grid */}
      {habits.length === 0 ? (
        <EmptyState
          title="No habits found"
          description={
            hasActiveFilters
              ? 'Try adjusting or clearing your filters to see more habits.'
              : 'Start by adding your first habit to build consistency.'
          }
          action={
            hasActiveFilters ? (
              <button
                onClick={resetFilters}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingHabit(null);
                  setHabitModalOpen(true);
                }}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xs shadow-primary/25 transition-all cursor-pointer"
              >
                Add Your First Habit
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Modals */}
      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => {
          setHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleSave}
        title={editingHabit ? 'Edit Habit' : 'Create Habit'}
        initialData={
          editingHabitData
            ? {
                name: editingHabitData.name,
                category: editingHabitData.category,
                type: editingHabitData.type,
                description: editingHabitData.description || '',
                frequency: editingHabitData.frequency,
                customDays: editingHabitData.customDays || [],
                startDate: editingHabitData.startDate,
              }
            : undefined
        }
      />
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setDeletingHabit(null);
        }}
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
