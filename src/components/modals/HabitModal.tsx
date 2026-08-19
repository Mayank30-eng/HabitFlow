import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { categories, formatDate } from '../../utils/helpers';
import type { HabitFormData } from '../../types';
import { Check } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HabitFormData) => void;
  initialData?: Partial<HabitFormData>;
  title: string;
}

const defaultForm: HabitFormData = {
  name: '',
  category: 'Health',
  type: 'good',
  description: '',
  frequency: 'daily',
  customDays: [],
  startDate: formatDate(new Date()),
};

const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSubmit, initialData, title }) => {
  const [form, setForm] = useState<HabitFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm({ ...defaultForm, ...initialData });
    } else {
      setForm({ ...defaultForm });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const today = formatDate(new Date());

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.startDate) {
      errs.startDate = 'Start date is required';
    } else if (!initialData && form.startDate < today) {
      errs.startDate = 'Start date cannot be in the past';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
      onClose();
    }
  };

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      customDays: prev.customDays.includes(day)
        ? prev.customDays.filter((d) => d !== day)
        : [...prev.customDays, day].sort(),
    }));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Habit Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g., Morning Workout"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
            <div className="flex gap-2">
              {(['good', 'bad'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.type === t
                      ? t === 'good'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t === 'good' ? 'Good Habit' : 'Bad Habit'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value as 'daily' | 'weekly' | 'custom' })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom Days</option>
          </select>
        </div>

        {form.frequency === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Days</label>
            <div className="flex gap-1">
              {dayNames.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.customDays.includes(i)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {form.customDays.includes(i) && <Check className="w-3 h-3 mx-auto mb-0.5" />}
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 outline-none resize-none"
            placeholder="Optional description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
          <input
            type="date"
            value={form.startDate}
            min={!initialData ? today : undefined}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 outline-none"
          />
          {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
          >
            Save Habit
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default HabitModal;
