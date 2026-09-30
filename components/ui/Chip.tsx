import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { color, radius, type } from '../../constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected: !!selected }}
    onPress={onPress}
    style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
  >
    <Text style={[type.callout, selected ? styles.selectedLabel : styles.label]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.control,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: color.fill,
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: color.text,
  },
  selectedLabel: {
    color: color.textOnFill,
    fontWeight: '600',
  },
});
