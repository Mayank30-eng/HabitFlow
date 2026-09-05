import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'indigo';
}

const colorMap = {
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  indigo: 'bg-primary/10 text-primary dark:text-primary-light border-primary/20',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendBg =
    trend === 'up'
      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50'
      : trend === 'down'
      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl border flex items-center justify-center ${colorMap[color] || colorMap.indigo}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${trendBg}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-1">
        {value}
      </div>
      <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </div>
      {subtitle && (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
