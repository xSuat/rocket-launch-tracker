import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenNavigationProp } from '../types/navigation';
import { getReminders, cancelReminder, ReminderData, getFollowedProviders, unfollowProvider, FollowedProvider } from '../lib/notify';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { GlassCard } from '../components';
import { Colors } from '../constants/colors';
import { formatLaunchDate } from '../utils/dateUtils';

type NavigationProp = TabScreenNavigationProp<'Notifications'>;

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [followedProviders, setFollowedProviders] = useState<FollowedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setReminders(await getReminders());
      
      // Load followed providers
      const providers = await getFollowedProviders();
      setFollowedProviders(providers);
    } catch (error) {
      if (__DEV__) console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Only load on mount, not on every focus
  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // Refresh on focus only if we have data already (silent refresh)
  useFocusEffect(
    useCallback(() => {
      if (reminders.length > 0 || followedProviders.length > 0) {
        loadNotifications(false);
      }
    }, [reminders.length, followedProviders.length, loadNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleLaunchPress = (launchId: string) => {
    navigation.navigate('LaunchDetails', { launchId });
  };

  const handleCancelReminder = async (reminder: ReminderData) => {
    Alert.alert(
      'Cancel Reminder',
      `Cancel reminder for ${reminder.launchName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReminder(reminder.launchId);
              loadNotifications();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel reminder');
            }
          },
        },
      ]
    );
  };

  const handleUnfollowProvider = async (provider: FollowedProvider) => {
    Alert.alert(
      'Unfollow Provider',
      `Stop following ${provider.providerName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await unfollowProvider(provider.providerId);
              loadNotifications();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unfollow provider');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState message="Loading notifications..." />;
  }

  const hasReminders = reminders.length > 0;
  const hasProviders = followedProviders.length > 0;
  const hasAnyNotifications = hasReminders || hasProviders;

  const headerHeight = Math.max(insets.top, 16) + 80;

  if (!hasAnyNotifications) {
    return (
      <LinearGradient
        colors={Colors.backgroundGradient as any}
        style={styles.container}
      >
        {/* Fixed Blur Header Background */}
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.blurHeader, { height: headerHeight }]}
          />
        )}
        {Platform.OS === 'android' && (
          <View style={[styles.blurHeader, { height: headerHeight, backgroundColor: Colors.cardSolid }]} />
        )}

        {/* Fixed Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Your reminders and follows</Text>
          </View>
        </View>

        <ScrollView
          style={[styles.list, { marginTop: headerHeight }]}
          contentContainerStyle={styles.emptyContent}
        >
          <EmptyState
            title="No notifications yet"
            message="Set reminders for launches or follow providers to get notified about upcoming launches"
          />
        </ScrollView>
      </LinearGradient>
    );
  }

  const allItems: Array<{ type: 'reminder' | 'provider'; data: ReminderData | FollowedProvider }> = [
    ...reminders.map(r => ({ type: 'reminder' as const, data: r })),
    ...followedProviders.map(p => ({ type: 'provider' as const, data: p })),
  ];

  return (
    <LinearGradient
      colors={Colors.backgroundGradient as any}
      style={styles.container}
    >
      {/* Fixed Blur Header Background */}
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={20}
          tint="dark"
          style={[styles.blurHeader, { height: headerHeight }]}
        />
      )}
      {Platform.OS === 'android' && (
        <View style={[styles.blurHeader, { height: headerHeight, backgroundColor: Colors.cardSolid }]} />
      )}

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} • {followedProviders.length} provider{followedProviders.length !== 1 ? 's' : ''} followed
          </Text>
        </View>
      </View>

      <FlatList
        data={allItems}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        ListHeaderComponent={
          <GlassCard style={styles.noteCard}>
            <View style={styles.noteContent}>
              <MaterialCommunityIcons name="information" size={20} color={Colors.primary} />
              <View style={styles.noteText}>
                <Text style={styles.noteTitle}>About Notifications</Text>
                <Text style={styles.noteMessage}>
                  Reminders are notifications on this device, set for a launch you choose.
                  Following a provider only saves that preference on this device.
                </Text>
              </View>
            </View>
          </GlassCard>
        }
        renderItem={({ item }) => {
          if (item.type === 'reminder') {
            const reminder = item.data as ReminderData;
            const reminderTime = new Date(reminder.scheduledTime);

            return (
              <GlassCard style={styles.basicReminderCard} onPress={() => handleLaunchPress(reminder.launchId)}>
                <View style={styles.basicReminderContent}>
                  <MaterialIcons name="notifications" size={24} color={Colors.primary} />
                  <View style={styles.basicReminderText}>
                    <Text style={styles.basicReminderTitle}>{reminder.launchName}</Text>
                    <Text style={styles.basicReminderSubtitle}>
                      Reminder: {formatLaunchDate(reminderTime.toISOString())}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelReminder(reminder)}
                  >
                    <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          } else {
            const provider = item.data as FollowedProvider;
            return (
              <GlassCard style={styles.providerCard}>
                <View style={styles.providerContent}>
                  <View style={styles.providerIcon}>
                    <MaterialCommunityIcons name="rocket-launch" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.providerText}>
                    <Text style={styles.providerName}>{provider.providerName}</Text>
                    <Text style={styles.providerSubtitle}>Following for new launches</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.unfollowButton}
                    onPress={() => handleUnfollowProvider(provider)}
                  >
                    <Text style={styles.unfollowButtonText}>Unfollow</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          }
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressBackgroundColor={Colors.background}
          />
        }
        contentContainerStyle={styles.listContent}
        style={[styles.list, { marginTop: headerHeight }]}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 11,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 100,
  },
  reminderCard: {
    marginBottom: 16,
  },
  reminderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderInfoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 4,
  },
  basicReminderCard: {
    marginBottom: 16,
    padding: 16,
  },
  basicReminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  basicReminderText: {
    flex: 1,
  },
  basicReminderTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  basicReminderSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  providerCard: {
    marginBottom: 16,
    padding: 16,
  },
  providerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerText: {
    flex: 1,
  },
  providerName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  providerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  unfollowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unfollowButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  noteCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    backgroundColor: `${Colors.primary}10`,
  },
  noteContent: {
    flexDirection: 'row',
    gap: 12,
  },
  noteText: {
    flex: 1,
  },
  noteTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  noteMessage: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});

