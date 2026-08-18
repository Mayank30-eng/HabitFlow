import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../utils/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = 'habit-tracker-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Try persisted local preference first (instant, no flash)
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    // 2. Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    let active = true;
    if (!getToken()) return;

    api.getSettings()
      .then((settings) => {
        if (active) {
          setTheme(settings.theme);
          localStorage.setItem(THEME_STORAGE_KEY, settings.theme);
        }
      })
      .catch(() => {
        // HabitContext surfaces the user-facing database status.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Persist locally immediately so it survives page reload regardless of API result
      localStorage.setItem(THEME_STORAGE_KEY, next);
      void api.updateSettings({ theme: next }).catch(() => {
        // The visual preference is applied immediately; the app banner handles database failures.
      });
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
