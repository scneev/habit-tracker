import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/AppContext';
import { today } from '../utils/dateUtils';
import { getColors } from '../utils/theme';

import { MONO } from '../utils/fonts';

const SOURCES = ['Freelance', 'Fiverr', 'Upwork', 'Side project', 'Bonus', 'Other'];

function makeId() { return Math.random().toString(36).slice(2); }

export default function LogIncomeModal() {
  const nav = useNavigation();
  const { dispatch, state } = useAppStore();
  const c = getColors(state.isDark);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Freelance');
  const [note, setNote] = useState('');

  function save() {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!amt || amt <= 0) return;
    dispatch({
      type: 'LOG_INCOME',
      payload: { id: makeId(), date: today(), amount: amt, source, note: note.trim() || undefined },
    });
    nav.goBack();
  }

  const cur = state.currency;

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: c.text, fontFamily: MONO }]}>LOG INCOME</Text>

        <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>AMOUNT ({cur})</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={c.dim}
          keyboardType="decimal-pad"
          autoFocus
          returnKeyType="next"
        />

        <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>SOURCE</Text>
        <View style={styles.chipRow}>
          {SOURCES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, { borderColor: c.border, backgroundColor: c.inputBg }, source === s && { borderColor: c.accent, backgroundColor: c.accentBg }]}
              onPress={() => setSource(s)}
            >
              <Text style={[styles.chipTxt, { color: source === s ? c.accent : c.muted, fontFamily: MONO }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: c.muted, fontFamily: MONO }]}>NOTE (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text, fontFamily: MONO }]}
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Logo design pack"
          placeholderTextColor={c.dim}
          returnKeyType="done"
          onSubmitEditing={save}
        />

        <TouchableOpacity style={[styles.btn, { backgroundColor: c.accent }, !amount && { opacity: 0.4 }]} onPress={save} disabled={!amount}>
          <Text style={[styles.btnTxt, { fontFamily: MONO }]}>SAVE INCOME</Text>
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
  heading: { fontSize: 20, fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, borderWidth: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 12, fontWeight: '600' },
  btn: { marginTop: 28, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  cancel: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  cancelTxt: { fontSize: 12, letterSpacing: 1 },
});
