import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Quote, ArrowRight } from 'lucide-react';
import { getOrSelectSessionQuote, type MotivationalQuote } from '../../utils/quotes';

interface MotivationalQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MotivationalQuoteModal: React.FC<MotivationalQuoteModalProps> = ({ isOpen, onClose }) => {
  const [quote, setQuote] = useState<MotivationalQuote | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Use the active session quote so popup and navbar match exactly
      setQuote(getOrSelectSessionQuote(false));

      // Prevent page background scrolling while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && quote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Blurred, Darkened Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Card - Centered in Viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg bg-surface-light/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center"
          >
            {/* Top Right Close 'X' Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              title="Close quote (Esc)"
              aria-label="Close quote modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Sparkles Icon */}
            <div className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center mx-auto mb-4 border border-primary/25 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>

            {/* Daily Momentum Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-4 border border-slate-200/60 dark:border-slate-700/50">
              <Quote className="w-3 h-3 text-primary" />
              <span>Daily Momentum</span>
            </div>

            {/* Quote Text */}
            <blockquote
              id="quote-dialog-title"
              className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug mb-3.5 px-2"
            >
              "{quote.text}"
            </blockquote>

            {/* Author */}
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-7">
              — {quote.author}
            </p>

            {/* Primary Action Button */}
            <button
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm shadow-primary/30 transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MotivationalQuoteModal;
