import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.OS === 'ios' ? {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        } : {
          backgroundColor: Colors.cardSolid,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarBackground: Platform.OS === 'ios' ? () => (
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            }}
          />
        ) : undefined,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
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

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
            color: Colors.text,
          },
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

