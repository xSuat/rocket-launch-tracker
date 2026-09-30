import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, radius, type } from '../../constants/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import {
  STATUS_FAILURE,
  STATUS_GO,
  STATUS_HOLD,
  STATUS_IN_FLIGHT,
  STATUS_PARTIAL_FAILURE,
  STATUS_PAYLOAD_DEPLOYED,
  STATUS_SUCCESS,
  STATUS_TBC,
  STATUS_TBD,
  resolveStatusId,
  statusLabel,
} from '../../utils/launchStatus';

interface StatusBadgeProps {
  statusId?: number | null;
  status?: string | null;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ statusId, status, size = 'small', style }) => {
  const id = resolveStatusId(statusId, status);
  const label = statusLabel(id, status);
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (id !== STATUS_IN_FLIGHT || reduce) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [id, pulse, reduce]);

  const medium = size !== 'small';
  const textStyle = medium ? styles.mediumText : styles.smallText;

  if (id === STATUS_GO) {
    return (
      <View accessibilityLabel={label} style={[styles.base, styles.solid, style]}>
        <Text maxFontSizeMultiplier={1.35} style={[textStyle, styles.onFill]}>{label}</Text>
      </View>
    );
  }

  if (id === STATUS_IN_FLIGHT) {
    return (
      <View accessibilityLabel={label} style={[styles.base, styles.soft, styles.row, style]}>
        <Animated.View style={[styles.dot, { opacity: pulse }]} />
        <Ionicons name="rocket-outline" size={12} color={color.textOnFill} />
        <Text maxFontSizeMultiplier={1.35} style={[textStyle, styles.onFill]}>{label}</Text>
      </View>
    );
  }

  if (id === STATUS_SUCCESS || id === STATUS_PAYLOAD_DEPLOYED) {
    return (
      <View accessibilityLabel={label} style={[styles.base, styles.quiet, styles.row, style]}>
        <Ionicons name="checkmark" size={12} color={color.textSecondary} />
        <Text maxFontSizeMultiplier={1.35} style={[textStyle, styles.quietText]}>{label}</Text>
      </View>
    );
  }

  const outline =
    id === STATUS_HOLD ? styles.hold :
    id === STATUS_FAILURE ? styles.marked :
    styles.outline;
  const glyph =
    id === STATUS_TBD ? 'ellipse-outline' :
    id === STATUS_TBC ? 'help-outline' :
    id === STATUS_HOLD ? 'pause' :
    id === STATUS_FAILURE ? 'close' :
    id === STATUS_PARTIAL_FAILURE ? 'remove' :
    null;
  const glyphColor = id === STATUS_TBC ? color.textSecondary : color.text;

  return (
    <View accessibilityLabel={label} style={[styles.base, outline, styles.row, style]}>
      {glyph ? <Ionicons name={glyph} size={12} color={glyphColor} /> : null}
      <Text maxFontSizeMultiplier={1.35} style={[textStyle, id === STATUS_TBC ? styles.quietText : styles.plain]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.badge,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  solid: {
    backgroundColor: color.fill,
  },
  soft: {
    backgroundColor: color.fillSoft,
  },
  outline: {
    borderWidth: 1,
    borderColor: color.border,
  },
  hold: {
    borderWidth: 1,
    borderColor: color.fill,
  },
  marked: {
    borderWidth: 1,
    borderColor: color.fill,
  },
  quiet: {
    paddingHorizontal: 0,
  },
  smallText: {
    ...type.caption,
  },
  mediumText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  onFill: {
    color: color.textOnFill,
  },
  plain: {
    color: color.text,
  },
  quietText: {
    color: color.textSecondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.textOnFill,
  },
});
