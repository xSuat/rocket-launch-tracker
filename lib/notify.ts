import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDuration, formatRelative } from '../utils/dateUtils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDERS_KEY = 'launch_reminders';

export interface ReminderData {
  launchId: string;
  launchName: string;
  launchTime: string;
  scheduledTime: string;
  reminderOffset: number;
}

export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('launch-reminders', {
        name: 'Launch Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFFFFF',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function scheduleReminder(
  launchId: string,
  launchName: string,
  launchDate: string,
  offsetMinutes: number
): Promise<string | null> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }

  const launchTime = new Date(launchDate);
  const reminderTime = new Date(launchTime.getTime() - offsetMinutes * 60 * 1000);
  if (reminderTime.getTime() <= Date.now()) {
    throw new Error('That reminder time has already passed');
  }

  await cancelReminder(launchId);

  const relative = formatRelative(launchDate);
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Launch reminder',
      body: `${launchName} launches ${relative}.`,
      data: { launchId, launchName, launchDate },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });

  try {
    const reminders = await getReminders();
    const reminderData: ReminderData = {
      launchId,
      launchName,
      launchTime: launchTime.toISOString(),
      scheduledTime: reminderTime.toISOString(),
      reminderOffset: offsetMinutes,
    };
    reminders.push(reminderData);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (storageError) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    throw storageError;
  }

  return notificationId;
}

export async function cancelReminder(launchId: string): Promise<void> {
  const reminders = await getReminders();
  const reminder = reminders.find((item) => item.launchId === launchId);
  if (!reminder) return;

  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const notification = allNotifications.find((item) => item.content.data?.launchId === launchId);
  if (notification) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }

  const updatedReminders = reminders.filter((item) => item.launchId !== launchId);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders));
}

export async function getReminders(): Promise<ReminderData[]> {
  try {
    const stored = await AsyncStorage.getItem(REMINDERS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      launchTime: item.launchTime || item.scheduledTime,
    }));
  } catch (error) {
    console.error('Error getting reminders:', error);
    return [];
  }
}

export async function hasReminder(launchId: string): Promise<boolean> {
  const reminders = await getReminders();
  return reminders.some((item) => item.launchId === launchId);
}

export function reminderWhenLabel(offsetMinutes: number): string {
  return `${formatDuration(offsetMinutes)} before`;
}
