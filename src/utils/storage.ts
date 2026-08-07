const STORAGE_KEY = 'habit-tracker-data';
const MIGRATION_KEY = 'habit-tracker-mongodb-migrated';

export const loadLegacyHabits = (): unknown => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const hasCompletedMongoMigration = (): boolean => {
  try {
    return localStorage.getItem(MIGRATION_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markMongoMigrationComplete = (): void => {
  try {
    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const clearLegacyHabits = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable browser storage.
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
