import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, calculateStreak } from '../store/AppContext';
import { Habit } from '../types';
import { scheduleHabitReminder, cancelHabitReminder } from '../utils/notifications';
import { lightTap } from '../utils/haptics';
import { getColors } from '../utils/theme';
import { MONO, NUMS } from '../utils/fonts';
import { SCHEDULE, MONTHLY, YEARLY } from '../data/plannerData';

function friendlyDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ManageScreen() {
  const nav = useNavigation<any>();
  const { state, dispatch } = useAppStore();
  const { habits, logs, challenge, isDark, notes } = state;
  const c = getColors(isDark);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  const sortedNotes = Object.entries(notes)
    .filter(([, text]) => text.trim())
    .sort(([a], [b]) => b.localeCompare(a));

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: c.muted, fontFamily: MONO }]}>settings</Text>
        <Text style={[styles.title, { color: c.text }]}>MANAGE</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ─── APPEARANCE ─────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: MONO }]}>APPEARANCE</Text>
        <View style={[styles.row, { backgroundColor: c.surface }]}>
          <View>
            <Text style={[styles.rowLabel, { color: c.text, fontFamily: MONO }]}>
              {isDark ? '● DARK MODE' : '○ LIGHT MODE'}
            </Text>
            <Text style={[styles.rowSub, { color: c.muted, fontFamily: MONO }]}>
              {isDark ? 'Deep dark theme' : 'Clean light theme'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={() => dispatch({ type: 'TOGGLE_THEME' })}
            trackColor={{ false: c.border, true: c.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ─── CHALLENGE ──────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: MONO }]}>CHALLENGE</Text>
        {challenge ? (
          <View style={[styles.challengeCard, { backgroundColor: c.surface }]}>
            <View style={styles.challengeInfo}>
              <Text style={[styles.challengeName, { color: c.text, fontFamily: MONO }]}>🏆 {challenge.name.toUpperCase()}</Text>
              <Text style={[styles.challengeSub, { color: c.muted, fontFamily: MONO }]}>
                {challenge.durationDays} DAYS · STARTED {challenge.startDate}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.endBtn, { backgroundColor: c.accentBg }]}
              onPress={() => dispatch({ type: 'CLEAR_CHALLENGE' })}
            >
              <Text style={[styles.endBtnTxt, { color: c.accent, fontFamily: MONO }]}>END</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: c.accentBg }]}
            onPress={() => nav.navigate('CreateChallenge')}
          >
            <Text style={[styles.createBtnTxt, { color: c.accent, fontFamily: MONO }]}>+ CREATE CHALLENGE</Text>
          </TouchableOpacity>
        )}

        {/* ─── HABITS ─────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: MONO }]}>HABITS ({habits.length})</Text>
        {habits.length === 0 ? (
          <Text style={[styles.empty, { color: c.dim, fontFamily: MONO }]}>No habits yet. Tap + on Today screen.</Text>
        ) : (
          habits.map((habit) => (
            <HabitManageRow
              key={habit.id}
              habit={habit}
              streak={calculateStreak(habit, logs)}
              colors={c}
              onEdit={() => nav.navigate('AddHabit', { habitId: habit.id })}
              onDelete={() => dispatch({ type: 'DELETE_HABIT', payload: habit.id })}
              onReminderChange={(time) => {
                const updated = { ...habit, reminderTime: time || undefined };
                dispatch({ type: 'EDIT_HABIT', payload: updated });
                if (time) scheduleHabitReminder(habit.id, habit.name, time);
                else cancelHabitReminder(habit.id);
              }}
            />
          ))
        )}

        {/* ─── SCHEDULE ───────────────────────── */}
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setScheduleOpen((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: MONO, marginBottom: 0, marginTop: 0 }]}>SCHEDULE</Text>
          <Text style={[styles.collapsibleChev, { color: c.dim }]}>{scheduleOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {scheduleOpen && (
          <View style={styles.collapsibleBody}>
            {SCHEDULE.map((sec) => (
              <View key={sec.section}>
                <Text style={[styles.scheduleSection, { color: c.muted, borderBottomColor: c.border, fontFamily: MONO }]}>{sec.section}</Text>
                {sec.slots.map((slot, i) => (
                  <View key={i} style={[styles.slotCard, { backgroundColor: c.surface }]}>
                    <Text style={[styles.slotTime, { color: c.dim, fontFamily: MONO }]}>{slot.time}</Text>
                    <View style={[styles.slotBar, { backgroundColor: slot.color }]} />
                    <View style={styles.slotBody}>
                      <Text style={[styles.slotTitle, { color: c.text, fontFamily: MONO }]}>{slot.title}</Text>
                      <Text style={[styles.slotDetail, { color: c.muted, fontFamily: MONO }]}>{slot.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ─── ROADMAP ────────────────────────── */}
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setRoadmapOpen((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: MONO, marginBottom: 0, marginTop: 0 }]}>ROADMAP</Text>
          <Text style={[styles.collapsibleChev, { color: c.dim }]}>{roadmapOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {roadmapOpen && (
          <View style={styles.collapsibleBody}>
            <Text style={[styles.roadmapGroupLabel, { color: c.muted, fontFamily: MONO }]}>MONTHLY</Text>
            {MONTHLY.map((m) => (
              <View key={m.label} style={[styles.monthCard, { borderColor: c.border }]}>
                <View style={[styles.monthHead, { backgroundColor: m.color }]}>
                  <Text style={[styles.monthHeadTitle, { fontFamily: MONO }]}>{m.label}</Text>
                  <Text style={[styles.monthHeadTarget, { fontFamily: MONO }]}>{m.target}</Text>
                </View>
                <View style={[styles.monthBody, { backgroundColor: c.surface }]}>
                  {m.items.map((item, i) => (
                    <View key={i} style={styles.monthItemRow}>
                      <Text style={{ color: '#22c55e', fontSize: 11 }}>→</Text>
                      <Text style={[styles.monthItemTxt, { color: c.text, fontFamily: MONO }]}>{item}</Text>
                    </View>
                  ))}
                  <View style={[styles.failRow, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                    <Text style={[styles.failTxt, { color: '#f87171', fontFamily: MONO }]}>✗  FAIL: {m.fail}</Text>
                  </View>
                </View>
              </View>
            ))}

            <Text style={[styles.roadmapGroupLabel, { color: c.muted, fontFamily: MONO, marginTop: 12 }]}>YEARLY</Text>
            {YEARLY.map((y) => (
              <View key={y.year} style={[styles.yearCard, { backgroundColor: c.surface, borderLeftColor: y.color }]}>
                <Text style={[styles.yearTitle, { color: c.text, fontFamily: MONO }]}>{y.year}</Text>
                <Text style={[styles.yearSub, { color: c.muted, fontFamily: MONO }]}>{y.sub}</Text>
                {y.items.map((item, i) => (
                  <View key={i} style={styles.yearItemRow}>
                    <Text style={{ color: c.dim, fontSize: 10 }}>▸</Text>
                    <Text style={[styles.yearItemTxt, { color: c.text, fontFamily: MONO }]}>{item}</Text>
                  </View>
                ))}
                <View style={[styles.milestone, { backgroundColor: y.milestoneBg }]}>
                  <Text style={[styles.milestoneTxt, { color: y.milestoneColor, fontFamily: MONO }]}>{y.milestone}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── DAILY NOTES ────────────────────── */}
        <View style={styles.notesSectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: MONO, marginBottom: 0 }]}>
            DAILY NOTES
          </Text>
          {sortedNotes.length > 0 && (
            <View style={[styles.noteCountBadge, { backgroundColor: c.accent }]}>
              <Text style={[styles.noteCountTxt, { fontFamily: NUMS }]}>{sortedNotes.length}</Text>
            </View>
          )}
        </View>

        {sortedNotes.length === 0 ? (
          <Text style={[styles.empty, { color: c.dim, fontFamily: MONO }]}>
            No notes yet. Write notes from the Today tab.
          </Text>
        ) : (
          sortedNotes.map(([date, text]) => {
            const isExpanded = expandedNote === date;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.noteCard, { backgroundColor: c.surface }]}
                onPress={() => setExpandedNote(isExpanded ? null : date)}
                activeOpacity={0.8}
              >
                <View style={[styles.noteCardAccent, { backgroundColor: c.accent }]} />
                <View style={styles.noteCardContent}>
                  <View style={styles.noteCardHeader}>
                    <Text style={[styles.noteCardDate, { color: c.accent, fontFamily: MONO }]}>
                      {friendlyDateLong(date).toUpperCase()}
                    </Text>
                    <Text style={[styles.noteToggle, { color: c.dim }]}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                  <Text
                    style={[styles.noteCardText, { color: c.text, fontFamily: MONO }]}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {text}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

function HabitManageRow({
  habit, streak, colors: c, onEdit, onDelete, onReminderChange,
}: {
  habit: Habit;
  streak: number;
  colors: ReturnType<typeof getColors>;
  onEdit: () => void;
  onDelete: () => void;
  onReminderChange: (time: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [time, setTime] = useState(habit.reminderTime ?? '');

  function saveReminder() {
    const trimmed = time.trim();
    if (trimmed && !/^\d{1,2}:\d{2}$/.test(trimmed)) return;
    onReminderChange(trimmed);
    lightTap();
  }

  return (
    <View style={[styles.habitCard, { backgroundColor: c.surface }]}>
      <TouchableOpacity style={styles.habitRow} onPress={() => setExpanded(!expanded)}>
        <View style={[styles.habitAccentBar, { backgroundColor: c.accent }]} />
        <Text style={styles.habitEmoji}>{habit.emoji}</Text>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, { color: c.text, fontFamily: MONO }]}>{habit.name}</Text>
          <Text style={[styles.habitSub, { color: c.muted, fontFamily: MONO }]}>
            {habit.type === 'volume' ? `×${habit.volumeGoal} per day` : 'Once per day'}
            {streak > 0 ? `  ·  ${streak} day streak` : ''}
          </Text>
        </View>
        <Text style={[styles.expandIcon, { color: c.dim }]}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expandedSection, { borderTopColor: c.border }]}>
          <View style={styles.reminderRow}>
            <Text style={[styles.reminderLabel, { color: c.muted, fontFamily: MONO }]}>DAILY REMINDER</Text>
            <TextInput
              style={[styles.timeInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
              placeholder="HH:MM"
              placeholderTextColor={c.dim}
              value={time}
              onChangeText={setTime}
              onBlur={saveReminder}
              onSubmitEditing={saveReminder}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          {habit.reminderTime ? (
            <Text style={[styles.reminderSet, { color: c.accent, fontFamily: MONO }]}>
              ⏰ Reminder set for {habit.reminderTime}
            </Text>
          ) : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: c.surface2 }]} onPress={onEdit}>
              <Text style={[styles.editBtnTxt, { color: c.text, fontFamily: MONO }]}>EDIT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: c.accentBg }]} onPress={onDelete}>
              <Text style={[styles.deleteBtnTxt, { color: c.accent, fontFamily: MONO }]}>DELETE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 },
  headerLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 2 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: { fontSize: 9, letterSpacing: 3, marginBottom: 10, marginTop: 20 },

  row: {
    borderRadius: 24, padding: 18, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 13, letterSpacing: 1 },
  rowSub: { fontSize: 10, marginTop: 3, letterSpacing: 1 },

  challengeCard: {
    borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  challengeInfo: { flex: 1 },
  challengeName: { fontSize: 12, letterSpacing: 1 },
  challengeSub: { fontSize: 10, marginTop: 4, letterSpacing: 1 },
  endBtn: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  endBtnTxt: { fontSize: 10, letterSpacing: 2 },
  createBtn: {
    borderRadius: 24, paddingVertical: 18, alignItems: 'center', marginBottom: 12,
  },
  createBtnTxt: { fontSize: 11, letterSpacing: 2 },
  empty: { fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 12, letterSpacing: 2, lineHeight: 20 },

  habitCard: { borderRadius: 24, marginBottom: 8, overflow: 'hidden' },
  habitRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  habitAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  habitEmoji: { fontSize: 22, marginLeft: 8 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 12, letterSpacing: 1.5 },
  habitSub: { fontSize: 9, marginTop: 4, letterSpacing: 1.5 },
  expandIcon: { fontSize: 10 },
  expandedSection: { borderTopWidth: 1, padding: 16, gap: 12 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderLabel: { fontSize: 10, letterSpacing: 2 },
  timeInput: {
    width: 80, height: 36, borderRadius: 12,
    paddingHorizontal: 10, fontSize: 14, borderWidth: 1, textAlign: 'center',
  },
  reminderSet: { fontSize: 10, letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  editBtnTxt: { fontSize: 10, letterSpacing: 2 },
  deleteBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  deleteBtnTxt: { fontSize: 10, letterSpacing: 2 },

  collapsibleHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, marginBottom: 8, paddingVertical: 4,
  },
  collapsibleChev: { fontSize: 10 },
  collapsibleBody: { marginBottom: 8 },

  scheduleSection: { fontSize: 9, letterSpacing: 3, marginTop: 12, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1 },
  slotCard: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  slotTime: { fontSize: 9, width: 44, flexShrink: 0, paddingTop: 11, paddingLeft: 8, paddingRight: 4, letterSpacing: 0.5 },
  slotBar: { width: 3, flexShrink: 0 },
  slotBody: { flex: 1, padding: 10 },
  slotTitle: { fontSize: 12, letterSpacing: 0.5, marginBottom: 2 },
  slotDetail: { fontSize: 11, lineHeight: 16, letterSpacing: 0.2 },

  roadmapGroupLabel: { fontSize: 9, letterSpacing: 3, marginBottom: 8 },
  monthCard: { marginBottom: 8, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  monthHead: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthHeadTitle: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  monthHeadTarget: { fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  monthBody: { padding: 12 },
  monthItemRow: { flexDirection: 'row', gap: 8, marginBottom: 5, alignItems: 'flex-start' },
  monthItemTxt: { flex: 1, fontSize: 11, lineHeight: 17, letterSpacing: 0.3 },
  failRow: { marginTop: 8, padding: 8, borderRadius: 8, borderWidth: 1 },
  failTxt: { fontSize: 10, letterSpacing: 0.3 },

  yearCard: { borderRadius: 14, padding: 14, marginBottom: 8, borderLeftWidth: 4 },
  yearTitle: { fontSize: 12, letterSpacing: 1.5, marginBottom: 3 },
  yearSub: { fontSize: 10, letterSpacing: 0.5, marginBottom: 10 },
  yearItemRow: { flexDirection: 'row', gap: 8, marginBottom: 5, alignItems: 'flex-start' },
  yearItemTxt: { flex: 1, fontSize: 11, lineHeight: 17, letterSpacing: 0.3 },
  milestone: { marginTop: 10, padding: 8, borderRadius: 8 },
  milestoneTxt: { fontSize: 11, letterSpacing: 0.5, lineHeight: 17 },

  notesSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  noteCountBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: 'center' },
  noteCountTxt: { color: '#FFF', fontSize: 12, fontWeight: '200' },
  noteCard: {
    borderRadius: 24, marginBottom: 8, overflow: 'hidden',
    flexDirection: 'row',
  },
  noteCardAccent: { width: 4 },
  noteCardContent: { flex: 1, padding: 16 },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteCardDate: { fontSize: 9, letterSpacing: 2 },
  noteToggle: { fontSize: 9 },
  noteCardText: { fontSize: 12, lineHeight: 20, letterSpacing: 0.3 },
});
