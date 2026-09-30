import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function openLaunch(launchId: string): boolean {
  if (!launchId || !navigationRef.isReady()) return false;
  navigationRef.navigate('LaunchDetails', { launchId });
  return true;
}
