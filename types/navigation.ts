import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  MainTabs: undefined;
  LaunchDetails: { launchId: string };
  Settings: undefined;
};

export type TabParamList = {
  Launches: undefined;
  Favorites: undefined;
  Events: undefined;
  Gallery: undefined;
  Reminders: undefined;
};

export type TabScreenNavigationProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;
