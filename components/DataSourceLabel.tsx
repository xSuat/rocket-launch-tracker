import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { DataSource } from '../types';
import { color, type } from '../constants/theme';

interface DataSourceLabelProps {
  source?: DataSource;
}

const getSourceDisplayName = (source?: DataSource, apiEnvironment?: 'dev' | 'prod'): string | null => {
  if (!source) return null;
  
  switch (source) {
    case 'LL2':
      const envSuffix = apiEnvironment === 'dev' ? ' (Dev)' : '';
      return `Launch Library 2${envSuffix}`;
    case 'NASA_NeoWs':
      return 'NASA NeoWs';
    case 'NASA_APOD':
      return 'NASA APOD';
    case 'Other':
      return 'Other';
    default:
      return null;
  }
};

export const DataSourceLabel: React.FC<DataSourceLabelProps> = ({ source }) => {
  const { showDataSourceLabels, apiEnvironment } = useApp();
  
  if (!showDataSourceLabels || !source) {
    return null;
  }
  
  const displayName = getSourceDisplayName(source, apiEnvironment);
  if (!displayName) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Source: {displayName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  label: {
    ...type.caption,
    color: color.textTertiary,
  },
});

