import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface WakeDay { label: string; time: string | null; }

const CHART_H = 80;
const MIN_H = 5;
const MAX_H = 11;
const MONO = Platform.OS === 'web' ? "'Space Mono', monospace" : undefined;

function parseHours(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function barPx(time: string | null): number {
  if (!time) return 0;
  const h = parseHours(time);
  const clamped = Math.max(MIN_H, Math.min(MAX_H, h));
  return Math.max(4, ((MAX_H - clamped) / (MAX_H - MIN_H)) * CHART_H);
}

export default function WakeChart({ days, isDark = true }: { days: WakeDay[]; isDark?: boolean }) {
  const trackBg = isDark ? '#252830' : '#E5E5EA';
  const earlyColor = '#FF4D26';
  const okColor = isDark ? '#993300' : '#FF9970';
  const missedColor = isDark ? '#3A3D45' : '#C7C7CC';
  const dayLabelColor = isDark ? '#8A8D96' : '#AEAEB2';

  return (
    <View style={styles.root}>
      {days.map((d, i) => {
        const h = d.time ? parseHours(d.time) : null;
        const bH = barPx(d.time);
        const isEarly = h !== null && h <= 6.5;
        const isOk = h !== null && h > 6.5 && h <= 7.5;
        const barColor = isEarly ? earlyColor : isOk ? okColor : missedColor;
        const timeLabelColor = isEarly ? earlyColor : isOk ? okColor : missedColor;

        return (
          <View key={i} style={styles.col}>
            <Text style={[styles.timeLabel, { fontFamily: MONO, color: timeLabelColor }]}>
              {d.time ?? ''}
            </Text>
            <View style={[styles.track, { backgroundColor: trackBg }]}>
              {d.time && <View style={[styles.bar, { height: bH, backgroundColor: barColor }]} />}
            </View>
            <Text style={[styles.dayLabel, { color: dayLabelColor }]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8 },
  col: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 8, height: 14, letterSpacing: 0.2, marginBottom: 4 },
  track: {
    width: 14, height: CHART_H,
    borderRadius: 7,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  bar: { alignSelf: 'stretch', borderRadius: 7 },
  dayLabel: {
    fontSize: 9, marginTop: 6,
    letterSpacing: 0.5, fontWeight: '700',
  },
});
