import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Habit, HabitLog } from '../types';
import { isCompletedOn } from '../store/AppContext';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  isDark?: boolean;
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return days;
}

const DAY_LABELS = ['6D', '5D', '4D', '3D', '2D', 'YST', 'TDY'];

export default function ConsistencyChart({ habits, logs, isDark = true }: Props) {
  const days = last7Days();
  const monoFont = Platform.OS === 'web' ? "'Space Mono', monospace" : undefined;

  const rates = days.map((date) => {
    if (habits.length === 0) return 0;
    const done = habits.filter((h) => isCompletedOn(logs, h, date)).length;
    return done / habits.length;
  });

  const maxRate = Math.max(...rates, 0.01);

  const trackColor = isDark ? '#252830' : '#E5E5EA';
  const fullColor = '#FF4D26';
  const partialColor = isDark ? '#6B2000' : '#FFCBB5';
  const labelColor = isDark ? '#8A8D96' : '#6C6C70';
  const dayLabelColor = isDark ? '#8A8D96' : '#AEAEB2';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: labelColor }]}>7-DAY CONSISTENCY</Text>
      <View style={styles.chart}>
        {rates.map((rate, i) => (
          <View key={i} style={styles.barCol}>
            <View style={[styles.barBg, { backgroundColor: trackColor }]}>
              <View style={{ flex: Math.max(0, maxRate - rate) }} />
              <View
                style={[
                  styles.barFill,
                  {
                    flex: rate,
                    backgroundColor: rate >= 1 ? fullColor : rate > 0 ? partialColor : trackColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, { fontFamily: monoFont, color: dayLabelColor }]}>{DAY_LABELS[i]}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: fullColor }]} />
        <Text style={[styles.legendTxt, { color: labelColor }]}>ALL DONE</Text>
        <View style={[styles.dot, { backgroundColor: partialColor, marginLeft: 12 }]} />
        <Text style={[styles.legendTxt, { color: labelColor }]}>PARTIAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 },
  barCol: { flex: 1, alignItems: 'center' },
  barBg: {
    alignSelf: 'stretch',
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { alignSelf: 'stretch', borderRadius: 4 },
  dayLabel: {
    fontSize: 8,
    marginTop: 5,
    letterSpacing: 0.5,
  },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: {
    fontSize: 9,
    marginLeft: 4,
    letterSpacing: 1,
  },
});
