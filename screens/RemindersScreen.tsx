import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { color, space, type } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { ReminderData, cancelReminder, getReminders, reminderWhenLabel } from '../lib/notify';
import { formatDateTime } from '../utils/dateUtils';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { IconButton } from '../components/ui/IconButton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/ui/Toast';

export const RemindersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setReminders(await getReminders());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const now = Date.now();
  const upcoming = reminders.filter((item) => new Date(item.launchTime).getTime() >= now);
  const past = reminders.filter((item) => new Date(item.launchTime).getTime() < now);
  const sections = [
    upcoming.length ? { title: 'Upcoming', data: upcoming, past: false } : null,
    past.length ? { title: 'Past', data: past, past: true } : null,
  ].filter(Boolean) as { title: string; data: ReminderData[]; past: boolean }[];

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.launchId}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={<ScreenHeader title="Reminders" />}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        renderItem={({ item, section }) => (
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.launchName}, ${formatDateTime(item.launchTime)}, ${reminderWhenLabel(item.reminderOffset)}`}
              onPress={() => navigation.navigate('LaunchDetails', { launchId: item.launchId })}
              style={({ pressed }) => [styles.main, pressed && styles.pressed]}
            >
              <Text style={styles.name} numberOfLines={2}>{item.launchName}</Text>
              <Text style={styles.when}>{formatDateTime(item.launchTime)}</Text>
              <Text style={styles.meta}>
                {section.past ? 'Reminder sent' : reminderWhenLabel(item.reminderOffset)}
              </Text>
            </Pressable>
            {section.past ? null : (
              <IconButton
                name="close"
                accessibilityLabel="Cancel reminder"
                onPress={async () => {
                  await cancelReminder(item.launchId);
                  setReminders((current) => current.filter((reminder) => reminder.launchId !== item.launchId));
                  showToast('Reminder canceled');
                }}
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No reminders"
            message="Open a launch and tap Remind me."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={color.text}
            colors={[color.text]}
            progressBackgroundColor={color.bg}
          />
        }
        contentContainerStyle={styles.content}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: space.s24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.s20,
    paddingRight: space.s8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
  },
  main: {
    flex: 1,
    paddingVertical: space.s12,
    minHeight: 64,
    gap: 2,
  },
  pressed: { backgroundColor: color.bgMuted },
  name: { ...type.headline, color: color.text },
  when: { ...type.subhead, color: color.text, fontVariant: ['tabular-nums'] },
  meta: { ...type.footnote, color: color.textTertiary },
});
