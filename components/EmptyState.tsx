import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, space, type } from '../constants/theme';
import { Button } from './ui/Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'planet-outline',
  title,
  message,
  actionLabel,
  onAction,
}) => (
  <View style={styles.wrap}>
    <Ionicons name={icon} size={32} color={color.textTertiary} />
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.action} /> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: space.s32,
    gap: space.s8,
  },
  title: {
    ...type.headline,
    color: color.text,
    textAlign: 'center',
  },
  message: {
    ...type.footnote,
    color: color.textTertiary,
    textAlign: 'center',
  },
  action: {
    marginTop: space.s8,
    alignSelf: 'stretch',
  },
});
