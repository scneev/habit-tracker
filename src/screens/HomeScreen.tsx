import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  useAppStore, calculateStreak, challengeProgress,
  getLogForDate, isCompletedOn, getWakeForDate,
} from '../store/AppContext';
import HabitCard from '../components/HabitCard';
import { AnimBar } from '../components/AnimBar';
import { friendlyDate, useCurrentDate } from '../utils/dateUtils';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { getColors } from '../utils/theme';
import { MONO, NUMS } from '../utils/fonts';
import { TODAY_TASKS } from '../data/plannerData';

function daysToPayday(target: number): number {
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
  let next = new Date(y, mo, target);
  if (d > target) next = new Date(y, mo + 1, target);
  return Math.max(0, Math.ceil((next.getTime() - new Date(y, mo, d).getTime()) / 86400000));
}

function fmtK(n: number, cur: string): string {
  if (n >= 1_000_000) return `${cur}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${cur}${(n / 1_000).toFixed(0)}K`;
  return `${cur}${n}`;
}

function fmtKNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function friendlyDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function animStyle(anim: Animated.Value, dy = 18) {
  return {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  };
}

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];

export default function HomeScreen() {
  const { state, dispatch } = useAppStore();
  const nav = useNavigation<any>();
  const t = useCurrentDate();
  const c = getColors(state.isDark);
  const { habits, logs, challenge, savings, savingsGoal, currency, wakeLog, notes, goals, financeSetup } = state;
  const completed = habits.filter((h) => isCompletedOn(logs, h, t)).length;
  const cp = challengeProgress(state);

  const noteText = notes[t] ?? '';
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [celebration, setCelebration] = useState<{ type: 'allDone' | 'streak'; streak?: number; habitName?: string } | null>(null);
  const prevCompleted = useRef(completed);

  const todayChecked = state.planTodayChecked[t] ?? [];

  const headerAnim = useRef(new Animated.Value(0)).current;
  const widgetsAnim = useRef(new Animated.Value(0)).current;
  const goalWidgetAnim = useRef(new Animated.Value(0)).current;
  const noteAnim = useRef(new Animated.Value(0)).current;
  const habitAnims = useRef(Array.from({ length: 30 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const initCount = habits.length;
    Animated.sequence([
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 22 }),
      Animated.parallel([
        Animated.spring(widgetsAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 22 }),
        Animated.spring(goalWidgetAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 22 }),
      ]),
      Animated.stagger(
        45,
        [...habitAnims.slice(0, Math.max(initCount, 1)), noteAnim].map((a) =>
          Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 180, friction: 22 })
        )
      ),
    ]).start(() => {
      habitAnims.forEach((a, i) => { if (i >= initCount) a.setValue(1); });
    });
  }, []);

  useEffect(() => {
    if (challenge && cp.allDone && !challenge.rewarded) {
      dispatch({ type: 'MARK_CHALLENGE_REWARDED' });
      nav.navigate('ChallengeComplete');
    }
  }, [cp.allDone]);

  function handleSetCount(habitId: string, count: number) {
    const habit = habits.find((h) => h.id === habitId);
    const wasCompleted = habit ? isCompletedOn(logs, habit, t) : false;
    const willComplete = habit ? count >= habit.volumeGoal : false;

    dispatch({ type: 'SET_COUNT', payload: { habitId, date: t, count } });

    if (!wasCompleted && willComplete && habit) {
      // Compute new streak (optimistically include today)
      const patchedLogs = [...logs.filter((l) => !(l.habitId === habitId && l.date === t)), { habitId, date: t, count }];
      const newStreak = calculateStreak(habit, patchedLogs);
      const allWillBeDone = habits.every((h) => h.id === habitId ? willComplete : isCompletedOn(logs, h, t));

      if (allWillBeDone && habits.length > 0) {
        setTimeout(() => setCelebration({ type: 'allDone' }), 300);
      } else if (STREAK_MILESTONES.includes(newStreak)) {
        setTimeout(() => setCelebration({ type: 'streak', streak: newStreak, habitName: habit.name }), 300);
      }
    }
  }

  function openNote() {
    setDraftNote(noteText);
    setNoteExpanded(true);
  }

  function saveNote() {
    dispatch({ type: 'SET_NOTE', payload: { date: t, text: draftNote } });
    setNoteExpanded(false);
  }

  const hasSavings = financeSetup;
  const savingsPct = savingsGoal > 0 ? Math.min(100, (savings / savingsGoal) * 100) : 0;
  const pd20 = daysToPayday(20);
  const pd5 = daysToPayday(5);
  const todayWake = getWakeForDate(wakeLog, t);

  const pastNotes = Object.entries(notes)
    .filter(([date, text]) => date !== t && text.trim())
    .sort(([a], [b]) => b.localeCompare(a));

  const cardStyle = {
    backgroundColor: c.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: c.isDark ? 0 : 0.06,
    shadowRadius: 14,
    elevation: c.isDark ? 0 : 2,
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>

      {/* ─── HEADER ─────────────────────────── */}
      <Animated.View style={[styles.topBar, animStyle(headerAnim, -8)]}>
        <Pressable onLongPress={() => nav.navigate('DevTools')}>
          <Text style={[styles.headerLabel, { color: c.muted, fontFamily: MONO }]}>
            {friendlyDate(t).toLowerCase()}
          </Text>
          <Text style={[styles.appTitle, { color: c.text }]}>HABITS.</Text>
        </Pressable>
        <View style={styles.headerRight}>
          {todayWake ? (
            <View style={[styles.wakeChip, { backgroundColor: c.surface }]}>
              <Text style={[styles.wakeChipTxt, { color: c.muted, fontFamily: MONO }]}>{todayWake}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => nav.navigate('LogWake')}
              style={[styles.wakeChip, { backgroundColor: c.surface }]}
            >
              <Text style={[styles.wakeLogTxt, { color: c.muted, fontFamily: MONO }]}>+ wake</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ─── PROGRESS HERO ──────────────────── */}
      {habits.length > 0 && (
        <Animated.View style={[styles.progressRow, animStyle(widgetsAnim)]}>
          <View style={[styles.progressCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.progressSmall, { color: c.muted, fontFamily: MONO }]}>done today</Text>
            <View style={styles.progressNums}>
              <Text style={[styles.progressDone, { color: c.accent, fontFamily: NUMS }]}>{completed}</Text>
              <Text style={[styles.progressSep, { color: c.dim, fontFamily: NUMS }]}>/</Text>
              <Text style={[styles.progressTotal, { color: c.muted, fontFamily: NUMS }]}>{habits.length}</Text>
            </View>
          </View>
          {hasSavings && (
            <TouchableOpacity
              style={[styles.financeCard, { backgroundColor: c.cream }]}
              onPress={() => nav.navigate('Money')}
            >
              <Text style={[styles.financeLabel, { color: 'rgba(20,22,27,0.55)', fontFamily: MONO }]}>savings</Text>
              <Text style={[styles.financeAmt, { color: c.bg }]}>
                <Text style={{ fontWeight: '100' }}>{currency}</Text>
                <Text style={{ fontFamily: NUMS }}>{fmtKNum(savings)}</Text>
              </Text>
              <View style={[styles.financeTrack, { backgroundColor: 'rgba(20,22,27,0.15)' }]}>
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${savingsPct}%` as any, backgroundColor: c.bg, borderRadius: 3 }} />
              </View>
              <Text style={[styles.financePct, { color: 'rgba(20,22,27,0.55)', fontFamily: MONO }]}>
                {pd20 === 0 ? 'payday!' : `${pd20}d to 20th`}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* ─── CHALLENGE BANNER ──────────────── */}
      {challenge && !cp.allDone && (
        <Animated.View style={[{ marginHorizontal: 16, marginBottom: 10 }, animStyle(widgetsAnim)]}>
          <View style={[styles.challengeBanner, { backgroundColor: c.accent }]}>
            <Text style={[styles.challengeBannerTxt, { color: c.cream, fontFamily: MONO }]}>
              day {cp.day} · {challenge.name.toUpperCase()}
            </Text>
          </View>
        </Animated.View>
      )}
      {!challenge && habits.length > 0 && (
        <Animated.View style={animStyle(widgetsAnim)}>
          <TouchableOpacity onPress={() => nav.navigate('CreateChallenge')}>
            <Text style={[styles.challengeCta, { color: c.muted, fontFamily: MONO }]}>start a challenge →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ─── SCROLLABLE CONTENT ─────────────── */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>

        {/* Goals widget */}
        {goals.length > 0 && (
          <Animated.View style={animStyle(goalWidgetAnim)}>
            <TouchableOpacity
              style={[styles.goalsCard, { backgroundColor: c.cream }]}
              onPress={() => nav.navigate('Money')}
              activeOpacity={0.85}
            >
              <View style={styles.goalCardHeader}>
                <Text style={[styles.goalCardLabel, { color: 'rgba(20,22,27,0.5)', fontFamily: MONO }]}>saving for</Text>
                <Text style={[styles.goalCardArrow, { color: 'rgba(20,22,27,0.45)', fontFamily: MONO }]}>manage →</Text>
              </View>
              {goals.slice(0, 3).map((g) => {
                const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
                return (
                  <View key={g.id} style={styles.goalMiniRow}>
                    <Text style={styles.goalMiniEmoji}>{g.emoji}</Text>
                    <View style={styles.goalMiniContent}>
                      <View style={styles.goalMiniTop}>
                        <Text style={[styles.goalMiniName, { color: c.bg, fontFamily: MONO }]} numberOfLines={1}>
                          {g.name.toUpperCase()}
                        </Text>
                        <Text style={[styles.goalMiniPct, { color: c.bg, fontFamily: MONO }]}>
                          {pct.toFixed(0)}%
                        </Text>
                      </View>
                      <AnimBar pct={pct} color={c.bg} height={4} />
                    </View>
                  </View>
                );
              })}
              {goals.length > 3 && (
                <Text style={[styles.goalMiniMore, { color: 'rgba(20,22,27,0.45)', fontFamily: MONO }]}>
                  +{goals.length - 3} more
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Habits */}
        {habits.length === 0 ? (
          <Animated.View style={animStyle(habitAnims[0])}>
            <Text style={[styles.empty, { color: c.muted, fontFamily: MONO }]}>
              No habits yet{'\n'}Tap + to add your first one
            </Text>
          </Animated.View>
        ) : (
          habits.map((habit, idx) => (
            <Animated.View key={habit.id} style={animStyle(habitAnims[idx])}>
              <HabitCard
                habit={habit}
                log={getLogForDate(logs, habit.id, t)}
                streak={calculateStreak(habit, logs)}
                isFirst={idx === 0}
                isLast={idx === habits.length - 1}
                onSetCount={(count) => handleSetCount(habit.id, count)}
                onDelete={() => dispatch({ type: 'DELETE_HABIT', payload: habit.id })}
                onEdit={() => nav.navigate('AddHabit', { habitId: habit.id })}
                onMoveUp={() => dispatch({ type: 'REORDER_HABIT', payload: { from: idx, to: idx - 1 } })}
                onMoveDown={() => dispatch({ type: 'REORDER_HABIT', payload: { from: idx, to: idx + 1 } })}
                colors={c}
              />
            </Animated.View>
          ))
        )}

        {/* ─── TODAY'S ACTIONS ──────────────── */}
        <Animated.View style={[animStyle(noteAnim), { marginBottom: 4 }]}>
          <TouchableOpacity
            style={[styles.actionsCard, { backgroundColor: c.surface }]}
            onPress={() => setActionsExpanded((v) => !v)}
            activeOpacity={0.85}
          >
            <View style={styles.actionsHeader}>
              <Text style={[styles.actionsLabel, { color: c.muted, fontFamily: MONO }]}>today's actions</Text>
              <View style={styles.actionsRight}>
                <Text style={[styles.actionsDone, { color: c.accent, fontFamily: MONO }]}>
                  {todayChecked.length}/{TODAY_TASKS.length}
                </Text>
                <Text style={[styles.actionsChevron, { color: c.dim }]}>{actionsExpanded ? '▲' : '▼'}</Text>
              </View>
            </View>
            <View style={[styles.actionsTrack, { backgroundColor: c.surface2 }]}>
              <View style={[styles.actionsFill, { backgroundColor: c.accent, width: `${(todayChecked.length / TODAY_TASKS.length) * 100}%` as any }]} />
            </View>
          </TouchableOpacity>

          {actionsExpanded && (
            <View style={styles.actionsExpanded}>
              {TODAY_TASKS.map((task) => {
                const checked = todayChecked.includes(task.id);
                const pColor = task.priority === 'high' ? '#ef4444' : task.priority === 'med' ? '#f97316' : c.muted;
                const pBg = task.priority === 'high' ? 'rgba(239,68,68,0.12)' : task.priority === 'med' ? 'rgba(249,115,22,0.12)' : 'transparent';
                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.actionItem, { backgroundColor: c.surface, opacity: checked ? 0.4 : 1 }]}
                    onPress={() => dispatch({ type: 'PLAN_TODAY_TOGGLE', payload: { date: t, id: task.id } })}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.actionCheck, { borderColor: checked ? '#22c55e' : c.border, backgroundColor: checked ? '#22c55e' : 'transparent' }]}>
                      {checked && <Text style={styles.actionCheckmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      {!!task.label && (
                        <View style={[styles.actionBadge, { backgroundColor: pBg }]}>
                          <Text style={[styles.actionBadgeTxt, { color: pColor, fontFamily: MONO }]}>{task.label}</Text>
                        </View>
                      )}
                      <Text style={[styles.actionTitle, { color: c.text, fontFamily: MONO }]}>{task.title}</Text>
                      <Text style={[styles.actionDesc, { color: c.muted }]}>{task.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={[styles.goalsReminder, { backgroundColor: c.cream }]}>
                <Text style={[styles.goalsReminderLabel, { color: 'rgba(20,22,27,0.5)', fontFamily: MONO }]}>3 GOALS — READ EVERY MORNING</Text>
                <Text style={[styles.goalsReminderItem, { color: c.bg, fontFamily: MONO }]}>1. Apartment down payment (30M₮)</Text>
                <Text style={[styles.goalsReminderItem, { color: c.bg, fontFamily: MONO }]}>2. 3 retainer clients signed</Text>
                <Text style={[styles.goalsReminderItem, { color: c.bg, fontFamily: MONO }]}>3. Demo trading profitable</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ─── TODAY'S NOTE ─────────────────── */}
        <Animated.View style={animStyle(noteAnim)}>
          <View style={[styles.noteCard, { backgroundColor: c.surface }]}>
            <View style={styles.noteHeader}>
              <TouchableOpacity style={styles.noteTouchRow} onPress={noteExpanded ? saveNote : openNote}>
                <Text style={[styles.noteLabel, { color: c.muted, fontFamily: MONO }]}>today's note</Text>
                {!noteExpanded && (
                  noteText
                    ? <Text style={[styles.notePreview, { color: c.text, fontFamily: MONO }]} numberOfLines={1}>{noteText}</Text>
                    : <Text style={[styles.notePlaceholder, { color: c.dim, fontFamily: MONO }]}>tap to write...</Text>
                )}
                {noteExpanded && <Text style={[styles.noteSaveInline, { color: c.accent, fontFamily: MONO }]}>save</Text>}
              </TouchableOpacity>
              {!noteExpanded && pastNotes.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowArchive((v) => !v)}
                  style={[styles.allNotesPill, { backgroundColor: c.surface2 }]}
                >
                  <Text style={[styles.allNotesTxt, { color: c.muted, fontFamily: MONO }]}>
                    all ({pastNotes.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {noteExpanded && (
              <TextInput
                style={[styles.noteInput, { backgroundColor: c.inputBg, color: c.text, fontFamily: MONO }]}
                value={draftNote}
                onChangeText={setDraftNote}
                placeholder="what's on your mind today?"
                placeholderTextColor={c.dim}
                multiline
                autoFocus
              />
            )}
          </View>

          {/* ─── NOTES ARCHIVE ────────────────── */}
          {pastNotes.length > 0 && showArchive && (
            <View style={[styles.noteCard, { backgroundColor: c.surface }]}>
              <TouchableOpacity style={styles.archiveToggle} onPress={() => setShowArchive(false)}>
                <Text style={[styles.noteLabel, { color: c.muted, fontFamily: MONO }]}>all notes</Text>
                <Text style={[styles.archiveCount, { color: c.dim, fontFamily: MONO }]}>
                  {pastNotes.length} · close ↑
                </Text>
              </TouchableOpacity>
              {pastNotes.map(([date, text]) => (
                <View key={date} style={[styles.archiveEntry, { borderTopColor: c.border }]}>
                  <Text style={[styles.archiveDate, { color: c.accent, fontFamily: MONO }]}>{friendlyDateShort(date)}</Text>
                  <Text style={[styles.archiveText, { color: c.text, fontFamily: MONO }]}>{text}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: c.accent }]} onPress={() => nav.navigate('AddHabit')}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>

      {celebration && (
        <CelebrationOverlay
          type={celebration.type}
          streak={celebration.streak}
          habitName={celebration.habitName}
          onDone={() => setCelebration(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 2 },
  appTitle: { fontSize: 36, fontWeight: '900', letterSpacing: 3 },
  headerRight: { alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4 },
  wakeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  wakeChipTxt: { fontSize: 11, letterSpacing: 1 },
  wakeLogTxt: { fontSize: 10, letterSpacing: 2 },

  progressRow: {
    paddingHorizontal: 16, paddingBottom: 10,
    flexDirection: 'row', gap: 10,
  },
  progressCard: {
    flex: 1, borderRadius: 24, padding: 16,
  },
  progressSmall: { fontSize: 9, letterSpacing: 3, marginBottom: 4 },
  progressNums: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  progressDone: { fontSize: 48, fontWeight: '200', lineHeight: 52 },
  progressSep: { fontSize: 32, fontWeight: '100', marginHorizontal: 2 },
  progressTotal: { fontSize: 48, fontWeight: '200', lineHeight: 52 },
  financeCard: {
    flex: 1, borderRadius: 24, padding: 16,
  },
  financeLabel: { fontSize: 9, letterSpacing: 3, marginBottom: 4 },
  financeAmt: { fontSize: 22, letterSpacing: -0.5, marginBottom: 8 },
  financeTrack: { height: 4, borderRadius: 3, overflow: 'hidden', position: 'relative', marginBottom: 6 },
  financePct: { fontSize: 9, letterSpacing: 2 },

  challengeBanner: { marginHorizontal: 16, marginBottom: 10, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  challengeBannerTxt: { fontSize: 11, letterSpacing: 2 },
  challengeCta: { marginHorizontal: 16, marginBottom: 10, fontSize: 10, letterSpacing: 2 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  empty: { textAlign: 'center', marginTop: 80, fontSize: 12, lineHeight: 26, letterSpacing: 2 },

  goalsCard: { borderRadius: 28, padding: 18, marginBottom: 10 },
  goalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalCardLabel: { fontSize: 9, letterSpacing: 3 },
  goalCardArrow: { fontSize: 9, letterSpacing: 2 },
  goalMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  goalMiniEmoji: { fontSize: 20, width: 24, textAlign: 'center' },
  goalMiniContent: { flex: 1 },
  goalMiniTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  goalMiniName: { flex: 1, fontSize: 10, letterSpacing: 2 },
  goalMiniPct: { fontSize: 11, marginLeft: 8 },
  goalMiniMore: { fontSize: 9, letterSpacing: 2, textAlign: 'center', marginTop: 2 },

  actionsCard: { borderRadius: 28, padding: 18, marginBottom: 6 },
  actionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  actionsLabel: { fontSize: 9, letterSpacing: 3 },
  actionsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionsDone: { fontSize: 12, letterSpacing: 1 },
  actionsChevron: { fontSize: 9 },
  actionsTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  actionsFill: { height: '100%', borderRadius: 2 },
  actionsExpanded: { gap: 6, marginBottom: 4 },
  actionItem: { borderRadius: 20, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  actionCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  actionCheckmark: { color: '#fff', fontSize: 11, fontWeight: '800' },
  actionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 4 },
  actionBadgeTxt: { fontSize: 9, letterSpacing: 1 },
  actionTitle: { fontSize: 12, letterSpacing: 0.5, marginBottom: 3 },
  actionDesc: { fontSize: 11, lineHeight: 17, letterSpacing: 0.2 },
  goalsReminder: { borderRadius: 20, padding: 16, marginTop: 2 },
  goalsReminderLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  goalsReminderItem: { fontSize: 13, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },

  noteCard: { borderRadius: 28, padding: 18, marginBottom: 10, marginTop: 4 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteTouchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteLabel: { fontSize: 9, letterSpacing: 3 },
  notePreview: { flex: 1, fontSize: 12, letterSpacing: 0.5 },
  notePlaceholder: { flex: 1, fontSize: 11, letterSpacing: 1 },
  noteSaveInline: { fontSize: 10, letterSpacing: 2 },
  noteInput: {
    borderRadius: 16, padding: 14,
    fontSize: 13, minHeight: 90, marginTop: 12,
    textAlignVertical: 'top', letterSpacing: 0.3,
  },
  allNotesPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  allNotesTxt: { fontSize: 9, letterSpacing: 2 },
  archiveToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  archiveCount: { fontSize: 10, letterSpacing: 1 },
  archiveEntry: { borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
  archiveDate: { fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  archiveText: { fontSize: 12, lineHeight: 20, letterSpacing: 0.3 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4D26', shadowOpacity: 0.5, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabTxt: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' },
});
