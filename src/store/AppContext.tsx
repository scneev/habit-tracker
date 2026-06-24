import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppState, Challenge, Goal, Habit, HabitLog, IncomeEntry, WakeEntry } from '../types';
import { loadState, saveState } from '../utils/storage';
import { today } from '../utils/dateUtils';

const INITIAL: AppState = {
  habits: [], logs: [], challenge: null, hasOnboarded: false,
  savings: 0, savingsGoal: 0, currency: '$', monthlyIncome: 0,
  incomeLog: [], wakeLog: [], goals: [], notes: {}, isDark: true,
  financeSetup: false,
  planApartmentSav: 0, planCarSav: 0,
  planTodayChecked: {}, planWeeklyChecked: {},
};

type Action =
  | { type: 'LOAD'; payload: AppState }
  | { type: 'ONBOARD' }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'EDIT_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'SET_COUNT'; payload: { habitId: string; date: string; count: number } }
  | { type: 'SET_CHALLENGE'; payload: Challenge }
  | { type: 'MARK_CHALLENGE_REWARDED' }
  | { type: 'CLEAR_CHALLENGE' }
  | { type: 'SET_SAVINGS'; payload: number }
  | { type: 'SET_FINANCE_CONFIG'; payload: Partial<Pick<AppState, 'savingsGoal' | 'currency' | 'monthlyIncome'>> }
  | { type: 'LOG_INCOME'; payload: IncomeEntry }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'LOG_WAKE'; payload: WakeEntry }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'EDIT_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_NOTE'; payload: { date: string; text: string } }
  | { type: 'PLAN_SET_APARTMENT'; payload: number }
  | { type: 'PLAN_SET_CAR'; payload: number }
  | { type: 'PLAN_TODAY_TOGGLE'; payload: { date: string; id: string } }
  | { type: 'PLAN_WEEKLY_TOGGLE'; payload: { weekKey: string; id: string } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD': {
      const raw = action.payload as any;
      const challenge = raw.challenge && typeof raw.challenge === 'object' ? {
        ...raw.challenge,
        durationDays: Number(raw.challenge.durationDays) || 3,
        rewarded: raw.challenge.rewarded === true || raw.challenge.rewarded === 'true',
      } : null;
      return {
        ...INITIAL,
        habits: Array.isArray(raw.habits)
          ? raw.habits.map((h: any) => ({ ...h, volumeGoal: Number(h.volumeGoal) || 1 }))
          : INITIAL.habits,
        logs: Array.isArray(raw.logs)
          ? raw.logs.map((l: any) => ({ ...l, count: Number(l.count) || 0 }))
          : INITIAL.logs,
        challenge,
        hasOnboarded: raw.hasOnboarded === true || raw.hasOnboarded === 'true',
        savings: Number(raw.savings) || 0,
        savingsGoal: Number(raw.savingsGoal) || 0,
        currency: typeof raw.currency === 'string' ? raw.currency : '$',
        monthlyIncome: Number(raw.monthlyIncome) || 0,
        incomeLog: Array.isArray(raw.incomeLog) ? raw.incomeLog : INITIAL.incomeLog,
        wakeLog: Array.isArray(raw.wakeLog) ? raw.wakeLog : INITIAL.wakeLog,
        goals: Array.isArray(raw.goals) ? raw.goals : INITIAL.goals,
        notes: (raw.notes && typeof raw.notes === 'object' && !Array.isArray(raw.notes))
          ? raw.notes
          : INITIAL.notes,
        isDark: raw.isDark === false || raw.isDark === 'false' ? false : raw.isDark === true || raw.isDark === 'true' ? true : INITIAL.isDark,
        financeSetup: raw.financeSetup === true || raw.financeSetup === 'true' || Number(raw.savingsGoal) > 0,
        planApartmentSav: Number(raw.planApartmentSav) || 0,
        planCarSav: Number(raw.planCarSav) || 0,
        planTodayChecked: (raw.planTodayChecked && typeof raw.planTodayChecked === 'object' && !Array.isArray(raw.planTodayChecked)) ? raw.planTodayChecked : {},
        planWeeklyChecked: (raw.planWeeklyChecked && typeof raw.planWeeklyChecked === 'object' && !Array.isArray(raw.planWeeklyChecked)) ? raw.planWeeklyChecked : {},
      };
    }
    case 'ONBOARD':
      return { ...state, hasOnboarded: true };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'EDIT_HABIT':
      return { ...state, habits: state.habits.map((h) => h.id === action.payload.id ? action.payload : h) };
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.payload),
        logs: state.logs.filter((l) => l.habitId !== action.payload),
      };
    case 'SET_COUNT': {
      const { habitId, date, count } = action.payload;
      const existing = state.logs.findIndex((l) => l.habitId === habitId && l.date === date);
      const logs = existing >= 0
        ? state.logs.map((l, i) => (i === existing ? { ...l, count } : l))
        : [...state.logs, { habitId, date, count }];
      return { ...state, logs };
    }
    case 'SET_CHALLENGE':
      return { ...state, challenge: action.payload };
    case 'MARK_CHALLENGE_REWARDED':
      return state.challenge ? { ...state, challenge: { ...state.challenge, rewarded: true } } : state;
    case 'CLEAR_CHALLENGE':
      return { ...state, challenge: null };
    case 'SET_SAVINGS':
      return { ...state, savings: action.payload };
    case 'SET_FINANCE_CONFIG':
      return { ...state, ...action.payload, financeSetup: true };
    case 'LOG_INCOME':
      return { ...state, incomeLog: [action.payload, ...state.incomeLog] };
    case 'DELETE_INCOME':
      return { ...state, incomeLog: state.incomeLog.filter((e) => e.id !== action.payload) };
    case 'LOG_WAKE': {
      const exists = state.wakeLog.findIndex((w) => w.date === action.payload.date);
      const wakeLog = exists >= 0
        ? state.wakeLog.map((w, i) => (i === exists ? action.payload : w))
        : [...state.wakeLog, action.payload];
      return { ...state, wakeLog };
    }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'EDIT_GOAL':
      return { ...state, goals: state.goals.map((g) => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload) };
    case 'TOGGLE_THEME':
      return { ...state, isDark: !state.isDark };
    case 'SET_NOTE': {
      const { date, text } = action.payload;
      const updated = { ...state.notes };
      if (text.trim()) updated[date] = text;
      else delete updated[date];
      return { ...state, notes: updated };
    }
    case 'PLAN_SET_APARTMENT':
      return { ...state, planApartmentSav: action.payload };
    case 'PLAN_SET_CAR':
      return { ...state, planCarSav: action.payload };
    case 'PLAN_TODAY_TOGGLE': {
      const { date, id } = action.payload;
      const existing = state.planTodayChecked[date] ?? [];
      const next = existing.includes(id) ? existing.filter((x) => x !== id) : [...existing, id];
      return { ...state, planTodayChecked: { ...state.planTodayChecked, [date]: next } };
    }
    case 'PLAN_WEEKLY_TOGGLE': {
      const { weekKey, id } = action.payload;
      const existing = state.planWeeklyChecked[weekKey] ?? [];
      const next = existing.includes(id) ? existing.filter((x) => x !== id) : [...existing, id];
      return { ...state, planWeeklyChecked: { ...state.planWeeklyChecked, [weekKey]: next } };
    }
    default:
      return state;
  }
}

