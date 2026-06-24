import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

export function AnimBar({ pct, color, height = 4 }: { pct: number; color: string; height?: number }) {
  const [containerW, setContainerW] = useState(0);
  const animW = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(animW, {
      toValue: containerW * Math.min(1, pct / 100),
      useNativeDriver: false,
      tension: 100,
      friction: 20,
    }).start();
  }, [pct, containerW]);
  return (
    <View
      style={{ height, backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: height / 2, overflow: 'hidden' }}
      onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
    >
      <Animated.View style={{ width: animW, height, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}
