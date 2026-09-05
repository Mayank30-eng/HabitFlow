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

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-elevated-dark text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Habit Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="e.g., Morning Workout"
            required
          />
          {errors.name && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              {(['good', 'bad'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    form.type === t
                      ? t === 'good'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                        : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-surface-light dark:bg-elevated-dark border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t === 'good' ? 'Good' : 'Bad'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Frequency
          </label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value as 'daily' | 'weekly' | 'custom' })}
            className={inputClass}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom Days</option>
          </select>
        </div>

        {form.frequency === 'custom' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Active Days
            </label>
            <div className="flex gap-1.5">
              {dayNames.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  aria-pressed={form.customDays.includes(i)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    form.customDays.includes(i)
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      : 'bg-surface-light dark:bg-elevated-dark border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {form.customDays.includes(i) && <Check className="w-3 h-3 mx-auto mb-0.5 stroke-[3]" />}
                  <span>{day}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Optional purpose, trigger, or routine notes..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={form.startDate}
            min={!initialData ? today : undefined}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className={inputClass}
            required
          />
          {errors.startDate && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">{errors.startDate}</p>}
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-xs shadow-primary/25 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer active:scale-98"
          >
            Save Habit
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default HabitModal;
