import React, { useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Habit, HabitLog } from '../types';
import { rewardHaptic, lightTap, mediumTap } from '../utils/haptics';
import RewardBurst, { RewardBurstRef } from './RewardBurst';

interface Props {
  habit: Habit;
  log: HabitLog | undefined;
  streak: number;
  onSetCount: (count: number) => void;
  onDelete: () => void;
}

export default function HabitCircle({ habit, log, streak, onSetCount, onDelete }: Props) {
  const count = log?.count ?? 0;
  const goal = habit.volumeGoal;
  const done = count >= goal;

  const scale = useRef(new Animated.Value(1)).current;
  const burstRef = useRef<RewardBurstRef>(null);
  const [showDelete, setShowDelete] = useState(false);

  function bounce() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, speed: 40 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  }

  async function handlePress() {
    if (showDelete) {
      setShowDelete(false);
      return;
    }

    if (habit.type === 'binary') {
      const next = done ? 0 : 1;
      onSetCount(next);
      if (next === 1) {
        bounce();
        burstRef.current?.burst();
        await rewardHaptic();
      } else {
        await lightTap();
      }
    } else {
      // volume: increment up to goal, then tap on done circle resets
      if (done) {
        onSetCount(0);
        await lightTap();
      } else {
        const next = count + 1;
        onSetCount(next);
        if (next >= goal) {
          bounce();
          burstRef.current?.burst();
          await rewardHaptic();
        } else {
          await mediumTap();
        }
      }
    }
  }

  function handleLongPress() {
    setShowDelete(true);
    lightTap();
  }

  function handleDeletePress() {
    onDelete();
    setShowDelete(false);
  }

  const monoFont = Platform.OS === 'web' ? "'Space Mono', monospace" : undefined;

  return (
    <View style={styles.outer}>
      <Animated.View style={[styles.circleWrap, { transform: [{ scale }] }]}>
        <RewardBurst ref={burstRef} />

        <TouchableOpacity
          style={[
            styles.circle,
            done && styles.circleDone,
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.8}
          delayLongPress={500}
        >
          <Text style={styles.emoji}>{habit.emoji}</Text>

          {habit.type === 'volume' && (
            <Text style={[
              styles.volumeCount,
              { fontFamily: monoFont },
              done && styles.volumeCountDone,
            ]}>
              {count}/{goal}
            </Text>
          )}

          {done && (
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeTxt}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Delete badge - shown on long press */}
        {showDelete && (
          <TouchableOpacity style={styles.deleteBadge} onPress={handleDeletePress}>
            <Text style={styles.deleteBadgeTxt}>×</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Label below circle */}
      <Text style={styles.habitName} numberOfLines={1}>
        {habit.name.toUpperCase()}
      </Text>
      {streak > 0 && (
        <Text style={[styles.streak, { fontFamily: monoFont }]}>
          {streak}▲
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    padding: 6,
  },
  circleWrap: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'visible',
  },
  circle: {
    flex: 1,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#2C2C2C',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleDone: {
    borderColor: '#EE3333',
    backgroundColor: '#2A0808',
  },
  emoji: {
    fontSize: 32,
  },
  volumeCount: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  volumeCountDone: {
    color: '#EE3333',
  },
  doneBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EE3333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  deleteBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EE3333',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  deleteBadgeTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  habitName: {
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: '90%',
  },
  streak: {
    fontSize: 11,
    color: '#EE3333',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
