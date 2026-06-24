import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const PARTICLE_COLORS = ['#EE3333', '#FF6B6B', '#FF4444', '#CC2222', '#FF8888', '#EE5555'];
const COUNT = 10;

export interface RewardBurstRef {
  burst(): void;
}

const RewardBurst = forwardRef<RewardBurstRef>((_, ref) => {
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const particles = useRef(
    Array.from({ length: COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    })),
  ).current;

  useImperativeHandle(ref, () => ({
    burst() {
      const anims = particles.map((p, i) => {
        const angle = (i / COUNT) * 2 * Math.PI + Math.random() * 0.3;
        const dist = 55 + Math.random() * 35;
        p.x.setValue(0);
        p.y.setValue(0);
        p.opacity.setValue(1);
        p.scale.setValue(0);

        return Animated.parallel([
          Animated.timing(p.x, { toValue: Math.cos(angle) * dist, duration: 550, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: Math.sin(angle) * dist, duration: 550, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.scale, { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: 450, delay: 80, useNativeDriver: true }),
          ]),
        ]);
      });
      Animated.parallel(anims).start();
    },
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setCenter({ x: width / 2, y: height / 2 });
      }}
    >
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
              top: center.y - 5,
              left: center.x - 5,
            },
            { transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }], opacity: p.opacity },
          ]}
        />
      ))}
    </View>
  );
});

export default RewardBurst;

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
