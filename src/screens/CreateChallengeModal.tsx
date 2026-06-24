import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/AppContext';
import { Challenge } from '../types';
import { today } from '../utils/dateUtils';
import { lightTap } from '../utils/haptics';
import { getColors } from '../utils/theme';

import { MONO } from '../utils/fonts';
const DURATIONS = [3, 7, 14, 21, 30];

function makeId() { return Math.random().toString(36).slice(2); }

export default function CreateChallengeModal() {
  const nav = useNavigation();
  const { state, dispatch } = useAppStore();
  const c = getColors(state.isDark);
  const { habits } = state;

  const [name, setName] = useState('');
  const [duration, setDuration] = useState(7);
  const [selected, setSelected] = useState<string[]>([]);

  function toggleHabit(id: string) {
    lightTap();
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function create() {
    const n = name.trim() || `${duration}-Day Challenge`;
    if (selected.length === 0) return;
    const challenge: Challenge = {
      id: makeId(), name: n, durationDays: duration,
      startDate: today(), habitIds: selected, rewarded: false,
    };
    dispatch({ type: 'SET_CHALLENGE', payload: challenge });
    nav.goBack();
  }

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: c.text, fontFamily: MONO }]}>CREATE CHALLENGE</Text>

        <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>NAME (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
          placeholder="e.g. 30-Day Fitness"
          placeholderTextColor={c.dim}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>DURATION</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationBtn, { backgroundColor: c.inputBg, borderColor: c.border }, duration === d && { backgroundColor: c.accentBg, borderColor: c.accent }]}
              onPress={() => { setDuration(d); lightTap(); }}
            >
              <Text style={[styles.durationTxt, { color: duration === d ? c.accent : c.muted, fontFamily: MONO }]}>{d}D</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>HABITS TO INCLUDE</Text>
        {habits.length === 0 ? (
          <Text style={[styles.empty, { color: c.dim, fontFamily: MONO }]}>Add some habits first.</Text>
        ) : (
          habits.map((h) => {
            const on = selected.includes(h.id);
            return (
              <TouchableOpacity
                key={h.id}
                style={[styles.habitRow, { backgroundColor: c.inputBg, borderColor: c.border }, on && { backgroundColor: c.accentBg, borderColor: c.accent }]}
                onPress={() => toggleHabit(h.id)}
              >
                <Text style={styles.habitEmoji}>{h.emoji}</Text>
                <Text style={[styles.habitName, { color: c.text, fontFamily: MONO }]}>{h.name.toUpperCase()}</Text>
                {on && <Text style={[styles.check, { color: c.accent }]}>✓</Text>}
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.accent }, selected.length === 0 && { opacity: 0.4 }]}
          onPress={create}
          disabled={selected.length === 0}
        >
          <Text style={[styles.saveTxt, { fontFamily: MONO }]}>START CHALLENGE 🏆</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancel} onPress={() => nav.goBack()}>
          <Text style={[styles.cancelTxt, { color: c.muted, fontFamily: MONO }]}>CANCEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  content: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 20, fontWeight: '800', marginBottom: 20, letterSpacing: 2 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 18 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  durationTxt: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  habitRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: 14, marginBottom: 8, gap: 12, borderWidth: 1,
  },
  habitEmoji: { fontSize: 20 },
  habitName: { flex: 1, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  check: { fontSize: 16, fontWeight: '700' },
  empty: { fontSize: 12, marginBottom: 8, letterSpacing: 0.5 },
  saveBtn: { marginTop: 24, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  cancel: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  cancelTxt: { fontSize: 12, letterSpacing: 1 },
});
