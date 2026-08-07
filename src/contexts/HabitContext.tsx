import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { Habit, HabitFormData, FilterState, PersistedAppState, UserSettings } from '../types';
import { getToday, getHabitRecord } from '../utils/helpers';
import { api } from '../utils/api';
import {
  clearLegacyHabits,
  hasCompletedMongoMigration,
  loadLegacyHabits,
  markMongoMigrationComplete,
} from '../utils/storage';

interface HabitState {
  habits: Habit[];
  filters: FilterState;
  loading: boolean;
  saving: boolean;
  error: string | null;
  settings: UserSettings;
  analytics?: unknown;
}

type HabitAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_APP_STATE'; payload: PersistedAppState }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'RESET_FILTERS' };

const initialFilters: FilterState = {
  dateRange: 'today',
  category: null,
  status: 'all',
  type: 'all',
  searchQuery: '',
};

const normalizeHabit = (habit: Habit): Habit => {
  if (habit.type !== 'bad') return habit;
  return {
    ...habit,
    history: habit.history.filter((record) => record.completed),
  };
};

const normalizeHabits = (habits: Habit[]): Habit[] => habits.map(normalizeHabit);

const applyAppState = (state: HabitState, payload: PersistedAppState): HabitState => ({
  ...state,
  habits: normalizeHabits(payload.habits || []),
  settings: payload.settings || state.settings,
  analytics: payload.analytics,
  error: null,
});

const habitReducer = (state: HabitState, action: HabitAction): HabitState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_APP_STATE':
      return applyAppState(state, action.payload);
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET_FILTERS':
      return { ...state, filters: initialFilters };
    default:
      return state;
  }
};

interface HabitContextType {
  state: HabitState;
  refreshData: () => Promise<void>;
  addHabit: (data: HabitFormData) => Promise<void>;
  updateHabit: (id: string, data: HabitFormData) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabit: (id: string, date?: string) => Promise<void>;
  reorderHabits: (habits: Habit[]) => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  importData: (habits: Habit[], replace?: boolean) => Promise<void>;
  resetData: () => Promise<void>;
  getFilteredHabits: () => Habit[];
  getTodayStatus: (id: string) => boolean | null;
}

const HabitContext = createContext<HabitContextType | null>(null);

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unable to save your changes. Please try again.';
};

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(habitReducer, {
    habits: [],
    filters: initialFilters,
    loading: true,
    saving: false,
    error: null,
    settings: { theme: 'light' },
  });

  const loadState = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      let appState = await api.getState();
      const legacyHabits = loadLegacyHabits();

      if (
        appState.habits.length === 0 &&
        Array.isArray(legacyHabits) &&
        legacyHabits.length > 0 &&
        !hasCompletedMongoMigration()
      ) {
        const migrated = await api.importHabits(legacyHabits as Habit[], false);
        appState = migrated.state;
        markMongoMigrationComplete();
        clearLegacyHabits();
      }

      dispatch({ type: 'SET_APP_STATE', payload: appState });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const persist = useCallback(async (operation: () => Promise<{ state: PersistedAppState }>) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const result = await operation();
      dispatch({ type: 'SET_APP_STATE', payload: result.state });
    } catch (error) {
      const message = getErrorMessage(error);
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, []);

  const addHabit = useCallback((data: HabitFormData) => {
    return persist(() => api.createHabit(data));
  }, [persist]);

  const updateHabit = useCallback((id: string, data: HabitFormData) => {
    return persist(() => api.updateHabit(id, data));
  }, [persist]);

  const deleteHabit = useCallback((id: string) => {
    return persist(() => api.deleteHabit(id));
  }, [persist]);

  const toggleHabit = useCallback((id: string, date?: string) => {
    return persist(() => api.toggleHabit(id, date || getToday()));
  }, [persist]);

  const reorderHabits = useCallback((habits: Habit[]) => {
    return persist(() => api.reorderHabits(habits));
  }, [persist]);

  const setFilters = useCallback((filters: Partial<FilterState>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const importData = useCallback((habits: Habit[], replace = false) => {
    return persist(() => api.importHabits(habits, replace));
  }, [persist]);

  const resetData = useCallback(() => {
    return persist(() => api.resetData());
  }, [persist]);

  const getFilteredHabits = useCallback((): Habit[] => {
    let result = [...state.habits];
    const { filters } = state;

    if (filters.type !== 'all') {
      result = result.filter((h) => h.type === filters.type);
    }
    if (filters.category) {
      result = result.filter((h) => h.category === filters.category);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(q));
    }

    const today = getToday();
    if (filters.status === 'completed') {
      result = result.filter((h) => {
        const record = getHabitRecord(h, today);
        return record && record.completed;
      });
    } else if (filters.status === 'missed') {
      result = result.filter((h) => {
        const record = getHabitRecord(h, today);
        return record && !record.completed;
      });
    } else if (filters.status === 'pending') {
      result = result.filter((h) => !getHabitRecord(h, today));
    }

    return result;
  }, [state]);

  const getTodayStatus = useCallback((id: string): boolean | null => {
    const habit = state.habits.find((h) => h.id === id);
    if (!habit) return null;
    const record = getHabitRecord(habit, getToday());
    if (!record) return null;
    return record.completed;
  }, [state.habits]);

  return (
    <HabitContext.Provider
      value={{
        state,
        refreshData: loadState,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabit,
        reorderHabits,
        setFilters,
        resetFilters,
        importData,
        resetData,
        getFilteredHabits,
        getTodayStatus,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within HabitProvider');
  return context;
};
