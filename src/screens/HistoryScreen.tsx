import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore, isCompletedOn, calculateStreak } from '../store/AppContext';
import { getColors } from '../utils/theme';
import { today } from '../utils/dateUtils';
import { Habit } from '../types';

import { MONO } from '../utils/fonts';

// Grid config for the main list (14 weeks)
const LIST_WEEKS = 14;
const LIST_DOT = 10;
const LIST_GAP = 3;

// Grid config for the detail popup (52 weeks = full year)
const DETAIL_WEEKS = 52;
const DETAIL_DOT = 7;
const DETAIL_GAP = 2;

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function buildGrid(weeks: number): { date: string | null }[][] {
  const now = new Date();
  const todayDow = now.getDay();
  const monOffset = todayDow === 0 ? 6 : todayDow - 1;
  const startMonday = new Date(now);
  startMonday.setDate(now.getDate() - monOffset - (weeks - 1) * 7);
  startMonday.setHours(0, 0, 0, 0);
  const todayDate = new Date(now);
  todayDate.setHours(0, 0, 0, 0);

  const grid: { date: string | null }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { date: string | null }[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(startMonday);
      cell.setDate(startMonday.getDate() + w * 7 + d);
      if (cell > todayDate) {
        col.push({ date: null });
      } else {
        col.push({
          date: `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, '0')}-${String(cell.getDate()).padStart(2, '0')}`,
        });
      }
    }
    grid.push(col);
  }
  return grid;
}

interface DotGridProps {
  grid: { date: string | null }[][];
  habit: Habit;
  logs: any[];
  dotSize: number;
  gap: number;
  todayStr: string;
  accentColor: string;
  borderColor: string;
}

