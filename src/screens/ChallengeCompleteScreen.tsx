import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/AppContext';
import { victoryHaptic } from '../utils/haptics';

const TROPHIES = ['🏆', '🥇', '⭐', '🔥', '✨', '🎉', '💪', '🎯'];

export default function ChallengeCompleteScreen() {
  const nav = useNavigation();
  const { state, dispatch } = useAppStore();
  const scale = useRef(new Animated.Value(0)).current;

  const floats = useRef(
    Array.from({ length: 8 }, () => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      x: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    victoryHaptic();

    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }).start();

    const anims = floats.map((f, i) => {
      const xDir = (i % 2 === 0 ? 1 : -1) * (30 + i * 15);
      f.y.setValue(0);
      f.x.setValue(0);
      f.opacity.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(f.y, { toValue: -180, duration: 2000, useNativeDriver: true }),
            Animated.timing(f.x, { toValue: xDir, duration: 2000, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(f.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(f.opacity, { toValue: 0, duration: 800, delay: 900, useNativeDriver: true }),
            ]),
          ]),
          Animated.delay(Math.random() * 500),
        ]),
      );
    });
    Animated.parallel(anims).start();
  }, []);

  function done() {
    dispatch({ type: 'CLEAR_CHALLENGE' });
    nav.goBack();
  }

  return (
    <View style={styles.root}>
      {/* Floating emojis */}
      <View style={[styles.floatArea, { pointerEvents: 'none' }]}>
        {floats.map((f, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.floatEmoji,
              { transform: [{ translateY: f.y }, { translateX: f.x }], opacity: f.opacity },
            ]}
          >
            {TROPHIES[i % TROPHIES.length]}
          </Animated.Text>
        ))}
      </View>

      <Animated.Text style={[styles.trophy, { transform: [{ scale }] }]}>🏆</Animated.Text>

      <Text style={styles.heading}>CHALLENGE{'\n'}COMPLETE.</Text>
      <Text style={styles.sub}>
        You crushed the{' '}
        <Text style={styles.bold}>{state.challenge?.name ?? '3-Day Challenge'}</Text>!
        {'\n\n'}Consistency is how champions are made. Keep the streak alive.
      </Text>

      <TouchableOpacity style={styles.btn} onPress={done}>
        <Text style={styles.btnTxt}>KEEP GOING →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  floatArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 160,
  },
  floatEmoji: { position: 'absolute', fontSize: 28, bottom: 0 },
  trophy: { fontSize: 96, marginBottom: 24 },
  heading: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 3,
    lineHeight: 44,
  },
  sub: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bold: { fontWeight: '700', color: '#EE3333' },
  btn: {
    marginTop: 40,
    backgroundColor: '#EE3333',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 48,
  },
  btnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
