import { Linking, Platform } from 'react-native';

export interface MapApp {
  id: string;
  name: string;
  scheme: string;
  url: (lat: string, lng: string) => string;
}

export const MAP_APPS: MapApp[] = [
  {
    id: 'google-maps',
    name: 'Google Maps',
    scheme: Platform.OS === 'ios' ? 'comgooglemaps://' : 'geo:',
    url: (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`,
  },
  {
    id: 'apple-maps',
    name: 'Apple Maps',
    scheme: 'http://maps.apple.com/',
    url: (lat, lng) => `http://maps.apple.com/?q=${lat},${lng}`,
  },
  {
    id: 'waze',
    name: 'Waze',
    scheme: 'waze://',
    url: (lat, lng) => `waze://?ll=${lat},${lng}&navigate=yes`,
  },
];

/**
 * Check which map apps are available on the device
 * Always returns at least Google Maps (web) as a fallback
 */
export const getAvailableMapApps = async (): Promise<MapApp[]> => {
  const availableApps: MapApp[] = [];

  // Always include Google Maps web as a guaranteed option
  availableApps.push(MAP_APPS[0]);

  // Check for other native apps
  for (let i = 1; i < MAP_APPS.length; i++) {
    const app = MAP_APPS[i];
    try {
      const canOpen = await Linking.canOpenURL(app.scheme);
      if (canOpen) {
        // Only add if not already added (avoid duplicates)
        if (!availableApps.find(a => a.id === app.id)) {
          availableApps.push(app);
        }
      }
    } catch (error) {
      // Silently continue - we already have Google Maps as fallback
    }
  }

  return availableApps;
};

/**
 * Get URL for a specific map app
 */
export const getMapAppUrl = (appId: string, latitude: string, longitude: string): string | null => {
  const app = MAP_APPS.find((a) => a.id === appId);
  if (!app) return null;
  return app.url(latitude, longitude);
};

/**
 * Open coordinates in a specific map app
 */
export const openMapApp = async (appId: string, latitude: string, longitude: string): Promise<boolean> => {
  const url = getMapAppUrl(appId, latitude, longitude);
  if (!url) return false;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
  } catch (error) {
    if (__DEV__) console.error('Error opening map app:', error);
  }

  return false;
};

/**
 * Open coordinates with map selection logic
 * Shows modal if defaultMapApp is null/empty, otherwise opens default app
 */
export const openLocationInMaps = async (
  latitude: string,
  longitude: string,
  defaultMapApp: string | null | undefined,
  onShowModal: () => void
): Promise<boolean> => {
  // If "Ask each time" is selected, show modal
  if (!defaultMapApp || defaultMapApp === '' || defaultMapApp === null || defaultMapApp === undefined) {
    const availableApps = await getAvailableMapApps();
    if (availableApps.length > 0) {
      onShowModal();
      return true;
    }
    // Fallback to web if no apps
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    try {
      await Linking.openURL(mapsUrl);
      return true;
    } catch {
      return false;
    }
  }

  // If default app is set, try to open it
  const success = await openMapApp(defaultMapApp, latitude, longitude);
  if (success) return true;

  // If default app failed, show modal as fallback
  const availableApps = await getAvailableMapApps();
  if (availableApps.length > 0) {
    onShowModal();
    return true;
  }

  // Final fallback to web
  const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  try {
    await Linking.openURL(mapsUrl);
    return true;
  } catch {
    return false;
  }
};

















