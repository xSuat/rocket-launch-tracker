import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { color, radius, type } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'text';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}) => {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'text' && styles.text,
        inactive && variant === 'primary' && styles.primaryDisabled,
        inactive && variant === 'secondary' && styles.secondaryDisabled,
        pressed && !inactive && variant === 'primary' && styles.primaryPressed,
        pressed && !inactive && variant !== 'primary' && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' && !disabled ? color.textOnFill : color.text} />
      ) : (
        <Text
          style={[
            type.calloutStrong,
            variant === 'primary' && !inactive && styles.primaryLabel,
            variant === 'secondary' && styles.secondaryLabel,
            variant === 'text' && styles.textLabel,
            inactive && styles.disabledLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: color.fill,
  },
  primaryPressed: {
    backgroundColor: color.fillSoft,
  },
  primaryDisabled: {
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.textDisabled,
  },
  secondary: {
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.border,
  },
  secondaryDisabled: {
    borderColor: color.textDisabled,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  pressed: {
    backgroundColor: color.bgMuted,
  },
  primaryLabel: {
    color: color.textOnFill,
  },
  secondaryLabel: {
    color: color.text,
  },
  textLabel: {
    color: color.textSecondary,
  },
  disabledLabel: {
    color: color.textDisabled,
  },
});
