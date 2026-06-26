import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function today(): string {
  return formatDate(new Date());
}

export function useCurrentDate(): string {
  const [date, setDate] = useState(today);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setDate(today());
    });

    // Fire 1 second after midnight to flip the date
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = midnight.getTime() - now.getTime() + 1000;
    const timer = setTimeout(() => setDate(today()), ms);

    return () => { sub.remove(); clearTimeout(timer); };
  }, []);

  return date;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateMinusDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

export function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00').getTime();
  const d2 = new Date(b + 'T00:00:00').getTime();
  return Math.round((d2 - d1) / 86400000);
}

export function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function last14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}
