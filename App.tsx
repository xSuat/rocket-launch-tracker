import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppProvider } from './context/AppContext';
import { AppNavigator } from './navigation/AppNavigator';
import { SkyBackground } from './components/sky/SkyBackground';
import { ToastProvider } from './components/ui/Toast';
import { openLaunch } from './navigation/navigationRef';

function launchIdFromResponse(response: Notifications.NotificationResponse | null | undefined) {
  const id = response?.notification.request.content.data?.launchId;
  return typeof id === 'string' ? id : null;
}

export default function App() {
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const launchId = launchIdFromResponse(response);
      if (launchId) openLaunch(launchId);
    });

    let cancelled = false;
    let coldStartTimer: ReturnType<typeof setInterval> | undefined;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const launchId = launchIdFromResponse(response);
      if (!launchId || cancelled) return;
      let tries = 0;
      coldStartTimer = setInterval(() => {
        tries += 1;
        if (openLaunch(launchId) || tries > 12) {
          if (coldStartTimer) clearInterval(coldStartTimer);
        }
      }, 250);
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (coldStartTimer) clearInterval(coldStartTimer);
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <AppProvider>
      <ToastProvider>
        <View style={styles.container}>
          <SkyBackground />
          <StatusBar style="light" />
          <AppNavigator />
        </View>
      </ToastProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
