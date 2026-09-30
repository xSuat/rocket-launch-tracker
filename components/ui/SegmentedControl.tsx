import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, type } from '../../constants/theme';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.box}>
      <View style={styles.track}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.segment, selected && styles.selected]}
            >
              <Text style={[type.subhead, selected ? styles.selectedLabel : styles.label]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 44,
    justifyContent: 'center',
  },
  track: {
    height: 36,
    borderRadius: radius.control,
    backgroundColor: color.bgMuted,
    flexDirection: 'row',
    padding: 2,
  },
  segment: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: color.fill,
  },
  label: {
    color: color.textSecondary,
    fontWeight: '400',
  },
  selectedLabel: {
    color: color.textOnFill,
    fontWeight: '600',
  },
});
