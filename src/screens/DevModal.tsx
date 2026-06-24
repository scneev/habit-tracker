import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, challengeProgress } from '../store/AppContext';
import { today } from '../utils/dateUtils';

export default function DevModal() {
  const nav = useNavigation<any>();
  const { state, dispatch } = useAppStore();
  const { challenge, habits } = state;
  const cp = challengeProgress(state);

  function forceCompleteChallenge() {
    if (!challenge) return;
    challenge.habitIds.forEach((habitId) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      for (let i = 0; i < challenge.durationDays; i++) {
        const d = new Date(challenge.startDate + 'T00:00:00');
        d.setDate(d.getDate() + i);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dispatch({ type: 'SET_COUNT', payload: { habitId, date, count: habit.volumeGoal } });
      }
    });
    dispatch({ type: 'MARK_CHALLENGE_REWARDED' });
    nav.goBack();
    setTimeout(() => nav.navigate('ChallengeComplete'), 400);
  }

  function addTestLogs() {
    const t = today();
    habits.forEach((h) => {
      dispatch({ type: 'SET_COUNT', payload: { habitId: h.id, date: t, count: h.volumeGoal } });
    });
    nav.goBack();
  }

  function resetAll() {
    dispatch({
      type: 'LOAD',
      payload: { habits: [], logs: [], challenge: null, hasOnboarded: false },
    });
    nav.goBack();
  }

  return (
    <View style={styles.root}>
      <View style={styles.handle} />
      <Text style={styles.title}>🛠 DEV TOOLS</Text>

      <View style={styles.section}>
        <Text style={styles.label}>CHALLENGE</Text>
        {challenge ? (
          <>
            <Text style={styles.info}>
              {challenge.name} · DAY {cp.day}/{challenge.durationDays} · {cp.allDone ? '✅ COMPLETE' : '⏳ IN PROGRESS'}
            </Text>
            <TouchableOpacity style={styles.btn} onPress={forceCompleteChallenge}>
              <Text style={styles.btnTxt}>FORCE COMPLETE CHALLENGE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.info}>NO ACTIVE CHALLENGE</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>TODAY</Text>
        <TouchableOpacity style={styles.btn} onPress={addTestLogs}>
          <Text style={styles.btnTxt}>COMPLETE ALL HABITS TODAY</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>RESET</Text>
        <TouchableOpacity style={[styles.btn, styles.dangerBtn]} onPress={resetAll}>
          <Text style={[styles.btnTxt, { color: '#EE3333' }]}>CLEAR ALL DATA + RE-ONBOARD</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.close} onPress={() => nav.goBack()}>
        <Text style={styles.closeTxt}>CLOSE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2C2C2C',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 24,
    letterSpacing: 2,
  },
  section: { marginBottom: 20 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  info: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  btn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  dangerBtn: {
    backgroundColor: '#2A0808',
    borderColor: '#EE3333',
  },
  btnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  close: { marginTop: 8, alignItems: 'center', paddingVertical: 12 },
  closeTxt: { color: '#555555', fontSize: 12, letterSpacing: 1 },
});
