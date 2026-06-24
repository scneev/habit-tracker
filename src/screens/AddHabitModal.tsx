import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/AppContext';
import { Habit, HabitType } from '../types';
import { HABIT_COLORS, EMOJIS } from '../theme';
import { today } from '../utils/dateUtils';
import { lightTap } from '../utils/haptics';
import { getColors } from '../utils/theme';

import { MONO } from '../utils/fonts';

const EXTRA_COLORS = [
  '#EE3333', '#FF6B35', '#FF9F1C', '#2EC4B6', '#3D9BE9',
  '#845EC2', '#D65DB1', '#FF6F91', '#1A936F', '#4ECDC4',
  '#F7B731', '#20BF6B', '#0FB9B1', '#4B7BEC', '#A55EEA',
  '#FC5C65', '#FD9644', '#26DE81', '#2BCBBA', '#45AAF2',
];

function makeId() { return Math.random().toString(36).slice(2); }

function isValidHex(s: string) { return /^#[0-9A-Fa-f]{6}$/.test(s); }

export default function AddHabitModal() {
  const nav = useNavigation();
  const route = useRoute<any>();
  const { state, dispatch } = useAppStore();
  const c = getColors(state.isDark);

  const editingId: string | undefined = route.params?.habitId;
  const existing = editingId ? state.habits.find((h) => h.id === editingId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? EMOJIS[0]);
  const [color, setColor] = useState(existing?.color ?? EXTRA_COLORS[0]);
  const [type, setType] = useState<HabitType>(existing?.type ?? 'binary');
  const [goal, setGoal] = useState(String(existing?.volumeGoal ?? 3));
  const [customColor, setCustomColor] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');

  function save() {
    const n = name.trim();
    if (!n) return;
    const finalColor = isValidHex(customColor) ? customColor : color;
    const finalEmoji = customEmoji.trim() || emoji;
    const habit: Habit = {
      id: existing?.id ?? makeId(),
      name: n,
      emoji: finalEmoji,
      color: finalColor,
      type,
      volumeGoal: type === 'binary' ? 1 : Math.max(1, parseInt(goal) || 3),
      createdAt: existing?.createdAt ?? today(),
      reminderTime: existing?.reminderTime,
    };
    if (existing) {
      dispatch({ type: 'EDIT_HABIT', payload: habit });
    } else {
      dispatch({ type: 'ADD_HABIT', payload: habit });
    }
    nav.goBack();
  }

  const s = {
    root: [styles.root, { backgroundColor: c.surface }],
    handle: [styles.handle, { backgroundColor: c.border }],
    heading: [styles.heading, { color: c.text, fontFamily: MONO }],
    label: [styles.label, { color: c.muted, fontFamily: MONO }],
    input: [styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }],
    typeBtn: (on: boolean) => [styles.typeBtn, { backgroundColor: on ? c.accentBg : c.inputBg, borderColor: on ? c.accent : c.border }],
    typeBtnTxt: (on: boolean) => [styles.typeBtnTxt, { color: on ? c.accent : c.muted, fontFamily: MONO }],
    emojiBtn: (on: boolean) => [styles.emojiBtn, { backgroundColor: on ? c.accentBg : c.inputBg, borderColor: on ? c.accent : c.border, borderWidth: on ? 2 : 1 }],
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.handle} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={s.heading}>{existing ? 'EDIT HABIT' : 'NEW HABIT'}</Text>

        {/* Name */}
        <Text style={s.label}>NAME</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Morning run"
          placeholderTextColor={c.dim}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        {/* Type */}
        <Text style={s.label}>TYPE</Text>
        <View style={styles.typeRow}>
          {(['binary', 'volume'] as HabitType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={s.typeBtn(type === t)}
              onPress={() => { setType(t); lightTap(); }}
            >
              <Text style={s.typeBtnTxt(type === t)}>
                {t === 'binary' ? '✓  ONCE A DAY' : '↑  VOLUME GOAL'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'volume' && (
          <>
            <Text style={s.label}>DAILY TARGET (TIMES)</Text>
            <TextInput
              style={[s.input, { width: 100, fontFamily: MONO }]}
              keyboardType="number-pad"
              value={goal}
              onChangeText={setGoal}
              placeholderTextColor={c.dim}
            />
          </>
        )}

        {/* Icon */}
        <Text style={s.label}>ICON</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              style={s.emojiBtn(emoji === e && !customEmoji)}
              onPress={() => { setEmoji(e); setCustomEmoji(''); lightTap(); }}
            >
              <Text style={styles.emojiTxt}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.orLabel, { color: c.dim, fontFamily: MONO }]}>or paste any emoji:</Text>
        <TextInput
          style={[s.input, { marginTop: 4, fontSize: 22, height: 52, textAlign: 'left' }]}
          placeholder="✏️"
          placeholderTextColor={c.dim}
          value={customEmoji}
          onChangeText={(v) => setCustomEmoji(v.trim().slice(0, 2))}
          maxLength={2}
        />

        {/* Color */}
        <Text style={s.label}>COLOR</Text>
        <View style={styles.colorRow}>
          {EXTRA_COLORS.map((col) => (
            <TouchableOpacity
              key={col}
              style={[
                styles.colorDot,
                { backgroundColor: col },
                color === col && !isValidHex(customColor) && styles.colorDotOn,
              ]}
              onPress={() => { setColor(col); setCustomColor(''); lightTap(); }}
            />
          ))}
        </View>
        <Text style={[styles.orLabel, { color: c.dim, fontFamily: MONO }]}>or enter a hex color:</Text>
        <View style={styles.hexRow}>
          <View style={[styles.hexPreview, { backgroundColor: isValidHex(customColor) ? customColor : c.border }]} />
          <TextInput
            style={[s.input, { flex: 1, fontFamily: MONO }]}
            placeholder="#FF5733"
            placeholderTextColor={c.dim}
            value={customColor}
            onChangeText={(v) => setCustomColor(v.startsWith('#') ? v : `#${v}`)}
            maxLength={7}
            autoCapitalize="characters"
          />
        </View>
        {customColor.length > 1 && !isValidHex(customColor) && (
          <Text style={[styles.hexError, { color: c.accent }]}>Enter a valid 6-digit hex code</Text>
        )}

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Text style={styles.previewEmoji}>{customEmoji || emoji}</Text>
          <View style={[styles.previewSwatch, { backgroundColor: isValidHex(customColor) ? customColor : color }]} />
          <Text style={[styles.previewName, { color: c.text, fontFamily: MONO }]} numberOfLines={1}>
            {name || 'Habit name'}
          </Text>
        </View>

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: isValidHex(customColor) ? customColor : color }]} onPress={save}>
          <Text style={styles.saveTxt}>{existing ? 'SAVE CHANGES' : 'ADD HABIT'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancel} onPress={() => nav.goBack()}>
          <Text style={[styles.cancelTxt, { color: c.muted, fontFamily: MONO }]}>CANCEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 20, fontWeight: '800', marginBottom: 20, letterSpacing: 2 },
  label: { fontSize: 10, fontWeight: '700', marginBottom: 8, marginTop: 18, letterSpacing: 1.5 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  typeBtnTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emojiTxt: { fontSize: 22 },
  orLabel: { fontSize: 11, marginTop: 10, marginBottom: 6, letterSpacing: 0.3 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotOn: { borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hexPreview: { width: 48, height: 48, borderRadius: 12 },
  hexError: { fontSize: 10, marginTop: 4, letterSpacing: 0.5 },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1, marginTop: 20,
  },
  previewEmoji: { fontSize: 26 },
  previewSwatch: { width: 14, height: 14, borderRadius: 7 },
  previewName: { flex: 1, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  saveBtn: { marginTop: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  cancel: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  cancelTxt: { fontSize: 12, letterSpacing: 1 },
});
