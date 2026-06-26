import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Habit, HabitFormData, FilterState } from '../types';
import { saveHabits, loadHabits } from '../utils/storage';
import { generateId, getToday, getHabitRecord } from '../utils/helpers';
import createDemoHabits from '../data/demoData';

interface HabitState {
  habits: Habit[];
  filters: FilterState;
}

type HabitAction =
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_HABIT'; payload: { id: string; date: string } }
  | { type: 'REORDER_HABITS'; payload: Habit[] }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'IMPORT_DATA'; payload: Habit[] };

const initialFilters: FilterState = {
  dateRange: 'today',
  category: null,
  status: 'all',
  type: 'all',
  searchQuery: '',
};

const habitReducer = (state: HabitState, action: HabitAction): HabitState => {
  switch (action.type) {
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.payload.id ? action.payload : h)),
      };
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.payload) };
    case 'TOGGLE_HABIT': {
      const { id, date } = action.payload;
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== id) return h;
          const existing = h.history.find((rec) => rec.date === date);
          if (existing) {
            return {
              ...h,
              history: h.history.map((rec) =>
                rec.date === date ? { ...rec, completed: !rec.completed } : rec
              ),
            };
          }
          return { ...h, history: [...h.history, { date, completed: true }] };
        }),
      };
    }
    case 'REORDER_HABITS':
      return { ...state, habits: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET_FILTERS':
      return { ...state, filters: initialFilters };
    case 'IMPORT_DATA':
      return { ...state, habits: action.payload };
    default:
      return state;
  }
};

interface HabitContextType {
  state: HabitState;
  addHabit: (data: HabitFormData) => void;
  updateHabit: (id: string, data: HabitFormData) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, date?: string) => void;
  reorderHabits: (habits: Habit[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  importData: (habits: Habit[]) => void;
  getFilteredHabits: () => Habit[];
  getTodayStatus: (id: string) => boolean | null;
}

const HabitContext = createContext<HabitContextType | null>(null);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(habitReducer, {
    habits: [],
    filters: initialFilters,
  });

  useEffect(() => {
    const saved = loadHabits();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      dispatch({ type: 'SET_HABITS', payload: saved as Habit[] });
    } else {
      const demo = createDemoHabits();
      dispatch({ type: 'SET_HABITS', payload: demo });
    }
  }, []);

  useEffect(() => {
    saveHabits(state.habits);
  }, [state.habits]);

  const addHabit = useCallback((data: HabitFormData) => {
    const habit: Habit = {
      id: generateId(),
      ...data,
      createdAt: getToday(),
      history: [],
      order: state.habits.length,
    };
    dispatch({ type: 'ADD_HABIT', payload: habit });
  }, [state.habits.length]);

  const updateHabit = useCallback((id: string, data: HabitFormData) => {
    const existing = state.habits.find((h) => h.id === id);
    if (!existing) return;
    const updated: Habit = { ...existing, ...data };
    dispatch({ type: 'UPDATE_HABIT', payload: updated });
  }, [state.habits]);

  const deleteHabit = useCallback((id: string) => {
    dispatch({ type: 'DELETE_HABIT', payload: id });
  }, []);

  const toggleHabit = useCallback((id: string, date?: string) => {
    dispatch({ type: 'TOGGLE_HABIT', payload: { id, date: date || getToday() } });
  }, []);

  const reorderHabits = useCallback((habits: Habit[]) => {
    dispatch({ type: 'REORDER_HABITS', payload: habits });
  }, []);

  const setFilters = useCallback((filters: Partial<FilterState>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const importData = useCallback((habits: Habit[]) => {
    dispatch({ type: 'IMPORT_DATA', payload: habits });
  }, []);

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
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabit,
        reorderHabits,
        setFilters,
        resetFilters,
        importData,
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
