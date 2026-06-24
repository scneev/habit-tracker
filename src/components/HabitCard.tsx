import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Habit, HabitLog } from '../types';
import { Colors } from '../utils/theme';
import { MONO, NUMS } from '../utils/fonts';

interface Props {
  habit: Habit;
  log?: HabitLog;
  streak: number;
  onSetCount: (count: number) => void;
  onDelete: () => void;
  colors: Colors;
}

export default function HabitCard({ habit, log, streak, onSetCount, onDelete, colors: c }: Props) {
  const count = log?.count ?? 0;
  const done = count >= habit.volumeGoal;
  const pct = habit.type === 'volume' ? Math.min(1, count / Math.max(1, habit.volumeGoal)) : done ? 1 : 0;
  const [showDelete, setShowDelete] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  function bounce() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 280, friction: 10 }),
    ]).start();
  }

  function tapCard() {
    if (habit.type === 'volume') return;
    bounce();
    onSetCount(done ? 0 : 1);
  }

  function increment() { bounce(); onSetCount(count + 1); }
  function decrement() { if (count <= 0) return; bounce(); onSetCount(count - 1); }

  const cardBg = done ? c.accent : c.surface;
  const textCol = done ? c.cream : c.text;
  const mutedCol = done ? 'rgba(237,234,227,0.65)' : c.muted;

  return (
    <Pressable
      onPress={tapCard}
      onLongPress={() => setShowDelete((v) => !v)}
      delayLongPress={500}
      style={{ marginBottom: 8 }}
    >
      <Animated.View style={[styles.card, { backgroundColor: cardBg, transform: [{ scale }] }]}>

        {/* Emoji */}
        <View style={[styles.emojiWrap, { backgroundColor: done ? 'rgba(237,234,227,0.2)' : c.surface2 }]}>
          <Text style={styles.emoji}>{habit.emoji}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: textCol, fontFamily: MONO }]} numberOfLines={1}>
            {habit.name.toUpperCase()}
          </Text>
          {habit.type === 'volume' && (
            <View style={styles.volumeRow}>
              <View style={[styles.barTrack, { backgroundColor: done ? 'rgba(237,234,227,0.25)' : c.surface2 }]}>
                <View style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct * 100}%` as any,
                  backgroundColor: done ? c.cream : c.accent,
                  borderRadius: 3,
                }} />
              </View>
              <Text style={[styles.volLabel, { color: mutedCol, fontFamily: MONO }]}>
                {count}/{habit.volumeGoal}
              </Text>
            </View>
          )}
          {streak > 0 && (
            <Text style={[styles.streakLine, { color: mutedCol, fontFamily: MONO }]}>
              {streak}d streak
            </Text>
          )}
        </View>

        {/* Right controls */}
        {habit.type === 'volume' ? (
          <View style={styles.volControls}>
            <TouchableOpacity
              style={[styles.volBtn, { backgroundColor: done ? 'rgba(237,234,227,0.2)' : c.surface2 }]}
              onPress={decrement}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={[styles.volBtnTxt, { color: count > 0 ? textCol : mutedCol }]}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.volBtn, { backgroundColor: done ? 'rgba(237,234,227,0.2)' : c.accentBg }]}
              onPress={increment}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={[styles.volBtnTxt, { color: done ? c.cream : c.accent }]}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[
            styles.checkCircle,
            { backgroundColor: done ? 'rgba(237,234,227,0.25)' : c.surface2 },
          ]}>
            <Text style={[styles.checkTxt, { color: done ? c.cream : c.dim }]}>
              {done ? '✓' : '○'}
            </Text>
          </View>
        )}

        {showDelete && (
          <TouchableOpacity
            style={[styles.deleteArea, { borderRadius: 28 }]}
            onPress={() => { onDelete(); setShowDelete(false); }}
          >
            <Text style={styles.deleteTxt}>HOLD TO{'\n'}DELETE</Text>
            <Text style={[styles.deleteTxt, { fontSize: 22, marginTop: 4 }]}>×</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  emojiWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 12, letterSpacing: 1.5 },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  barTrack: { flex: 1, height: 4, borderRadius: 3, overflow: 'hidden', position: 'relative' },
  volLabel: { fontSize: 10, letterSpacing: 1 },
  streakLine: { fontSize: 9, letterSpacing: 2, marginTop: 4 },

  volControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  volBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  volBtnTxt: { fontSize: 22, fontWeight: '300', lineHeight: 28 },

  checkCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  checkTxt: { fontSize: 18, fontWeight: '300' },

  deleteArea: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 90, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#CC0000',
    gap: 2,
  },
  deleteTxt: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
});
