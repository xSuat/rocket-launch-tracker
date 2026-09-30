import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { color, type } from '../constants/theme';
import { UpcomingLaunchesScreen } from '../screens/UpcomingLaunchesScreen';
import { HistoricalLaunchesScreen } from '../screens/HistoricalLaunchesScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { LaunchDetailsScreen } from '../screens/LaunchDetailsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RocketsScreen } from '../screens/RocketsScreen';
import { RocketDetailsScreen } from '../screens/RocketDetailsScreen';
import { SpaceEventsCalendarScreen } from '../screens/SpaceEventsCalendarScreen';
import { GalleryScreen } from '../screens/GalleryScreen';
import { RootStackParamList, TabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
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
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.15}
            style={[type.tabLabel, { color: labelColor }]}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tab.Screen
        name="Upcoming"
        component={UpcomingLaunchesScreen}
        options={{
          title: 'Launches',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="rocket-launch" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoricalLaunchesScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="book-open-variant" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="heart" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={SpaceEventsCalendarScreen}
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-month" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="NASAImages"
        component={GalleryScreen}
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="image-multiple-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bell" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

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

export const AppNavigator = () => {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: color.bg,
          },
          headerShadowVisible: false,
          headerTintColor: color.text,
          headerTitleStyle: {
            ...type.headline,
            color: color.text,
          },
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Rockets"
          component={RocketsScreen}
          options={{
            title: 'Rockets',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="LaunchDetails"
          component={LaunchDetailsScreen}
          options={{
            title: 'Launch Details',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="RocketDetails"
          component={RocketDetailsScreen}
          options={{
            title: 'Rocket Details',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: false,
            presentation: 'card',
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

