import React from 'react';
import { motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary dark:text-primary-light flex items-center justify-center mb-4 border border-primary/20 shadow-xs">
        {icon || <PackageOpen className="w-7 h-7 sm:w-8 sm:h-8" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 font-medium leading-relaxed">
        {description}
      </p>
      {action}
    </motion.div>
  );
};

export default EmptyState;
