import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { color, space, type } from '../../constants/theme';

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text accessibilityRole="header" maxFontSizeMultiplier={1.35} style={styles.title}>
    {title.toUpperCase()}
  </Text>
);

const styles = StyleSheet.create({
  title: {
    ...type.caption,
    color: color.textTertiary,
    paddingHorizontal: space.s20,
    paddingTop: space.s24,
    paddingBottom: space.s8,
  },
});
