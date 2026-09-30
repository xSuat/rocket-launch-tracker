import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { color, space, type } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  title: string;
  showSettings?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, showSettings = true }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={[styles.row, { paddingTop: insets.top }]}>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {showSettings ? (
        <IconButton
          name="settings-outline"
          accessibilityLabel="Settings"
          onPress={() => navigation.navigate('Settings')}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: space.s20,
    paddingBottom: space.s8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s8,
  },
  title: {
    ...type.largeTitle,
    color: color.text,
    flex: 1,
  },
});
