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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

// ─── Analytics Types (from backend persistDerivedData) ──────────────────────

export interface GoodHabitOverallStats {
  total: number;
  completedToday: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface BadHabitOverallStats {
  total: number;
  avoidedToday: number;
  performedToday: number;
  avoidanceRate: number;
  bestAvoidanceStreak: number;
  longestAvoidanceStreak: number;
  totalRelapses: number;
  totalOccurrences: number;
  totalAvoidedDays: number;
  occurrencesThisWeek: number;
  occurrencesThisMonth: number;
  penaltyImpact: number;
}

export interface OverallAnalytics {
  successRate: number;
  totalHabits: number;
  good: GoodHabitOverallStats;
  bad: BadHabitOverallStats;
}

export interface PerHabitMetrics {
  currentStreak: number;
  longestStreak: number;
  avoidanceStreak: number;
  longestAvoidanceStreak: number;
  successRate: number;
  totalSuccesses: number;
  occurrences: number;
  relapseCount: number;
  penaltyImpact: number;
  impactScore: number;
  trend: Array<{
    date: string;
    successes: number;
    failures: number;
    total: number;
    status?: 'completed' | 'missed' | 'pending' | 'unscheduled' | 'avoided' | 'performed' | string;
    pending?: number;
    isToday?: boolean;
    scheduled?: boolean;
  }>;
}

export interface TrendDataPoint {
  date: string;
  completed: number;
  total: number;
  missed?: number;
  pending?: number;
  rate?: number;
  isToday?: boolean;
}

export interface BadHabitTrendDataPoint {
  date: string;
  avoided: number;
  occurrences: number;
  total: number;
}

export interface WeeklyDataPoint {
  week: string;
  rate: number;
}

export interface MonthlyDataPoint {
  month: string;
  rate: number;
}

export interface HabitComparisonPoint {
  name: string;
  rate: number;
  type: 'good' | 'bad';
}

export interface TodayStatus {
  completed: number;
  missed: number;
  pending: number;
}

export interface GoodVsBadStats {
  goodCompleted: number;
  badAvoided: number;
  badPerformed: number;
  badTotal: number;
}

export interface GoodHabitDashboardStats {
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  completedToday: number;
  totalGood: number;
}

export interface BadHabitDashboardStats {
  bestAvoidanceStreak: number;
  longestAvoidanceStreak: number;
  totalRelapses: number;
  totalOccurrences: number;
  totalAvoidedDays: number;
  occurrencesThisWeek: number;
  occurrencesThisMonth: number;
  avoidanceRate: number;
  penaltyImpact: number;
}

export interface EnrichedAnalytics {
  overall: OverallAnalytics;
  perHabit: Record<string, PerHabitMetrics>;
  trends: {
    completion: TrendDataPoint[];
    badHabit: BadHabitTrendDataPoint[];
    weekly: WeeklyDataPoint[];
    monthly: MonthlyDataPoint[];
  };
  comparison: HabitComparisonPoint[];
  todayStatus: TodayStatus;
  goodVsBad: GoodVsBadStats;
  growthScore: number;
  overallSuccessRate: number;
  goodStats: GoodHabitDashboardStats;
  badStats: BadHabitDashboardStats;
}

// ─── App State ──────────────────────────────────────────────────────────────

export interface PersistedAppState {
  habits: Habit[];
  settings: UserSettings;
  analytics?: EnrichedAnalytics;
}

