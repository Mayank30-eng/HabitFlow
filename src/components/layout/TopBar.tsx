import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, Menu, Quote } from 'lucide-react';
import { getOrSelectSessionQuote, type MotivationalQuote } from '../../utils/quotes';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [quote, setQuote] = useState<MotivationalQuote | null>(() => {
    try {
      return getOrSelectSessionQuote(false);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleQuoteUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<MotivationalQuote>;
      if (customEvent.detail) {
        setQuote(customEvent.detail);
      }
    };
    window.addEventListener('habitflow:quote_updated', handleQuoteUpdate);
    return () => window.removeEventListener('habitflow:quote_updated', handleQuoteUpdate);
  }, []);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.trim().split(' ')[0] : null;
  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-14 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-colors">
      {/* Left: Greeting & Date */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
            {greeting}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Center: Motivational Quote (Horizontal Center of Navbar) */}
      {quote && (
        <div className="hidden md:flex flex-1 items-center justify-center px-4 max-w-xl mx-auto overflow-hidden">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 shadow-xs max-w-full overflow-hidden transition-all hover:border-primary/40"
            title={`"${quote.text}" — ${quote.author}`}
          >
            <Quote className="w-3 h-3 text-primary shrink-0 opacity-80" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate tracking-wide">
              <span className="italic font-semibold text-slate-900 dark:text-slate-100">
                "{quote.text}"
              </span>
              {quote.author && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5 font-normal not-italic hidden lg:inline">
                  — {quote.author}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Right: Theme Switcher & User Profile Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-light transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>
        {user && (
          <div
            className="w-7.5 h-7.5 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-bold text-xs flex items-center justify-center border border-primary/20 shadow-xs cursor-default"
            title={user.name}
            aria-label={`Logged in as ${user.name}`}
          >
            {userInitial}
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
