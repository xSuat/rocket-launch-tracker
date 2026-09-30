import React from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, moonEdge, radius, type } from '../../constants/theme';
import { IconButton } from './IconButton';

interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  accessibilityLabel = 'Search launches',
}) => (
  <View style={styles.field}>
    <Ionicons name="search-outline" size={18} color={color.textTertiary} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={color.textTertiary}
      accessibilityLabel={accessibilityLabel}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      clearButtonMode="while-editing"
      style={styles.input}
    />
    {Platform.OS !== 'ios' && value.length > 0 ? (
      <IconButton name="close" accessibilityLabel="Clear search" onPress={() => onChangeText('')} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  field: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: color.bgElevated,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    ...moonEdge,
  },
  input: {
    flex: 1,
    color: color.text,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...type.body,
  },
});
