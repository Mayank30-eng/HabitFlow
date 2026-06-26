import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks, BarChart3, CalendarDays, Settings, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/habits', label: 'All Habits', icon: ListChecks },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const location = useLocation();

  return (
    <aside className="w-60 h-full bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-slate-900 dark:text-slate-50">HabitFlow</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-l-2 border-green-500'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-0.5 h-6 bg-green-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
          HabitFlow v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
