import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  CalendarDays,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../common/Logo';

interface NavItem {
  path: string;
  label: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', tooltip: 'Dashboard', icon: LayoutDashboard },
  { path: '/habits', label: 'All Habits', tooltip: 'Habits', icon: ListChecks },
  { path: '/analytics', label: 'Analytics', tooltip: 'Insights', icon: BarChart3 },
  { path: '/calendar', label: 'Calendar', tooltip: 'Calendar', icon: CalendarDays },
  { path: '/settings', label: 'Settings', tooltip: 'Settings', icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  return (
    <aside
      aria-label="Main Navigation"
      className="w-[72px] h-full bg-surface-light dark:bg-surface-dark border-r border-slate-200/80 dark:border-slate-800 flex flex-col items-center select-none"
    >
      {/* Brand Logo Header */}
      <div className="h-14 w-full border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-center shrink-0">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 p-1.5 shadow-xs border border-emerald-500/20 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          title="HabitFlow Home"
          aria-label="HabitFlow Home"
        >
          <Logo className="w-full h-full" />
        </Link>
      </div>

      {/* Navigation Controls (Icon-Only with Interactive Tooltips) */}
      <nav className="flex-1 py-4 w-full flex flex-col items-center space-y-2 px-2.5">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <div key={item.path} className="relative group w-full flex justify-center">
              <Link
                to={item.path}
                onClick={onClose}
                aria-label={item.tooltip}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:text-primary-light font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-primary dark:text-primary-light'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }`}
                />

                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>

              {/* Accessible Interactive Tooltip on Hover & Keyboard Focus */}
              <div
                role="tooltip"
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-xs font-semibold whitespace-nowrap shadow-xl border border-slate-700/80 dark:border-slate-700 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 z-50"
              >
                {item.tooltip}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
