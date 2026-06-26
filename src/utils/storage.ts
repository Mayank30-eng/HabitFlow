const STORAGE_KEY = 'habit-tracker-data';
const THEME_KEY = 'habit-tracker-theme';

export const saveHabits = (habits: unknown): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {
    // Storage full or unavailable
  }
};

export const loadHabits = (): unknown => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
};

export const loadTheme = (): 'light' | 'dark' | null => {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
};

export const exportData = (data: unknown): string => {
  return JSON.stringify(data, null, 2);
};

export const importData = (json: string): unknown => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};
