import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { Colors } from '../../constants/colors';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  onFilterPress?: () => void;
  filterActiveCount?: number;
  style?: ViewStyle;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onFilterPress,
  filterActiveCount = 0,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <GlassCard style={styles.searchCard}>
        <View style={styles.searchContent}>
          <MaterialIcons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
      </GlassCard>
      {onFilterPress && (
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterActiveCount > 0 && styles.filterButtonActive,
          ]}
          onPress={onFilterPress}
        >
          <MaterialIcons
            name="filter-list"
            size={20}
            color={filterActiveCount > 0 ? Colors.text : Colors.textSecondary}
          />
          {filterActiveCount > 0 && (
            <Text style={styles.filterButtonText}> ({filterActiveCount})</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchCard: {
    flex: 1,
    padding: 0,
    marginBottom: 0,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  filterButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
    flexDirection: 'row',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.text,
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
});

