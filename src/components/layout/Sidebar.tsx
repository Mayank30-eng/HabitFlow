import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  CalendarDays,
  Settings,
  Flame,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/habits', label: 'All Habits', icon: ListChecks },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (onClose) onClose();
    void logout();
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <aside
      aria-label="Main Navigation"
      className={`${
        isCollapsed ? 'w-[72px]' : 'w-64'
      } h-full bg-surface-light dark:bg-surface-dark border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-[width] duration-300 ease-in-out select-none`}
    >
      {/* Header / Brand */}
      <div
        className={`border-b border-slate-200/80 dark:border-slate-800 flex items-center ${
          isCollapsed ? 'p-3 flex-col gap-2 justify-center' : 'px-4 py-3.5 justify-between'
        }`}
      >
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl"
          title="HabitFlow Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-xs shadow-primary/20 flex-shrink-0 text-white">
            <Flame className="w-5 h-5 fill-white/20" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                HabitFlow
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                Daily Tracker
              </span>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button (Desktop only) */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4.5 h-4.5" />
            ) : (
              <PanelLeftClose className="w-4.5 h-4.5" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 py-3 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                onClick={onClose}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center rounded-xl text-sm transition-all duration-200 ${
                  isCollapsed
                    ? 'w-11 h-11 mx-auto justify-center'
                    : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:text-primary-light font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive
                      ? 'text-primary dark:text-primary-light'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>

              {/* Floating Tooltip when Collapsed */}
              {isCollapsed && (
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-slate-700/80 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50"
                >
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900/95 dark:border-r-slate-800" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className={`border-t border-slate-200/80 dark:border-slate-800 ${isCollapsed ? 'p-2' : 'p-3'} space-y-2`}>
        {user && (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl bg-primary/15 text-primary dark:text-primary-light font-bold text-xs flex items-center justify-center shadow-xs cursor-default"
                title={user.name}
              >
                {userInitial}
              </div>
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-slate-700/80 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50"
                >
                  Sign out
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900/95 dark:border-r-slate-800" />
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-elevated-dark border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary dark:text-primary-light font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex-shrink-0 cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )
        )}
        {!isCollapsed && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium">
            HabitFlow v1.0
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
