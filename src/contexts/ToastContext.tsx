import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastMessage } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string, type: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colorMap = {
    success: 'text-green-500 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
    error: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = iconMap[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 min-w-[300px] ${colorMap[toast.type]}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 text-slate-900 dark:text-slate-100">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
