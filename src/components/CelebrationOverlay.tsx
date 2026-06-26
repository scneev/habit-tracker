import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { victoryHaptic } from '../utils/haptics';

const { width: W, height: H } = Dimensions.get('window');

const COLORS = ['#EE3333','#FF6B35','#FF9F1C','#2EC4B6','#3D9BE9','#845EC2','#D65DB1','#26DE81','#F7B731','#FF6F91'];

interface Props {
  type: 'allDone' | 'streak';
  streak?: number;
  habitName?: string;
  onDone: () => void;
}

export default function CelebrationOverlay({ type, streak, habitName, onDone }: Props) {
  const fadeOverlay = useRef(new Animated.Value(0)).current;
  const scaleCard = useRef(new Animated.Value(0)).current;

  const confetti = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
      color: COLORS[i % COLORS.length],
      startX: (Math.random() * W * 0.8) + W * 0.1,
    }))
  ).current;

  useEffect(() => {
    victoryHaptic();

    // Fade in overlay
    Animated.timing(fadeOverlay, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    // Pop card
    Animated.spring(scaleCard, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();

    // Drop confetti
    const anims = confetti.map((c, i) =>
      Animated.sequence([
        Animated.delay(i * 40),
        Animated.parallel([
          Animated.timing(c.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(c.y, { toValue: H * 0.6 + Math.random() * 200, duration: 2000 + Math.random() * 800, useNativeDriver: true }),
          Animated.timing(c.x, { toValue: (Math.random() - 0.5) * 120, duration: 2000 + Math.random() * 800, useNativeDriver: true }),
          Animated.timing(c.rotate, { toValue: Math.random() > 0.5 ? 6 : -6, duration: 2000, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(1500),
            Animated.timing(c.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ]),
      ])
    );

    Animated.parallel(anims).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeOverlay, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleCard, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]).start(onDone);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const title = type === 'allDone' ? '🎉 ALL DONE!' : `🔥 ${streak} DAY STREAK!`;
  const sub = type === 'allDone'
    ? 'Every habit complete. You crushed it today.'
    : `${habitName} — keep the fire going.`;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeOverlay }]} pointerEvents="none">
      {confetti.map((c, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              left: c.startX,
              top: -20,
              backgroundColor: c.color,
              opacity: c.opacity,
              transform: [
                { translateY: c.y },
                { translateX: c.x },
                { rotate: c.rotate.interpolate({ inputRange: [-6, 6], outputRange: ['-360deg', '360deg'] }) },
              ],
            },
          ]}
        />
      ))}

      <Animated.View style={[styles.card, { transform: [{ scale: scaleCard }] }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  sub: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
});