interface Ctx { state: AppState; dispatch: React.Dispatch<Action>; isReady: boolean; }
const Context = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [isReady, setIsReady] = React.useState(false);
  useEffect(() => {
    loadState().then((saved) => {
      if (saved) dispatch({ type: 'LOAD', payload: saved as AppState });
      setIsReady(true);
    });
  }, []);
  useEffect(() => {
    if (!isReady) return;
    saveState(state);
  }, [state, isReady]);
  return <Context.Provider value={{ state, dispatch, isReady }}>{children}</Context.Provider>;
}

export function useAppStore() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useAppStore must be inside AppProvider');
  return ctx;
}

export function useIsReady() {
  const ctx = useContext(Context);
  return ctx?.isReady ?? false;
}

export function getLogForDate(logs: HabitLog[], habitId: string, date: string): HabitLog | undefined {
  return logs.find((l) => l.habitId === habitId && l.date === date);
}

export function isCompletedOn(logs: HabitLog[], habit: Habit, date: string): boolean {
  const log = getLogForDate(logs, habit.id, date);
  return !!log && log.count >= habit.volumeGoal;
}

export function calculateStreak(habit: Habit, logs: HabitLog[]): number {
  const t = today();
  const todayDone = isCompletedOn(logs, habit, t);
  let streak = 0;
  const start = todayDone ? 0 : 1;
  for (let i = start; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!isCompletedOn(logs, habit, dateStr)) break;
    streak++;
  }
  return streak;
}

export function challengeProgress(state: AppState): { day: number; allDone: boolean } {
  const { challenge, habits, logs } = state;
  if (!challenge) return { day: 0, allDone: false };
  const challengeHabits = habits.filter((h) => challenge.habitIds.includes(h.id));
  let completedDays = 0;
  for (let i = 0; i < challenge.durationDays; i++) {
    const d = new Date(challenge.startDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const allDoneOnDay = challengeHabits.every((h) => isCompletedOn(logs, h, dateStr));
    if (allDoneOnDay) completedDays++;
  }
  const currentDay = Math.min(challenge.durationDays, Math.max(1, daysBetweenSimple(challenge.startDate, today()) + 1));
  return { day: currentDay, allDone: completedDays >= challenge.durationDays };
}

function daysBetweenSimple(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
}

export function getMonthIncome(incomeLog: IncomeEntry[], yearMonth: string): number {
  return incomeLog.filter((e) => e.date.startsWith(yearMonth)).reduce((sum, e) => sum + e.amount, 0);
}

export function getWakeForDate(wakeLog: WakeEntry[], date: string): string | null {
  return wakeLog.find((w) => w.date === date)?.time ?? null;
}
