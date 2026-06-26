import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Download, Upload, Trash2, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useHabits } from '../contexts/HabitContext';
import { useToast } from '../contexts/ToastContext';
import { exportData, importData } from '../utils/storage';
import ConfirmModal from '../components/modals/ConfirmModal';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, importData: importHabits } = useHabits();
  const { showToast } = useToast();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    const data = exportData(state.habits);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (Array.isArray(data)) {
        importHabits(data);
        showToast('Data imported successfully', 'success');
        setImportText('');
        setShowImport(false);
      } else {
        showToast('Invalid data format', 'error');
      }
    } catch {
      showToast('Invalid JSON format', 'error');
    }
  };

  const handleReset = () => {
    localStorage.removeItem('habit-tracker-data');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>

      {/* Appearance */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-blue-400" />}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Theme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{theme === 'light' ? 'Light mode' : 'Dark mode'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="relative w-12 h-7 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors"
          >
            <motion.div
              className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md"
              animate={{ x: theme === 'dark' ? 18 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Data Management</h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
          >
            <Download className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Export Data</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download your habits as JSON</p>
            </div>
          </button>

          <button
            onClick={() => setShowImport(!showImport)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
          >
            <Upload className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Import Data</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Restore habits from JSON</p>
            </div>
          </button>

          {showImport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={4}
                placeholder="Paste your JSON data here..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Import
                </button>
                <button
                  onClick={() => { setShowImport(false); setImportText(''); }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          <button
            onClick={() => setConfirmResetOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Reset All Data</p>
              <p className="text-xs text-red-500 dark:text-red-400">Clear all habits and history</p>
            </div>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">App Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{state.habits.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Habits</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {state.habits.filter((h) => h.type === 'good').length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Good Habits</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {state.habits.filter((h) => h.type === 'bad').length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Bad Habits</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {state.habits.reduce((acc, h) => acc + h.history.length, 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Records</div>
          </div>
        </div>
      </div>

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
