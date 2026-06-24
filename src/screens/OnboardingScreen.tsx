import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAppStore } from '../store/AppContext';
import { Habit, Challenge } from '../types';
import { HABIT_COLORS, EMOJIS } from '../theme';
import { requestPermissions, scheduleDailyReminders, setupHandler } from '../utils/notifications';
import { today } from '../utils/dateUtils';

const SUGGESTED = [
  { name: 'Morning run', emoji: '🏃', color: '#EE3333' },
  { name: 'Read 20 pages', emoji: '📚', color: '#EE3333' },
  { name: 'Meditate', emoji: '🧘', color: '#EE3333' },
  { name: 'Drink 2L water', emoji: '💧', color: '#EE3333' },
  { name: 'No sugar', emoji: '🍎', color: '#EE3333' },
];

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function OnboardingScreen() {
  const { dispatch } = useAppStore();
  const [step, setStep] = useState(0);

  useEffect(() => { setupHandler(); }, []);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [challengeHabits, setChallengeHabits] = useState<string[]>([]);

  function toggleSuggested(name: string, emoji: string, color: string) {
    const existing = habits.find((h) => h.name === name);
    if (existing) {
      setHabits(habits.filter((h) => h.name !== name));
      setSelected(selected.filter((s) => s !== name));
    } else {
      const h: Habit = { id: makeId(), name, emoji, color, type: 'binary', volumeGoal: 1, createdAt: today() };
      setHabits([...habits, h]);
      setSelected([...selected, name]);
    }
  }

  function addCustom() {
    const name = custom.trim();
    if (!name || habits.find((h) => h.name === name)) return;
    const idx = habits.length % HABIT_COLORS.length;
    const h: Habit = {
      id: makeId(), name,
      emoji: EMOJIS[habits.length % EMOJIS.length],
      color: HABIT_COLORS[idx],
      type: 'binary', volumeGoal: 1, createdAt: today(),
    };
    setHabits([...habits, h]);
    setCustom('');
  }

  function finishHabits() {
    if (habits.length === 0) return;
    setStep(2);
    setChallengeHabits(habits.slice(0, 3).map((h) => h.id));
  }

  function toggleChallengeHabit(id: string) {
    if (challengeHabits.includes(id)) {
      setChallengeHabits(challengeHabits.filter((x) => x !== id));
    } else {
      setChallengeHabits([...challengeHabits, id]);
    }
  }

  async function finish(enableNotifs: boolean) {
    habits.forEach((h) => dispatch({ type: 'ADD_HABIT', payload: h }));

    if (challengeHabits.length > 0) {
      const challenge: Challenge = {
        id: makeId(),
        name: '3-Day Kickstart',
        durationDays: 3,
        startDate: today(),
        habitIds: challengeHabits,
        rewarded: false,
      };
      dispatch({ type: 'SET_CHALLENGE', payload: challenge });
    }

    if (enableNotifs) {
      const granted = await requestPermissions();
      if (granted) await scheduleDailyReminders();
    }

    dispatch({ type: 'ONBOARD' });
  }

  // Step 0: Welcome
  if (step === 0) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.logo}>HABITS.</Text>
        <Text style={styles.tagline}>build better days.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => { dispatch({ type: 'ONBOARD' }); setStep(0.5 as any); }}>
          <Text style={styles.btnTxt}>GET STARTED →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 0.5: How it works
  if ((step as any) === 0.5) {
    const HOW_IT_WORKS = [
      { title: 'Create habits', desc: 'Once-a-day or volume-based (e.g. drink water 4×)' },
      { title: 'Track daily', desc: 'One tap to check off. Streaks build automatically.' },
      { title: 'Hit milestones', desc: 'Complete kickstart challenges and earn rewards.' },
      { title: 'Stay reminded', desc: 'Push notifications nudge you at the right time.' },
    ];
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.stepTitle}>HOW IT WORKS</Text>
        <Text style={styles.stepSub}>Everything you need to build lasting habits</Text>
        <View style={{ alignSelf: 'stretch', gap: 12, marginBottom: 32 }}>
          {HOW_IT_WORKS.map((item, idx) => (
            <View key={idx} style={styles.howRow}>
              <Text style={styles.howDot}>·</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.howTitle}>{item.title.toUpperCase()}</Text>
                <Text style={styles.howDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.btn, { alignSelf: 'stretch' }]} onPress={() => setStep(1)}>
          <Text style={styles.btnTxt}>BUILD HABITS →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 1: Pick habits
  if (step === 1) {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepTitle}>PICK YOUR HABITS</Text>
          <Text style={styles.stepSub}>Select from suggestions or add your own</Text>

          {SUGGESTED.map((s) => {
            const on = selected.includes(s.name);
            return (
              <TouchableOpacity
                key={s.name}
                style={[styles.suggRow, on && styles.suggRowOn]}
                onPress={() => toggleSuggested(s.name, s.emoji, s.color)}
              >
                <Text style={styles.suggEmoji}>{s.emoji}</Text>
                <Text style={styles.suggName}>{s.name}</Text>
                {on && <Text style={styles.checkBadge}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Add custom habit..."
              placeholderTextColor="#555555"
              value={custom}
              onChangeText={setCustom}
              onSubmitEditing={addCustom}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
              <Text style={styles.addBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>

          {custom.length === 0 && habits.length > 0 && (
            <TouchableOpacity style={[styles.btn, { marginTop: 8 }]} onPress={finishHabits}>
              <Text style={styles.btnTxt}>NEXT →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Step 2: Challenge
  if (step === 2) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.stepTitle}>3-DAY CHALLENGE 🏆</Text>
        <Text style={styles.stepSub}>
          Choose up to 3 habits to focus on this week. Complete them every day for 3 days to earn your first reward.
        </Text>

        {habits.map((h) => {
          const on = challengeHabits.includes(h.id);
          return (
            <TouchableOpacity
              key={h.id}
              style={[styles.suggRow, on && styles.suggRowOn]}
              onPress={() => toggleChallengeHabit(h.id)}
            >
              <Text style={styles.suggEmoji}>{h.emoji}</Text>
              <Text style={styles.suggName}>{h.name}</Text>
              {on && <Text style={styles.checkBadge}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={() => setStep(3)}>
          <Text style={styles.btnTxt}>{challengeHabits.length > 0 ? "I'M IN →" : 'SKIP →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 3: Notifications
  return (
    <View style={[styles.root, styles.center]}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>🔔</Text>
      <Text style={styles.stepTitle}>STAY ON TRACK</Text>
      <Text style={[styles.stepSub, { textAlign: 'center' }]}>
        Get gentle daily reminders so you never miss a habit.
      </Text>
      <TouchableOpacity style={[styles.btn, { marginTop: 24 }]} onPress={() => finish(true)}>
        <Text style={styles.btnTxt}>ENABLE REMINDERS</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => finish(false)} style={{ marginTop: 16 }}>
        <Text style={styles.skipTxt}>MAYBE LATER</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C0C' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { padding: 24, paddingBottom: 48 },
  logo: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 6,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 48,
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 3,
  },
  stepSub: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  suggRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  suggRowOn: {
    borderColor: '#EE3333',
    backgroundColor: '#2A0808',
  },
  suggEmoji: { fontSize: 22 },
  suggName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  checkBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EE3333',
  },
  addRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 16 },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EE3333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnTxt: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '400' },
  btn: {
    backgroundColor: '#EE3333',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  btnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  skipTxt: {
    color: '#555555',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  howDot: {
    fontSize: 22,
    color: '#EE3333',
    fontWeight: '800',
    lineHeight: 22,
    marginTop: -1,
  },
  howTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  howDesc: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
    lineHeight: 18,
  },
});
