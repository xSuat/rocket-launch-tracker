import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  MainTabs: undefined;
  LaunchDetails: { launchId: string };
  Settings: undefined;
  RocketDetails: { rocketId: number };
  Rockets: undefined;
  SpaceEventsCalendar: undefined;
};

export type TabParamList = {
  Upcoming: undefined;
  History: undefined;
  Favorites: undefined;
  Calendar: undefined;
  NASAImages: undefined;
  Notifications: undefined;
};

export type TabScreenNavigationProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

