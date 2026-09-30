import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, type } from '../constants/theme';
import { useNow } from '../hooks/useNow';
import { formatCountdownLabel, getCountdown } from '../utils/dateUtils';

interface CountdownTimerProps {
  date: string;
  passedLabel?: string;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ date, passedLabel = 'Window passed' }) => {
  const now = useNow(1000);
  const parts = getCountdown(date, now);
  const groups = useMemo(() => {
    if (parts.days > 0) {
      return [
        { value: pad(parts.days), unit: 'D' },
        { value: pad(parts.hours), unit: 'H' },
        { value: pad(parts.minutes), unit: 'M' },
        { value: pad(parts.seconds), unit: 'S' },
      ];
    }
    return [
      { value: pad(parts.hours), unit: 'H' },
      { value: pad(parts.minutes), unit: 'M' },
      { value: pad(parts.seconds), unit: 'S' },
    ];
  }, [parts.days, parts.hours, parts.minutes, parts.seconds]);

  if (parts.isPast) {
    return (
      <Text accessibilityLabel={passedLabel} style={styles.passed}>
        {passedLabel}
      </Text>
    );
  }

  const label = formatCountdownLabel(parts);

  return (
    <View accessibilityLabel={label} style={styles.row}>
      {groups.map((group) => (
        <View key={group.unit} style={styles.group}>
          <Text maxFontSizeMultiplier={1.4} style={styles.digit}>{group.value}</Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.unit}>{group.unit}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  group: {
    alignItems: 'center',
    minWidth: 48,
  },
  digit: {
    ...type.countdown,
    color: color.text,
  },
  unit: {
    ...type.countdownUnit,
    color: color.textTertiary,
  },
  passed: {
    ...type.title,
    color: color.textSecondary,
  },
});
