import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { color, radius, space } from '../../constants/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export const Skeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduce) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 450, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduce]);

  return (
    <Animated.View accessibilityLabel="Loading" style={{ opacity }}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.row}>
          <View style={styles.thumb} />
          <View style={styles.lines}>
            <View style={styles.line} />
            <View style={[styles.line, styles.short]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.s12,
    paddingHorizontal: space.s20,
    paddingVertical: space.s12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.image,
    backgroundColor: color.bgMuted,
  },
  lines: {
    flex: 1,
    justifyContent: 'center',
    gap: space.s8,
  },
  line: {
    height: 12,
    borderRadius: 4,
    backgroundColor: color.bgMuted,
  },
  short: {
    width: '55%',
  },
});
