import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GradientButton } from './ui';
import { Colors } from '../constants/colors';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, onBack }) => {
  // Split message by newlines to handle multi-line messages
  const messageLines = message.split('\n');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <View style={styles.messageContainer}>
        {messageLines.map((line, index) => (
          <Text key={index} style={styles.message}>
            {line}
          </Text>
        ))}
      </View>
      <View style={styles.buttonContainer}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
        {onRetry && (
          <GradientButton
            title="Try Again"
            onPress={onRetry}
            style={styles.retryButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 24,
    maxWidth: '90%',
  },
  message: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 300,
    justifyContent: 'center',
  },
  retryButton: {
    flex: 1,
  },
  backButton: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

