import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { useApp } from '../context/AppContext';
import { memoryCache } from '../services/cache';
import { color, space, type } from '../constants/theme';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SpaceTerminologyModal } from '../components/SpaceTerminologyModal';

const PRIVACY_POLICY_URL = 'https://xsuat.github.io/rocket-launch-tracker/privacy-policy.html';
const SUPPORT_URL = 'https://xsuat.github.io/rocket-launch-tracker/support.html';
const APP_VERSION = Application.nativeApplicationVersion || Constants.expoConfig?.version || '1.0.0';

const Row = ({
  title,
  subtitle,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) => (
  <Pressable
    accessibilityRole={onPress ? 'button' : 'text'}
    accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
    disabled={!onPress}
    onPress={onPress}
    style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
  >
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
    </View>
    {trailing}
  </Pressable>
);

export const SettingsScreen: React.FC = () => {
  const {
    apiEnvironment,
    setApiEnvironment,
    showDataSourceLabels,
    setShowDataSourceLabels,
  } = useApp();
  const [glossary, setGlossary] = useState(false);

  const clearCache = () => {
    Alert.alert(
      'Clear cache',
      'This removes saved launch and event lists. The app will load them again from the internet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear cache',
          style: 'destructive',
          onPress: async () => {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter((key: string) =>
                key.startsWith('launch_cache_') ||
                key.startsWith('events_cache_') ||
                key.startsWith('filter_options_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              memoryCache.clear();
              Alert.alert('Cache cleared', 'Saved lists were removed.');
            } catch {
              Alert.alert('Could not clear cache', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader title="About" />
      <Row title="Version" subtitle={Application.nativeBuildVersion ? `Build ${Application.nativeBuildVersion}` : undefined} trailing={<Text style={styles.value}>{APP_VERSION}</Text>} />
      <Row title="Privacy Policy" subtitle="What leaves this device" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
      <Row title="Support" subtitle="Help and contact" onPress={() => Linking.openURL(SUPPORT_URL)} />
      <Row title="Glossary" subtitle="Launch and orbit terms" onPress={() => setGlossary(true)} />
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Launch Library 2</Text>
        <Text style={styles.noteBody}>Launch schedules from The Space Devs. ll.thespacedevs.com</Text>
        <Text style={styles.noteTitle}>NASA NeoWs</Text>
        <Text style={styles.noteBody}>Asteroid close approaches. api.nasa.gov</Text>
        <Text style={styles.noteTitle}>NASA APOD</Text>
        <Text style={styles.noteBody}>Astronomy Picture of the Day. api.nasa.gov</Text>
        <Text style={styles.disclaimer}>
          Rocket Launch Tracker is not affiliated with, endorsed by, or sponsored by NASA or any launch provider. NASA images and data are used under NASA's public API terms.
        </Text>
      </View>

      <SectionHeader title="Calendar and notifications" />
      <Text style={styles.footnote}>
        Add to Calendar opens the system sheet. Reminders are notifications scheduled on this device. The app does not use remote push.
      </Text>

      <SectionHeader title="Cache" />
      <Row title="Clear cache" subtitle="Remove saved launch and event lists" onPress={clearCache} />

      {__DEV__ ? (
        <>
          <SectionHeader title="Developer" />
          <Row
            title="Data source labels"
            subtitle={showDataSourceLabels ? 'Visible' : 'Hidden'}
            trailing={
              <Switch
                accessibilityLabel="Data source labels"
                value={showDataSourceLabels}
                onValueChange={setShowDataSourceLabels}
                trackColor={{ false: color.hairline, true: color.fill }}
                thumbColor={showDataSourceLabels ? color.textOnFill : color.textSecondary}
              />
            }
          />
          <Row
            title="Development API"
            subtitle="lldev.thespacedevs.com"
            onPress={() => setApiEnvironment('dev')}
            trailing={apiEnvironment === 'dev' ? <Text style={styles.value}>On</Text> : null}
          />
          <Row
            title="Production API"
            subtitle="ll.thespacedevs.com"
            onPress={() => setApiEnvironment('prod')}
            trailing={apiEnvironment === 'prod' ? <Text style={styles.value}>On</Text> : null}
          />
        </>
      ) : null}
      <SpaceTerminologyModal visible={glossary} onClose={() => setGlossary(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: space.s32 },
  row: {
    minHeight: 64,
    paddingHorizontal: space.s20,
    paddingVertical: space.s12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
    gap: space.s12,
  },
  pressed: { backgroundColor: color.bgMuted },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...type.headline, color: color.text },
  rowSubtitle: { ...type.footnote, color: color.textTertiary },
  value: { ...type.subhead, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  note: { paddingHorizontal: space.s20, paddingTop: space.s16, gap: space.s4 },
  noteTitle: { ...type.headline, color: color.text, marginTop: space.s8 },
  noteBody: { ...type.footnote, color: color.textSecondary },
  disclaimer: { ...type.footnote, color: color.textTertiary, marginTop: space.s16 },
  footnote: {
    ...type.footnote,
    color: color.textTertiary,
    paddingHorizontal: space.s20,
    paddingBottom: space.s8,
  },
});
