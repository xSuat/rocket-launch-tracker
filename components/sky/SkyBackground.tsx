import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { createStarfield, Star } from './stars';

const MOON_R = 18;
const HALO_R = 200;

function Twinkle({ star, width, height, delay }: { star: Star; width: number; height: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = () => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    };
    const stop = () => {
      loop?.stop();
      loop = null;
    };
    timer = setTimeout(start, delay);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });
    return () => {
      if (timer) clearTimeout(timer);
      stop();
      sub.remove();
    };
  }, [delay, opacity]);

  const size = star.r * 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: star.x * width - star.r,
        top: star.y * height - star.r,
        width: size,
        height: size,
        borderRadius: star.r,
        backgroundColor: '#FFFFFF',
        opacity,
      }}
    />
  );
}

export const SkyBackground: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => createStarfield(), []);
  const reduceMotion = useReduceMotion();
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);

  const moonX = width - 20;
  const moonY = 28;
  const twinkle = !reduceMotion && active;
  const staticStars = stars.filter((star) => !star.twinkle || !twinkle);
  const liveStars = twinkle ? stars.filter((star) => star.twinkle) : [];

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="moonHalo" cx={moonX} cy={moonY} r={HALO_R} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
            <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.08} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={moonX} cy={moonY} r={HALO_R} fill="url(#moonHalo)" />
        {staticStars.map((star, index) => (
          <Circle
            key={index}
            cx={star.x * width}
            cy={star.y * height}
            r={star.r}
            fill="#FFFFFF"
            opacity={star.o}
          />
        ))}
        <Circle cx={moonX} cy={moonY} r={MOON_R} fill="#F2F2F2" />
        <Circle cx={moonX - 4} cy={moonY + 3} r={2.5} fill="#D0D0D0" />
        <Circle cx={moonX - 7} cy={moonY - 1} r={1.6} fill="#D0D0D0" />
        <Circle cx={moonX + 1} cy={moonY + 6} r={2} fill="#D0D0D0" />
        <Path
          d={`M ${moonX + 6} ${moonY - 14} A 14 14 0 0 1 ${moonX + 14} ${moonY + 2}`}
          stroke="#FFFFFF"
          strokeWidth={2}
          fill="none"
        />
      </Svg>
      {liveStars.map((star, index) => (
        <Twinkle key={`tw-${index}`} star={star} width={width} height={height} delay={index * 400} />
      ))}
    </View>
  );
};
