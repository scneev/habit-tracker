import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/AppContext';
import { today } from '../utils/dateUtils';
import { getColors } from '../utils/theme';

import { MONO } from '../utils/fonts';

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function LogWakeModal() {
  const nav = useNavigation();
  const { state, dispatch } = useAppStore();
  const c = getColors(state.isDark);
  const [time, setTime] = useState(nowTime());

  function save() {
    const trimmed = time.trim();
    if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return;
    const [h, m] = trimmed.split(':').map(Number);
    if (h > 23 || m > 59) return;
    const normalized = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    dispatch({ type: 'LOG_WAKE', payload: { date: today(), time: normalized } });
    nav.goBack();
  }

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />
      <Text style={[styles.heading, { color: c.text, fontFamily: MONO }]}>LOG WAKE TIME</Text>
      <Text style={[styles.sub, { color: c.muted, fontFamily: MONO }]}>{today()}</Text>

      <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>TIME (HH:MM)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.accent, color: c.text, fontFamily: MONO }]}
        value={time}
        onChangeText={setTime}
        placeholder="06:30"
        placeholderTextColor={c.dim}
        keyboardType={Platform.OS === 'web' ? 'default' : 'numbers-and-punctuation'}
        autoFocus
        onSubmitEditing={save}
        returnKeyType="done"
        maxLength={5}
      />

      <View style={styles.presets}>
        {['05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.preset, { backgroundColor: c.inputBg, borderColor: c.border }, time === t && { backgroundColor: c.accentBg, borderColor: c.accent }]}
            onPress={() => setTime(t)}
          >
            <Text style={[styles.presetTxt, { fontFamily: MONO, color: time === t ? c.accent : c.muted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, { backgroundColor: c.accent }]} onPress={save}>
        <Text style={[styles.btnTxt, { fontFamily: MONO }]}>SAVE WAKE TIME</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancel} onPress={() => nav.goBack()}>
        <Text style={[styles.cancelTxt, { color: c.muted, fontFamily: MONO }]}>CANCEL</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  heading: { fontSize: 20, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  sub: { fontSize: 11, letterSpacing: 1, marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    height: 60, borderRadius: 14,
    paddingHorizontal: 16, fontSize: 30, borderWidth: 2, textAlign: 'center',
    letterSpacing: 4, fontWeight: '700',
  },
  presets: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  preset: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  presetTxt: { fontSize: 12, letterSpacing: 0.5 },
  btn: { marginTop: 28, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  cancel: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  cancelTxt: { fontSize: 12, letterSpacing: 1 },
});
