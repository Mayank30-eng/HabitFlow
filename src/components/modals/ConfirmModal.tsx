import React from 'react';
import Modal from '../common/Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 ${
            variant === 'danger'
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-medium">
          {message}
        </p>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-elevated-dark text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              variant === 'danger'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
