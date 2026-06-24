import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from '../types';

const KEY = '@habitly:state';

export async function loadState(): Promise<AppState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) { console.log('[storage] nothing saved'); return null; }
    const parsed = JSON.parse(raw) as AppState;
    console.log('[storage] loaded habits:', parsed.habits?.length ?? 0);
    return parsed;
  } catch (e) {
    console.error('[storage] load failed:', e);
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    console.log('[storage] saved habits:', state.habits.length);
  } catch (e) {
    console.error('[storage] save failed:', e);
  }
}
