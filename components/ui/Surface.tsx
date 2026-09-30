import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { color, moonEdge, radius, space } from '../../constants/theme';

interface SurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export const Surface: React.FC<SurfaceProps> = ({ children, style, padded = true }) => (
  <View style={[styles.surface, padded && styles.padded, style]}>{children}</View>
);

const styles = StyleSheet.create({
  surface: {
    backgroundColor: color.bgElevated,
    borderRadius: radius.surface,
    overflow: 'hidden',
    ...moonEdge,
  },
  padded: {
    padding: space.s16,
  },
});
