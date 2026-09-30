import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, space, type } from '../constants/theme';
import { Button } from './ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Couldn't load launches",
  message = 'Check your connection and try again.',
  onRetry,
  onBack,
}) => (
  <View style={styles.wrap}>
    <Ionicons name="refresh-outline" size={32} color={color.textTertiary} />
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {onRetry ? <Button label="Try again" onPress={onRetry} style={styles.action} /> : null}
    {onBack ? <Button label="Back" variant="secondary" onPress={onBack} style={styles.action} /> : null}
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
