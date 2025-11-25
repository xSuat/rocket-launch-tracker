import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

type StatusCategory = 'success' | 'pending' | 'active' | 'failed' | 'warning' | 'info' | 'neutral';

interface StatusConfig {
  category: StatusCategory;
  displayName: string;
  bg: string;
  text: string;
}

export const getStatusConfig = (status: string): StatusConfig => {
  const normalized = status.toLowerCase().trim();
  const originalStatus = status.trim();
  
  // Success states - check exact matches first
  if (normalized === 'go') {
    return {
      category: 'success',
      displayName: 'GO',
      bg: 'rgba(16, 185, 129, 0.2)',
      text: Colors.successLight,
    };
  }
  if (normalized === 'success') {
    return {
      category: 'success',
      displayName: 'Success',
      bg: 'rgba(16, 185, 129, 0.2)',
      text: Colors.successLight,
    };
  }
  if (normalized === 'launched') {
    return {
      category: 'success',
      displayName: 'Launched',
      bg: 'rgba(16, 185, 129, 0.2)',
      text: Colors.successLight,
    };
  }
  if (normalized === 'landed') {
    return {
      category: 'success',
      displayName: 'Landed',
      bg: 'rgba(16, 185, 129, 0.2)',
      text: Colors.successLight,
    };
  }
  if (normalized.includes('success')) {
    return {
      category: 'success',
      displayName: 'Success',
      bg: 'rgba(16, 185, 129, 0.2)',
      text: Colors.successLight,
    };
  }
  if (normalized === 'launched' || normalized === 'landed') {
    return {
      category: 'success',
      displayName: originalStatus,
      bg: 'rgba(16, 185, 129, 0.2)',
      text: Colors.successLight,
    };
  }
  
  // Failed states - check exact matches first
  if (normalized === 'failure') {
    return {
      category: 'failed',
      displayName: 'Failure',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  if (normalized === 'partial failure') {
    return {
      category: 'failed',
      displayName: 'Partial Failure',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  if (normalized === 'aborted') {
    return {
      category: 'failed',
      displayName: 'Aborted',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  if (normalized === 'scrubbed') {
    return {
      category: 'failed',
      displayName: 'Scrubbed',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  if (normalized.includes('failure')) {
    const isPartial = normalized.includes('partial');
    return {
      category: 'failed',
      displayName: isPartial ? 'Partial Failure' : 'Failure',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  if (normalized.includes('abort')) {
    return {
      category: 'failed',
      displayName: 'Aborted',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  if (normalized.includes('scrub')) {
    return {
      category: 'failed',
      displayName: 'Scrubbed',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  if (normalized === 'retired') {
    return {
      category: 'failed',
      displayName: 'Retired',
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#F87171',
    };
  }
  
  // Pending/Uncertain states
  if (
    normalized === 'tbd' ||
    normalized === 'tbc' ||
    normalized.includes('to be') ||
    normalized.includes('pending') ||
    normalized === 'hold' ||
    normalized.includes('delayed') ||
    normalized.includes('postponed')
  ) {
    let displayName = status;
    if (normalized === 'tbd') displayName = 'TBD';
    if (normalized === 'tbc') displayName = 'TBC';
    if (normalized === 'hold') displayName = 'Hold';
    
    return {
      category: 'pending',
      displayName,
      bg: 'rgba(245, 158, 11, 0.2)',
      text: Colors.warningLight,
    };
  }
  
  // Active/In Progress states
  if (
    normalized === 'active' ||
    normalized.includes('in flight') ||
    normalized.includes('in progress') ||
    normalized.includes('launching') ||
    normalized.includes('orbital') ||
    normalized === 'testing' ||
    normalized.includes('preparing')
  ) {
    // Preserve original status text
    let displayName = originalStatus;
    if (normalized === 'active') displayName = 'Active';
    else if (normalized.includes('in flight')) displayName = 'In Flight';
    else if (normalized.includes('in progress')) displayName = 'In Progress';
    else if (normalized.includes('launching')) displayName = 'Launching';
    else if (normalized === 'testing') displayName = 'Testing';
    
    return {
      category: 'active',
      displayName,
      bg: 'rgba(59, 130, 246, 0.2)',
      text: '#60A5FA',
    };
  }
  
  // Warning states
  if (
    normalized.includes('concern') ||
    normalized.includes('issue') ||
    normalized.includes('problem') ||
    normalized.includes('risk')
  ) {
    return {
      category: 'warning',
      displayName: status,
      bg: 'rgba(245, 158, 11, 0.2)',
      text: Colors.warningLight,
    };
  }
  
  // Info states
  if (
    normalized.includes('scheduled') ||
    normalized.includes('planned') ||
    normalized.includes('confirmed') ||
    normalized.includes('announced')
  ) {
    return {
      category: 'info',
      displayName: status,
      bg: 'rgba(139, 92, 246, 0.2)',
      text: Colors.primaryLight,
    };
  }
  
  // Default/Neutral
  return {
    category: 'neutral',
    displayName: status || 'Unknown',
    bg: 'rgba(148, 163, 184, 0.2)',
    text: Colors.textMuted,
  };
};

export const getStatusCategory = (status: string): StatusCategory => {
  return getStatusConfig(status).category;
};

export const isLaunchCompleted = (status: string): boolean => {
  const category = getStatusCategory(status);
  return category === 'success' || category === 'failed';
};

export const isLaunchUpcoming = (status: string): boolean => {
  return !isLaunchCompleted(status);
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 10,
        borderRadius: 6,
      };
    case 'large':
      return {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        borderRadius: 12,
      };
    default: // medium
      return {
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 12,
        borderRadius: 8,
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  style,
}) => {
  const config = getStatusConfig(status);
  const sizeStyles = getSizeStyles(size);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {config.displayName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

