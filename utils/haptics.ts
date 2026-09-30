import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

async function run(action: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    await action();
  } catch {
    // Haptics are optional feedback.
  }
}

export function hapticSelection() {
  return run(() => Haptics.selectionAsync());
}

export function hapticFavorite() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticSuccess() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
