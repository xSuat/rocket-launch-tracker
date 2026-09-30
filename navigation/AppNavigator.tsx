import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { color, type } from '../constants/theme';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { navigationRef } from './navigationRef';
import { LaunchesScreen } from '../screens/LaunchesScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { LaunchDetailsScreen } from '../screens/LaunchDetailsScreen';
import { RemindersScreen } from '../screens/RemindersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SpaceEventsCalendarScreen } from '../screens/SpaceEventsCalendarScreen';
import { GalleryScreen } from '../screens/GalleryScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: color.text,
    background: 'transparent',
    card: color.bg,
    text: color.text,
    border: color.hairline,
    notification: color.text,
  },
};

const linking = {
  prefixes: [Linking.createURL('/'), 'rocket-launch-tracker://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Launches: 'launches',
          Favorites: 'favorites',
          Events: 'events',
          Gallery: 'gallery',
          Reminders: 'reminders',
        },
      },
      LaunchDetails: 'launch/:launchId',
      Settings: 'settings',
    },
  },
};

function tabIcon(outline: keyof typeof Ionicons.glyphMap, filled: keyof typeof Ionicons.glyphMap, focused: boolean, tint: string) {
  return <Ionicons name={focused ? filled : outline} size={22} color={tint} />;
}

const TabNavigator = () => (
  <Tab.Navigator
    sceneContainerStyle={{ backgroundColor: 'transparent' }}
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: Platform.OS === 'android',
      tabBarStyle: {
        backgroundColor: color.bg,
        borderTopColor: color.hairline,
        borderTopWidth: StyleSheet.hairlineWidth,
        elevation: 0,
      },
      tabBarActiveTintColor: color.text,
      tabBarInactiveTintColor: color.textTertiary,
      tabBarAllowFontScaling: true,
      tabBarLabel: ({ color: labelColor, children }) => (
        <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[type.tabLabel, { color: labelColor }]}>
          {children}
        </Text>
      ),
    }}
  >
    <Tab.Screen
      name="Launches"
      component={LaunchesScreen}
      options={{
        tabBarIcon: ({ color: tint, focused }) => tabIcon('rocket-outline', 'rocket', focused, tint),
      }}
    />
    <Tab.Screen
      name="Favorites"
      component={FavoritesScreen}
      options={{
        tabBarIcon: ({ color: tint, focused }) => tabIcon('heart-outline', 'heart', focused, tint),
      }}
    />
    <Tab.Screen
      name="Events"
      component={SpaceEventsCalendarScreen}
      options={{
        tabBarIcon: ({ color: tint, focused }) => tabIcon('calendar-outline', 'calendar', focused, tint),
      }}
    />
    <Tab.Screen
      name="Gallery"
      component={GalleryScreen}
      options={{
        tabBarIcon: ({ color: tint, focused }) => tabIcon('images-outline', 'images', focused, tint),
      }}
    />
    <Tab.Screen
      name="Reminders"
      component={RemindersScreen}
      options={{
        tabBarIcon: ({ color: tint, focused }) => tabIcon('notifications-outline', 'notifications', focused, tint),
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => (
  <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: color.bg },
        headerShadowVisible: false,
        headerTintColor: color.text,
        headerTitleStyle: { ...type.headline, color: color.text },
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="LaunchDetails" component={LaunchDetailsScreen} options={{ title: 'Launch' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