function DotGrid({ grid, habit, logs, dotSize, gap, todayStr, accentColor, borderColor }: DotGridProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={[styles.dayLabels, { gap }]}>
        {DAY_LABELS.map((l, i) => (
          <View key={i} style={{ height: dotSize, justifyContent: 'center' }}>
            <Text style={[styles.dayLabel, { color: borderColor, fontFamily: MONO, fontSize: dotSize < 10 ? 7 : 9 }]}>{l}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.dotsRow, { gap }]}>
          {grid.map((week, wi) => (
            <View key={wi} style={{ gap }}>
              {week.map((cell, di) => {
                if (!cell.date) return <View key={di} style={{ width: dotSize, height: dotSize }} />;
                const done = isCompletedOn(logs, habit, cell.date);
                const isToday = cell.date === todayStr;
                return (
                  <View
                    key={di}
                    style={{
                      width: dotSize, height: dotSize,
                      borderRadius: dotSize / 2,
                      backgroundColor: done ? accentColor : 'transparent',
                      borderWidth: isToday && !done ? 1.5 : 1,
                      borderColor: done ? accentColor : isToday ? '#888888' : borderColor,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function HabitDetailModal({ habit, logs, visible, onClose, c, t }: {
  habit: Habit; logs: any[]; visible: boolean; onClose: () => void;
  c: ReturnType<typeof getColors>; t: string;
}) {
  const detailGrid = buildGrid(DETAIL_WEEKS);
  const flatDays = detailGrid.flat().filter((x) => x.date);
  const streak = calculateStreak(habit, logs);
  const totalDone = flatDays.filter((x) => x.date && isCompletedOn(logs, habit, x.date!)).length;
  const rate = flatDays.length > 0 ? Math.round((totalDone / flatDays.length) * 100) : 0;

  // Best day of week
  const dayCounts = Array(7).fill(0);
  const dayTotals = Array(7).fill(0);
  detailGrid.forEach((week) => {
    week.forEach((cell, di) => {
      if (!cell.date) return;
      dayTotals[di]++;
      if (isCompletedOn(logs, habit, cell.date)) dayCounts[di]++;
    });
  });
  const dayRates = dayCounts.map((c, i) => dayTotals[i] > 0 ? Math.round((c / dayTotals[i]) * 100) : 0);
  const bestDayIdx = dayRates.indexOf(Math.max(...dayRates));
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.detailRoot, { backgroundColor: c.bg }]}>
        {/* Header */}
        <View style={[styles.detailHeader, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.detailClose, { backgroundColor: c.surface2 }]}>
            <Text style={[styles.detailCloseTxt, { color: c.text, fontFamily: MONO }]}>✕</Text>
          </TouchableOpacity>
          <View style={styles.detailTitleRow}>
            <Text style={styles.detailEmoji}>{habit.emoji}</Text>
            <View>
              <Text style={[styles.detailName, { color: c.text, fontFamily: MONO }]} numberOfLines={1}>
                {habit.name.toUpperCase()}
              </Text>
              <Text style={[styles.detailSub, { color: c.muted, fontFamily: MONO }]}>LAST 365 DAYS</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.detailContent}>
          {/* Full year dot grid */}
          <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: c.isDark ? 1 : 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: c.isDark ? 0 : 0.06, shadowRadius: 14 }]}>
            <DotGrid
              grid={detailGrid}
              habit={habit}
              logs={logs}
              dotSize={DETAIL_DOT}
              gap={DETAIL_GAP}
              todayStr={t}
              accentColor={c.accent}
              borderColor={c.border}
            />
          </View>

          {/* Highlights */}
          <Text style={[styles.detailSection, { color: c.muted, fontFamily: MONO }]}>HIGHLIGHTS</Text>
          <View style={styles.highlightGrid}>
            <View style={[styles.highlightCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: c.isDark ? 1 : 0 }]}>
              <Text style={[styles.highlightNum, { color: c.accent, fontFamily: MONO }]}>{streak}</Text>
              <Text style={[styles.highlightLabel, { color: c.muted, fontFamily: MONO }]}>Current Streak</Text>
            </View>
            <View style={[styles.highlightCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: c.isDark ? 1 : 0 }]}>
              <Text style={[styles.highlightNum, { color: c.accent, fontFamily: MONO }]}>{totalDone}</Text>
              <Text style={[styles.highlightLabel, { color: c.muted, fontFamily: MONO }]}>Completions</Text>
            </View>
            <View style={[styles.highlightCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: c.isDark ? 1 : 0 }]}>
              <Text style={[styles.highlightNum, { color: c.accent, fontFamily: MONO }]}>{rate}%</Text>
              <Text style={[styles.highlightLabel, { color: c.muted, fontFamily: MONO }]}>Completion Rate</Text>
            </View>
            <View style={[styles.highlightCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: c.isDark ? 1 : 0 }]}>
              <Text style={[styles.highlightBestDay, { color: c.accent, fontFamily: MONO }]}>{dayRates[bestDayIdx] > 0 ? dayNames[bestDayIdx] : '—'}</Text>
              <Text style={[styles.highlightLabel, { color: c.muted, fontFamily: MONO }]}>Best Day</Text>
            </View>
          </View>

          {/* Day of week breakdown */}
          <Text style={[styles.detailSection, { color: c.muted, fontFamily: MONO }]}>BY DAY OF WEEK</Text>
          <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: c.isDark ? 1 : 0 }]}>
            {dayNames.map((dayName, i) => (
              <View key={i} style={[styles.dayRow, { borderBottomColor: c.border }, i === 6 && { borderBottomWidth: 0 }]}>
                <Text style={[styles.dayName, { color: c.muted, fontFamily: MONO }]}>{dayName.slice(0, 3).toUpperCase()}</Text>
                <View style={[styles.dayBar, { backgroundColor: c.border }]}>
                  <View style={{ flex: dayRates[i], backgroundColor: c.accent, borderRadius: 3 }} />
                  <View style={{ flex: Math.max(0, 100 - dayRates[i]) }} />
                </View>
                <Text style={[styles.dayRate, { color: c.accent, fontFamily: MONO }]}>{dayRates[i]}%</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function HistoryScreen() {
  const { state } = useAppStore();
  const { habits, logs } = state;
  const c = getColors(state.isDark);
  const t = today();
  const listGrid = buildGrid(LIST_WEEKS);
  const flatDays = listGrid.flat().filter((x) => x.date);

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const totalDaysTracked = Array.from(new Set(logs.filter((l) => l.count > 0).map((l) => l.date))).length;

  const cardStyle = {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: c.isDark ? 1 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: c.isDark ? 0 : 0.06,
    shadowRadius: 14,
    elevation: c.isDark ? 0 : 2,
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text, fontFamily: MONO }]}>HISTORY</Text>
        <Text style={[styles.headerSub, { color: c.dim, fontFamily: MONO }]}>
          {totalDaysTracked} days tracked · {habits.length} habits
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {habits.length === 0 ? (
          <Text style={[styles.empty, { color: c.muted, fontFamily: MONO }]}>
            Add habits on the Today tab to start tracking history
          </Text>
        ) : (
          habits.map((habit) => {
            const streak = calculateStreak(habit, logs);
            const doneDays = flatDays.filter((cell) => cell.date && isCompletedOn(logs, habit, cell.date!)).length;
            const rate = flatDays.length > 0 ? Math.round((doneDays / flatDays.length) * 100) : 0;

            return (
              <Pressable key={habit.id} onPress={() => setSelectedHabit(habit)}>
                <View style={[styles.card, cardStyle]}>
                  <View style={styles.habitHeader}>
                    <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitName, { color: c.text, fontFamily: MONO }]} numberOfLines={1}>
                        {habit.name.toUpperCase()}
                      </Text>
                      <Text style={[styles.habitSub, { color: c.dim, fontFamily: MONO }]}>
                        {doneDays}/{flatDays.length} days · Tap for full year →
                      </Text>
                    </View>
                    {streak > 0 && (
                      <View style={[styles.streakBadge, { backgroundColor: c.accentBg, borderColor: c.accent, borderWidth: 1 }]}>
                        <Text style={[styles.streakTxt, { color: c.accent, fontFamily: MONO }]}>{streak}▲</Text>
                      </View>
                    )}
                  </View>

                  <DotGrid
                    grid={listGrid}
                    habit={habit}
                    logs={logs}
                    dotSize={LIST_DOT}
                    gap={LIST_GAP}
                    todayStr={t}
                    accentColor={c.accent}
                    borderColor={c.border}
                  />

                  <View style={styles.rateRow}>
                    <View style={[styles.rateTrack, { backgroundColor: c.border }]}>
                      <View style={{ flex: rate, backgroundColor: c.accent, borderRadius: 2 }} />
                      <View style={{ flex: Math.max(0, 100 - rate) }} />
                    </View>
                    <Text style={[styles.rateTxt, { color: c.accent, fontFamily: MONO }]}>{rate}%</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          logs={logs}
          visible={!!selectedHabit}
          onClose={() => setSelectedHabit(null)}
          c={c}
          t={t}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  headerSub: { fontSize: 11, letterSpacing: 0.5, marginTop: 4 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 15, lineHeight: 26 },

  card: { borderRadius: 18, padding: 16 },
  habitHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  habitEmoji: { fontSize: 24 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  habitSub: { fontSize: 11, marginTop: 2, letterSpacing: 0.2 },
  streakBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  streakTxt: { fontSize: 13, fontWeight: '800' },

  dayLabels: { marginRight: 7, flexShrink: 0 },
  dayLabel: { fontWeight: '700', width: 10 },
  dotsRow: { flexDirection: 'row' },

  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  rateTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  rateTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, minWidth: 36, textAlign: 'right' },

  // Detail Modal
  detailRoot: { flex: 1 },
  detailHeader: {
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  detailClose: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  detailCloseTxt: { fontSize: 14, fontWeight: '700' },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  detailEmoji: { fontSize: 28 },
  detailName: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  detailSub: { fontSize: 10, letterSpacing: 1.5, marginTop: 2 },
  detailContent: { padding: 16, gap: 12, paddingBottom: 48 },
  detailCard: { borderRadius: 18, padding: 14, overflow: 'hidden' },
  detailSection: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4 },

  highlightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  highlightCard: {
    width: (Dimensions.get('window').width - 32 - 10) / 2,
    borderRadius: 16, padding: 16,
    alignItems: 'flex-start',
  },
  highlightNum: { fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  highlightBestDay: { fontSize: 18, fontWeight: '800', letterSpacing: 0, lineHeight: 40 },
  highlightLabel: { fontSize: 11, marginTop: 4, letterSpacing: 0.3 },

  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1,
  },
  dayName: { fontSize: 10, fontWeight: '700', letterSpacing: 1, width: 32 },
  dayBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  dayRate: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, minWidth: 36, textAlign: 'right' },
});
