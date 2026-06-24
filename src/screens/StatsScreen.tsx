import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, calculateStreak, isCompletedOn, getWakeForDate } from '../store/AppContext';
import ConsistencyChart from '../components/ConsistencyChart';
import WakeChart from '../components/WakeChart';
import { today } from '../utils/dateUtils';
import { getColors } from '../utils/theme';
import { MONO, NUMS } from '../utils/fonts';
import { WEEKLY_HARD_NUMBERS } from '../data/plannerData';

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return days;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function BentoHero({
  value, label, bg, numColor, labelColor, delay,
}: {
  value: string; label: string; bg: string; numColor: string; labelColor: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true, tension: 120, friction: 14, delay,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.bentoCard,
        { backgroundColor: bg, transform: [{ scale: anim }] },
      ]}
    >
      <Text style={[styles.bentoNum, { color: numColor, fontFamily: NUMS }]} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.bentoLabel, { color: labelColor, fontFamily: MONO }]}>{label}</Text>
    </Animated.View>
  );
}

export default function StatsScreen() {
  const { state } = useAppStore();
  const nav = useNavigation<any>();
  const c = getColors(state.isDark);
  const { habits, logs, wakeLog } = state;
  const t = today();
  const days7 = last7Days();

  const todayDone = habits.filter((h) => isCompletedOn(logs, h, t)).length;
  const todayRate = habits.length > 0 ? Math.round((todayDone / habits.length) * 100) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => calculateStreak(h, logs))) : 0;
  const weekRate =
    habits.length > 0
      ? Math.round(
          (days7.reduce((sum, d) => sum + habits.filter((h) => isCompletedOn(logs, h, d)).length, 0) /
            (habits.length * 7)) *
            100
        )
      : 0;

  const todayWake = getWakeForDate(wakeLog, t);
  const wakeDays = days7.map((dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      time: getWakeForDate(wakeLog, dateStr),
      label: DAY_LABELS[d.getDay()].toUpperCase().slice(0, 1),
    };
  });
  const wakeCount = wakeDays.filter((d) => d.time).length;

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 16 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: c.muted, fontFamily: MONO }]}>overview</Text>
        <Text style={[styles.title, { color: c.text }]}>STATS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ─── BENTO HERO NUMBERS ─── */}
        <Animated.View style={[styles.bentoRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* TODAY % — orange fill */}
          <BentoHero
            value={`${todayRate}%`}
            label="today"
            bg={c.accent}
            numColor={c.cream}
            labelColor="rgba(237,234,227,0.7)"
            delay={0}
          />
          {/* BEST STREAK — dark surface */}
          <BentoHero
            value={`${bestStreak}`}
            label="streak"
            bg={c.surface}
            numColor={c.accent}
            labelColor={c.muted}
            delay={80}
          />
          {/* 7-DAY AVG — cream fill */}
          <BentoHero
            value={`${weekRate}%`}
            label="7-day avg"
            bg={c.cream}
            numColor={c.bg}
            labelColor="rgba(20,22,27,0.55)"
            delay={160}
          />
        </Animated.View>

        {/* ─── WAKE TIME ─────────────────────── */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: c.muted, fontFamily: MONO }]}>wake time</Text>
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: c.accent }]}
              onPress={() => nav.navigate('LogWake')}
            >
              <Text style={[styles.logBtnTxt, { color: c.cream, fontFamily: MONO }]}>+ log</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wakeRow}>
            <View>
              <Text style={[styles.wakeBig, { color: c.text, fontFamily: NUMS }]}>{todayWake ?? '—:——'}</Text>
              <Text style={[styles.wakeSub, { color: c.muted, fontFamily: MONO }]}>
                {todayWake
                  ? parseInt(todayWake.split(':')[0]) <= 6
                    ? 'early riser'
                    : parseInt(todayWake.split(':')[0]) <= 7
                    ? 'solid start'
                    : 'logged'
                  : 'not logged today'}
              </Text>
            </View>
            <View style={[styles.wakeCountBox, { backgroundColor: c.accentBg }]}>
              <Text style={[styles.wakeCountNum, { color: c.accent, fontFamily: NUMS }]}>{wakeCount}/7</Text>
              <Text style={[styles.wakeCountLabel, { color: c.muted, fontFamily: MONO }]}>this week</Text>
            </View>
          </View>

          <WakeChart days={wakeDays} isDark={state.isDark} />
        </View>

        {/* ─── CONSISTENCY CHART ───────────────── */}
        <View style={[styles.card, { backgroundColor: c.surface, padding: 0, overflow: 'hidden' }]}>
          <Text style={[styles.cardLabel, { color: c.muted, fontFamily: MONO, padding: 16, paddingBottom: 4 }]}>
            30-day consistency
          </Text>
          <ConsistencyChart habits={habits} logs={logs} isDark={state.isDark} />
        </View>

        {/* ─── HABIT STREAKS ─────────────────── */}
        {habits.length > 0 ? (
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <Text style={[styles.cardLabel, { color: c.muted, fontFamily: MONO, marginBottom: 12 }]}>habit streaks</Text>
            {habits.map((h, idx) => {
              const streak = calculateStreak(h, logs);
              const done7 = days7.filter((d) => isCompletedOn(logs, h, d)).length;
              return (
                <View
                  key={h.id}
                  style={[
                    styles.habitRow,
                    { borderBottomColor: c.border },
                    idx === habits.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.habitEmojiWrap, { backgroundColor: c.surface2 }]}>
                    <Text style={styles.habitEmoji}>{h.emoji}</Text>
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, { color: c.text, fontFamily: MONO }]} numberOfLines={1}>
                      {h.name.toUpperCase()}
                    </Text>
                    <Text style={[styles.habitSub, { color: c.muted, fontFamily: MONO }]}>{done7}/7 this week</Text>
                  </View>
                  <View style={[styles.streakBadge, { backgroundColor: streak > 0 ? c.accentBg : c.surface2 }]}>
                    <Text style={[styles.streakNum, { color: streak > 0 ? c.accent : c.muted, fontFamily: MONO }]}>
                      {streak}d
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.empty, { color: c.muted, fontFamily: MONO }]}>add habits to see stats</Text>
        )}

        {/* ─── WEEKLY TARGETS ─────────────────── */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.cardLabel, { color: '#eab308', fontFamily: MONO, marginBottom: 12 }]}>weekly targets</Text>
          {WEEKLY_HARD_NUMBERS.map((item, i) => (
            <View key={i} style={[styles.targetRow, i < WEEKLY_HARD_NUMBERS.length - 1 && { borderBottomColor: c.border, borderBottomWidth: 1 }]}>
              <Text style={[styles.targetDot, { color: c.accent }]}>·</Text>
              <Text style={[styles.targetTxt, { color: c.muted, fontFamily: MONO }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 },
  headerLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 4 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  bentoRow: { flexDirection: 'row', gap: 10 },
  bentoCard: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  bentoNum: { fontSize: 48, fontWeight: '200', letterSpacing: -1, lineHeight: 52 },
  bentoLabel: { fontSize: 9, letterSpacing: 2, marginTop: 6, textAlign: 'center' },

  card: { borderRadius: 28, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardLabel: { fontSize: 10, letterSpacing: 3 },
  logBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  logBtnTxt: { fontSize: 10, letterSpacing: 2 },

  wakeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  wakeBig: { fontSize: 42, letterSpacing: -1, lineHeight: 46 },
  wakeSub: { fontSize: 10, letterSpacing: 1.5, marginTop: 4 },
  wakeCountBox: { borderRadius: 16, padding: 12, alignItems: 'center' },
  wakeCountNum: { fontSize: 24, letterSpacing: -0.5 },
  wakeCountLabel: { fontSize: 9, letterSpacing: 2, marginTop: 2 },

  habitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  habitEmojiWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitEmoji: { fontSize: 20 },
  habitInfo: { flex: 1, minWidth: 0 },
  habitName: { fontSize: 11, letterSpacing: 1.5 },
  habitSub: { fontSize: 10, marginTop: 3, letterSpacing: 1 },
  streakBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 44, alignItems: 'center' },
  streakNum: { fontSize: 14, letterSpacing: 1 },
  empty: { textAlign: 'center', marginTop: 48, fontSize: 12, letterSpacing: 2, lineHeight: 24 },
  targetRow: { flexDirection: 'row', gap: 10, paddingVertical: 9, alignItems: 'flex-start' },
  targetDot: { fontSize: 18, lineHeight: 22, marginTop: -2 },
  targetTxt: { flex: 1, fontSize: 11, letterSpacing: 0.5, lineHeight: 18 },
});
