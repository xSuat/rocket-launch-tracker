import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color } from '../../constants/theme';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
  selected?: boolean;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  accessibilityLabel,
  onPress,
  selected,
  color: glyph = color.text,
  disabled,
  style,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ selected, disabled }}
    disabled={disabled}
    onPress={onPress}
    hitSlop={4}
    style={({ pressed }) => [styles.hit, pressed && styles.pressed, style]}
  >
    <Ionicons name={name} size={22} color={disabled ? color.textDisabled : glyph} />
  </Pressable>
);

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: color.bgMuted,
  },
});
