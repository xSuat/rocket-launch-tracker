import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCountdown } from '../utils/dateUtils';
import { Colors } from '../constants/colors';

interface CountdownTimerProps {
  launchDate: string;
  size?: 'small' | 'medium' | 'large';
  format?: 'full' | 'compact';
  showIcon?: boolean;
  animated?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  launchDate,
  size = 'medium',
  format = 'full',
  showIcon = false,
  animated = false,
}) => {
  const [countdown, setCountdown] = useState(getCountdown(launchDate));
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(launchDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [launchDate]);

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated, fadeAnim]);

  if (countdown.isPast) {
    return (
      <Animated.View style={[styles.container, animated && { opacity: fadeAnim }]}>
        <Text style={[styles.label, sizeStyles[size].label]}>Launched</Text>
      </Animated.View>
    );
  }

  const renderCompact = () => {
    const parts: string[] = [];
    if (countdown.days > 0) {
      parts.push(`${countdown.days}D`);
    }
    if (countdown.hours > 0 || parts.length > 0) {
      parts.push(`${countdown.hours}H`);
    }
    if (countdown.minutes > 0 || parts.length > 0) {
      parts.push(`${countdown.minutes}M`);
    }
    parts.push(`${countdown.seconds}S`);

    return (
      <Animated.View style={[styles.compactContainer, animated && { opacity: fadeAnim }]}>
        {showIcon && (
          <MaterialCommunityIcons 
            name="rocket-launch" 
            size={size === 'small' ? 14 : size === 'medium' ? 16 : 18} 
            color={Colors.textMuted} 
            style={styles.icon}
          />
        )}
        <Text style={[styles.compactText, compactSizeStyles[size]]}>
          {parts.join(' ')}
        </Text>
      </Animated.View>
    );
  };

  const renderFull = () => {
    const timeUnits = [
      { label: 'Days', value: countdown.days },
      { label: 'Hours', value: countdown.hours },
      { label: 'Minutes', value: countdown.minutes },
      { label: 'Seconds', value: countdown.seconds },
    ];

    return (
      <Animated.View style={[styles.container, animated && { opacity: fadeAnim }]}>
        {timeUnits.map((unit) => (
          <View key={unit.label} style={styles.unitContainer}>
            <Text style={[styles.value, sizeStyles[size].value]}>{unit.value}</Text>
            <Text style={[styles.label, sizeStyles[size].label]}>{unit.label}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  return format === 'compact' ? renderCompact() : renderFull();
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  unitContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  value: {
    color: Colors.text,
    fontWeight: '600',
  },
  label: {
    color: Colors.text,
    marginTop: 4,
    fontSize: 10,
    opacity: 0.9,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 6,
  },
  compactText: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
});

const sizeStyles = {
  small: {
    value: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    label: {
      fontSize: 9,
    },
  },
  medium: {
    value: {
      fontSize: 24,
      fontWeight: '700' as const,
    },
    label: {
      fontSize: 10,
    },
  },
  large: {
    value: {
      fontSize: 32,
      fontWeight: '700' as const,
    },
    label: {
      fontSize: 12,
    },
  },
};

const compactSizeStyles = {
  small: {
    fontSize: 12,
  },
  medium: {
    fontSize: 14,
  },
  large: {
    fontSize: 16,
  },
};

