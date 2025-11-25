import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const REMINDERS_KEY = 'launch_reminders';
const FOLLOWED_PROVIDERS_KEY = 'followed_providers';

export interface ReminderData {
  launchId: string;
  launchName: string;
  scheduledTime: string;
  reminderOffset: number; // minutes before launch
}

export interface FollowedProvider {
  providerId: string;
  providerName: string;
}

// Request notification permissions
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('launch-reminders', {
        name: 'Launch Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A9EFF',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Schedule a reminder for a launch
export async function scheduleReminder(
  launchId: string,
  launchName: string,
  launchDate: string,
  offsetMinutes: number
): Promise<string | null> {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    const launchTime = new Date(launchDate);
    const reminderTime = new Date(launchTime.getTime() - offsetMinutes * 60 * 1000);

    // Check if reminder already exists and cancel it first to avoid duplicates
    const existingReminders = await getReminders();
    const existingReminder = existingReminders.find(r => r.launchId === launchId);
    
    if (existingReminder) {
      await cancelReminder(launchId);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚀 Launch Reminder',
        body: `${launchName} is launching in ${offsetMinutes} minute${offsetMinutes !== 1 ? 's' : ''}!`,
        data: { launchId, launchName, launchDate },
        sound: true,
      },
      trigger: reminderTime,
    });

    // Save reminder metadata
    try {
      const reminders = await getReminders();
      const reminderData: ReminderData = {
        launchId,
        launchName,
        scheduledTime: reminderTime.toISOString(),
        reminderOffset: offsetMinutes,
      };
      reminders.push(reminderData);
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    } catch (storageError) {
      // Rollback notification if storage fails
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      throw storageError;
    }

    return notificationId;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    throw error;
  }
}

// Cancel a reminder for a launch
export async function cancelReminder(launchId: string): Promise<void> {
  try {
    const reminders = await getReminders();
    const reminder = reminders.find((r) => r.launchId === launchId);

    if (reminder) {
      // Get all scheduled notifications and find the one matching this launch
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notification = allNotifications.find(
        (n) => n.content.data?.launchId === launchId
      );

      if (notification) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      // Remove from storage
      const updatedReminders = reminders.filter((r) => r.launchId !== launchId);
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders));
    }
  } catch (error) {
    console.error('Error canceling reminder:', error);
    throw error;
  }
}

// Get all reminders
export async function getReminders(): Promise<ReminderData[]> {
  try {
    const stored = await AsyncStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting reminders:', error);
    return [];
  }
}

// Check if a launch has a reminder
export async function hasReminder(launchId: string): Promise<boolean> {
  const reminders = await getReminders();
  return reminders.some((r) => r.launchId === launchId);
}

// Follow a provider (auto-notify for future launches)
export async function followProvider(providerId: string, providerName: string): Promise<void> {
  try {
    const followed = await getFollowedProviders();
    if (!followed.some((p) => p.providerId === providerId)) {
      followed.push({ providerId, providerName });
      await AsyncStorage.setItem(FOLLOWED_PROVIDERS_KEY, JSON.stringify(followed));
    }
  } catch (error) {
    console.error('Error following provider:', error);
    throw error;
  }
}

// Unfollow a provider
export async function unfollowProvider(providerId: string): Promise<void> {
  try {
    const followed = await getFollowedProviders();
    const updated = followed.filter((p) => p.providerId !== providerId);
    await AsyncStorage.setItem(FOLLOWED_PROVIDERS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error unfollowing provider:', error);
    throw error;
  }
}

// Get all followed providers
export async function getFollowedProviders(): Promise<FollowedProvider[]> {
  try {
    const stored = await AsyncStorage.getItem(FOLLOWED_PROVIDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting followed providers:', error);
    return [];
  }
}

// Check if a provider is followed
export async function isProviderFollowed(providerId: string): Promise<boolean> {
  const followed = await getFollowedProviders();
  return followed.some((p) => p.providerId === providerId);
}

