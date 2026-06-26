import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Search, User } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, searchQuery, onSearchChange }) => {
  const { theme, toggleTheme } = useTheme();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{greeting}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Let's build some great habits today</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-sm outline-none w-48 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-slate-300" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
