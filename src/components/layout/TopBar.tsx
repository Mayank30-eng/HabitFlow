import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, Quote, Sparkles, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAvatar } from '../../contexts/AvatarContext';
import UserAvatar from '../common/UserAvatar';
import AvatarModal from '../modals/AvatarModal';
import { getOrSelectSessionQuote, type MotivationalQuote } from '../../utils/quotes';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { avatarId } = useAvatar();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.trim().split(' ')[0] : null;
  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
  };

  return (
    <>
      <header className="h-14 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-colors">
        {/* Left: Mobile Menu Trigger & Greeting / Date */}
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

        {/* Center: Motivational Quote */}
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

        {/* Right: Theme Switcher & Interactive Navbar Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-light transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>

          {user && (
            <div className="relative">
              {/* Profile Avatar Trigger Button */}
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`relative rounded-xl p-0.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  isDropdownOpen
                    ? 'ring-2 ring-primary shadow-sm'
                    : 'hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600'
                }`}
                aria-label="User profile menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
              >
                <UserAvatar
                  avatarId={avatarId}
                  userName={user.name}
                  size="sm"
                  showBorder={false}
                />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    ref={dropdownRef}
                    role="menu"
                    aria-label="User Profile"
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-72 bg-surface-light dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-slate-800 dark:text-slate-100"
                  >
                    {/* User Profile Info Card */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 mb-2">
                      <div className="w-11 h-11 shrink-0">
                        <UserAvatar
                          avatarId={avatarId}
                          userName={user.name}
                          size="lg"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsAvatarModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                        role="menuitem"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
                        <span>Change Avatar</span>
                        <span className="ml-auto text-[10px] bg-primary/10 text-primary dark:text-primary-light font-bold px-2 py-0.5 rounded-full">
                          Custom
                        </span>
                      </button>

                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:rotate-45 transition-transform" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="my-2 border-t border-slate-200/80 dark:border-slate-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer group"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* Suggested Avatar Selection Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </>
  );
};

export default TopBar;
