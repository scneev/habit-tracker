export type HabitType = 'binary' | 'volume';

export interface Habit {
  id: string; name: string; emoji: string; color: string;
  type: HabitType; volumeGoal: number; createdAt: string;
  reminderTime?: string;
}

export interface HabitLog { habitId: string; date: string; count: number; }

export interface Challenge {
  id: string; name: string; durationDays: number;
  startDate: string; habitIds: string[]; rewarded: boolean;
}

export interface IncomeEntry {
  id: string; date: string; amount: number; source: string; note?: string;
}

export interface WakeEntry { date: string; time: string; } // 'HH:MM'

export interface Goal {
  id: string; name: string; emoji: string;
  target: number; current: number;
  deadline?: string; color: string;
}

export interface AppState {
  habits: Habit[];
  logs: HabitLog[];
  challenge: Challenge | null;
  hasOnboarded: boolean;
  savings: number;
  savingsGoal: number;
  currency: string;
  monthlyIncome: number;
  incomeLog: IncomeEntry[];
  wakeLog: WakeEntry[];
  goals: Goal[];
  notes: Record<string, string>;
  isDark: boolean;
  financeSetup: boolean;
  planApartmentSav: number;
  planCarSav: number;
  planTodayChecked: Record<string, string[]>;
  planWeeklyChecked: Record<string, string[]>;
}
