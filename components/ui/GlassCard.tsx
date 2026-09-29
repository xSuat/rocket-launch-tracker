import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  intensity?: number;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  intensity = 20,
  padding,
}) => {
  const cardStyle = [
    styles.card,
    style,
  ];

  const contentStyle = padding !== undefined 
    ? [styles.content, { padding }]
    : styles.content;

  const content = (
    <View style={cardStyle}>
      {Platform.OS === 'ios' ? (
        <>
          <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={contentStyle}>{children}</View>
        </>
      ) : (
        <View style={[contentStyle, styles.androidBlur]}>{children}</View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  content: {
    padding: 20,
  },
  androidBlur: {
    backgroundColor: Colors.cardSolid,
  },
});

