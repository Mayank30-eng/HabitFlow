import React, { useState } from 'react';
import {
  Sun, Moon, Download, Trash2, Database, Layers, CheckCircle2, Shield, Info, ChevronRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import { exportData } from '../utils/storage';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/modals/ConfirmModal';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, resetData } = useHabits();
  const { showToast } = useToast();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleExport = () => {
    const data = exportData(state.habits);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-export-${formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  };

  const handleReset = async () => {
    try {
      await resetData();
      showToast('All habit data reset successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to reset data', 'error');
    }
  };

  const totalRecords = state.habits.reduce((acc, h) => acc + h.history.length, 0);
  const goodHabitsCount = state.habits.filter((h) => h.type === 'good').length;
  const badHabitsCount = state.habits.filter((h) => h.type === 'bad').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
          Customize interface appearance, manage data backups, and inspect app metrics
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Interface Appearance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle between clean light mode and immersive dark mode
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            type="button"
            className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-primary/5 border-primary shadow-xs'
                : 'bg-slate-50 dark:bg-elevated-dark border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Sun className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Light Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Bright & crisp</p>
              </div>
            </div>
            {theme === 'light' && (
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </button>

          <button
            onClick={() => theme === 'light' && toggleTheme()}
            type="button"
            className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-primary/10 border-primary shadow-xs'
                : 'bg-slate-50 dark:bg-elevated-dark border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400">
                <Moon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Dark Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Deep & focused</p>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:text-primary-light border border-primary/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Data Management & Backup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export your records for safekeeping, restore backups, or reset data
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Export Button */}
          <button
            onClick={handleExport}
            type="button"
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/70 dark:border-slate-800/70 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                  Export Habit Data
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Download all active habits and completion logs as a JSON file
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Reset All Data Button */}
          <button
            onClick={() => setConfirmResetOpen(true)}
            type="button"
            className="w-full flex items-center justify-between p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Reset All Data
                </p>
                <p className="text-xs text-rose-500/80 dark:text-rose-400/80">
                  Permanently clear all habits, check-ins, and activity logs
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
              Reset
            </span>
          </button>
        </div>
      </div>

      {/* App Stats Section */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Application Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
              {state.habits.length}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Configured habits
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">Good</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {goodHabitsCount}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Habits to build
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">Bad</span>
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {badHabitsCount}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Habits to break
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
              <Database className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">Logs</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
              {totalRecords}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Recorded entries
            </div>
          </div>
        </div>
      </div>

      {/* App Information Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-elevated-dark/50 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>HabitFlow v1.0 • Client sync & local persistence enabled</span>
        </div>
        <span className="font-semibold text-slate-600 dark:text-slate-300">Production Ready</span>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleReset}
        title="Reset All Data"
        message="This will permanently delete all your habits and tracking history. This action cannot be undone."
        confirmText="Reset Everything"
        variant="danger"
      />
    </div>
  );
};

export default Settings;
