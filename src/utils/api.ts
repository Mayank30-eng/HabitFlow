import type { Habit, HabitFormData, PersistedAppState, UserSettings } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const USER_KEY = import.meta.env.VITE_USER_ID || 'default-user';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set('X-User-Id', USER_KEY);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message: unknown }).message)
      : 'Unable to save your changes. Please try again.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
};

export const api = {
  getState: () => request<PersistedAppState>('/state'),

  createHabit: (data: HabitFormData) => request<{ state: PersistedAppState }>('/habits', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateHabit: (id: string, data: HabitFormData) => request<{ state: PersistedAppState }>(`/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteHabit: (id: string) => request<{ state: PersistedAppState }>(`/habits/${id}`, {
    method: 'DELETE',
  }),

  toggleHabit: (id: string, date: string) => request<{ state: PersistedAppState }>(`/habits/${id}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  }),

  reorderHabits: (habits: Habit[]) => request<{ state: PersistedAppState }>('/habits/reorder', {
    method: 'PUT',
    body: JSON.stringify({ habits }),
  }),

  importHabits: (habits: Habit[], replace = false) => request<{ state: PersistedAppState }>('/import', {
    method: 'POST',
    body: JSON.stringify({ habits, replace }),
  }),

  resetData: () => request<{ state: PersistedAppState }>('/data', {
    method: 'DELETE',
  }),

  getSettings: () => request<UserSettings>('/settings'),

  updateSettings: (settings: UserSettings) => request<UserSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};
