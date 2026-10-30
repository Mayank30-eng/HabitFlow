import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAvatar } from '../../contexts/AvatarContext';
import { useToast } from '../../contexts/ToastContext';
import { AVATAR_OPTIONS, getAvatarById, type AvatarCategory } from '../../utils/avatars';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: AvatarCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Avatars' },
  { id: 'illustrations', label: 'Minimal' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'characters', label: 'Characters' },
  { id: 'geometric', label: 'Geometric' },
];

const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { avatarId, setAvatar } = useAvatar();
  const { showToast } = useToast();

  const [selectedId, setSelectedId] = useState<string>(avatarId);
  const [activeCategory, setActiveCategory] = useState<AvatarCategory | 'all'>('all');

  // Reset selected when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedId(avatarId);
      setActiveCategory('all');
    }
  }, [isOpen, avatarId]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredAvatars = activeCategory === 'all'
    ? AVATAR_OPTIONS
    : AVATAR_OPTIONS.filter((a) => a.category === activeCategory);

  const previewAvatar = getAvatarById(selectedId);

  const handleSave = () => {
    setAvatar(selectedId);
    showToast('Avatar updated successfully!', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Content */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="avatar-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="relative w-full max-w-lg bg-surface-light dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-primary dark:text-primary-light flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 id="avatar-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Choose Your Avatar
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a persona that matches your personal habit journey
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5">
            {/* Live Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl shadow-md overflow-hidden shrink-0 ring-2 ring-primary/40 p-0.5 bg-white dark:bg-slate-800">
                {previewAvatar.render('w-full h-full')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wider">
                    {previewAvatar.categoryLabel}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {previewAvatar.name}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {user?.name || 'Habit Tracker'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'habitflow@example.com'}
                </p>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 p-1">
              {filteredAvatars.map((avatar) => {
                const isSelected = selectedId === avatar.id;
                const isCurrentActive = avatarId === avatar.id;

                return (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedId(avatar.id)}
                    className={`group relative flex flex-col items-center p-2.5 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/40 shadow-sm scale-102'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xs transition-transform group-hover:scale-105">
                      {avatar.render('w-full h-full')}
                    </div>

                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full text-center">
                      {avatar.name}
                    </span>

                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Current saved tag */}
                    {isCurrentActive && !isSelected && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Avatar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AvatarModal;

