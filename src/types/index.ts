export interface HabitRecord {
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  type: 'good' | 'bad';
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[];
  startDate: string;
  createdAt: string;
  history: HabitRecord[];
  order: number;
}

export interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  category: string | null;
  status: 'all' | 'completed' | 'missed' | 'pending';
  type: 'all' | 'good' | 'bad';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface HabitFormData {
  name: string;
  category: string;
  type: 'good' | 'bad';
  description: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays: number[];
  startDate: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
}

export interface PersistedAppState {
  user?: {
    id: string;
    key: string;
    name: string;
  };
  habits: Habit[];
  settings: UserSettings;
  analytics?: unknown;
}
