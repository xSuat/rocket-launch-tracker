import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { EngineLayout as EngineLayoutType } from '../utils/rocketUtils';
import { Colors } from '../constants/colors';

interface EngineLayoutProps {
  layout: EngineLayoutType | null;
  size?: number;
}

export const EngineLayout: React.FC<EngineLayoutProps> = ({
  layout,
  size = 200,
}) => {
  if (!layout || !layout.positions || layout.positions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Engine layout not available</Text>
      </View>
    );
  }

  const engineRadius = size / 20;
  const svgSize = size;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Engine Layout ({layout.layout})</Text>
      <View style={[styles.svgContainer, { width: svgSize, height: svgSize }]}>
        <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
          <G>
            {layout.positions.map((pos, index) => (
              <Circle
                key={index}
                cx={pos.x}
                cy={pos.y}
                r={engineRadius * 2}
                fill={Colors.primary}
                stroke={Colors.primaryDark}
                strokeWidth="0.5"
                opacity={0.9}
              />
            ))}
          </G>
        </Svg>
      </View>
      <Text style={styles.info}>
        {layout.count} × {layout.type} engines
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardSolid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 8,
  },
  label: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  svgContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  info: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  noDataText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

