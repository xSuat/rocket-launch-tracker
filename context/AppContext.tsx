import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Launch } from '../types';
import { getFollowedProviders, followProvider, unfollowProvider, isProviderFollowed } from '../lib/notify';
import { startLocationTracking, stopLocationTracking, LocationSubscription } from '../utils/locationUtils';
import { getApiEnv } from '../services/config';

interface FollowedProvider {
  providerId: string;
  providerName: string;
}

interface AppContextType {
  favorites: string[];
  addFavorite: (launchId: string) => Promise<void>;
  removeFavorite: (launchId: string) => Promise<void>;
  isFavorite: (launchId: string) => boolean;
  favoriteLaunches: Launch[];
  setFavoriteLaunches: (launches: Launch[]) => void;
  // Settings
  defaultMapApp: string | null;
  setDefaultMapApp: (appId: string | null) => Promise<void>;
  apiEnvironment: 'dev' | 'prod';
  setApiEnvironment: (env: 'dev' | 'prod') => Promise<void>;
  // Notifications
  followedProviders: FollowedProvider[];
  loadFollowedProviders: () => Promise<void>;
  toggleProviderFollow: (providerId: string, providerName: string) => Promise<void>;
  isProviderFollowed: (providerId: string) => boolean;
  // Location tracking
  locationTrackingEnabled: boolean;
  setLocationTrackingEnabled: (enabled: boolean) => Promise<void>;
  currentLocation: { latitude: number; longitude: number } | null;
  currentLocationName: string | null;
  // Data source labels
  showDataSourceLabels: boolean;
  setShowDataSourceLabels: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FAVORITES_KEY = 'favorite_launches';
const DEFAULT_MAP_APP_KEY = 'default_map_app';
const LOCATION_TRACKING_ENABLED_KEY = 'location_tracking_enabled';
const SHOW_DATA_SOURCE_LABELS_KEY = 'show_data_source_labels';
const API_ENVIRONMENT_KEY = 'api_environment';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteLaunches, setFavoriteLaunches] = useState<Launch[]>([]);
  const [defaultMapApp, setDefaultMapAppState] = useState<string | null>(null);
  const [apiEnvironment, setApiEnvironmentState] = useState<'dev' | 'prod'>(getApiEnv());
  const [followedProviders, setFollowedProviders] = useState<FollowedProvider[]>([]);
  const [locationTrackingEnabled, setLocationTrackingEnabledState] = useState<boolean>(true);
  const [showDataSourceLabels, setShowDataSourceLabelsState] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string | null>(null);
  const locationSubscriptionRef = useRef<LocationSubscription | null>(null);

  useEffect(() => {
    loadFavorites();
    loadSettings();
    loadFollowedProviders();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favoriteIds = JSON.parse(stored);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const addFavorite = async (launchId: string) => {
    if (!favorites.includes(launchId)) {
      await saveFavorites([...favorites, launchId]);
    }
  };

  const removeFavorite = async (launchId: string) => {
    await saveFavorites(favorites.filter((id) => id !== launchId));
    setFavoriteLaunches(favoriteLaunches.filter((launch) => launch.id !== launchId));
  };

  const isFavorite = (launchId: string): boolean => {
    return favorites.includes(launchId);
  };

  const loadSettings = async () => {
    try {
      const [mapApp, locationTracking, dataSourceLabels, apiEnv] = await Promise.all([
        AsyncStorage.getItem(DEFAULT_MAP_APP_KEY),
        AsyncStorage.getItem(LOCATION_TRACKING_ENABLED_KEY),
        AsyncStorage.getItem(SHOW_DATA_SOURCE_LABELS_KEY),
        AsyncStorage.getItem(API_ENVIRONMENT_KEY),
      ]);
      if (mapApp) {
        setDefaultMapAppState(mapApp);
      }
      if (locationTracking !== null) {
        setLocationTrackingEnabledState(locationTracking === 'true');
      }
      if (dataSourceLabels !== null) {
        setShowDataSourceLabelsState(dataSourceLabels === 'true');
      }
      if (apiEnv === 'prod' || apiEnv === 'dev') {
        setApiEnvironmentState(apiEnv);
        // Update API client base URL when loading saved environment
        const { launchAPI } = require('../services/api');
        launchAPI.updateBaseUrl(apiEnv);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const setDefaultMapApp = async (appId: string | null) => {
    try {
      if (appId) {
        await AsyncStorage.setItem(DEFAULT_MAP_APP_KEY, appId);
      } else {
        await AsyncStorage.removeItem(DEFAULT_MAP_APP_KEY);
      }
      setDefaultMapAppState(appId);
    } catch (error) {
      console.error('Error saving default map app:', error);
    }
  };

  const loadFollowedProviders = async () => {
    try {
      const providers = await getFollowedProviders();
      setFollowedProviders(providers);
    } catch (error) {
      console.error('Error loading followed providers:', error);
    }
  };

  const toggleProviderFollow = async (providerId: string, providerName: string) => {
    try {
      const isFollowed = await isProviderFollowed(providerId);
      if (isFollowed) {
        await unfollowProvider(providerId);
      } else {
        await followProvider(providerId, providerName);
      }
      await loadFollowedProviders();
    } catch (error) {
      console.error('Error toggling provider follow:', error);
    }
  };

  const isProviderFollowedContext = (providerId: string): boolean => {
    return followedProviders.some((p) => p.providerId === providerId);
  };

  const setLocationTrackingEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(LOCATION_TRACKING_ENABLED_KEY, String(enabled));
      setLocationTrackingEnabledState(enabled);
    } catch (error) {
      console.error('Error saving location tracking setting:', error);
    }
  };

  const setShowDataSourceLabels = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SHOW_DATA_SOURCE_LABELS_KEY, String(enabled));
      setShowDataSourceLabelsState(enabled);
    } catch (error) {
      console.error('Error saving data source labels setting:', error);
    }
  };

  const setApiEnvironment = async (env: 'dev' | 'prod') => {
    try {
      await AsyncStorage.setItem(API_ENVIRONMENT_KEY, env);
      setApiEnvironmentState(env);
      
      // Update API client base URL (caches are environment-specific, so no need to clear)
      const { launchAPI } = require('../services/api');
      launchAPI.updateBaseUrl(env);
    } catch (error) {
      console.error('Error saving API environment setting:', error);
    }
  };

  // Start/stop location tracking based on setting
  useEffect(() => {
    const manageLocationTracking = async () => {
      // Stop existing tracking
      if (locationSubscriptionRef.current) {
        stopLocationTracking(locationSubscriptionRef.current);
        locationSubscriptionRef.current = null;
      }

      // Start tracking if enabled
      if (locationTrackingEnabled) {
        const subscription = await startLocationTracking((location) => {
          setCurrentLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          setCurrentLocationName(location.locationName);
        });
        locationSubscriptionRef.current = subscription;
      } else {
        // Clear location when tracking is disabled
        setCurrentLocation(null);
        setCurrentLocationName(null);
      }
    };

    manageLocationTracking();

    // Cleanup on unmount
    return () => {
      if (locationSubscriptionRef.current) {
        stopLocationTracking(locationSubscriptionRef.current);
        locationSubscriptionRef.current = null;
      }
    };
  }, [locationTrackingEnabled]);

  return (
    <AppContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        favoriteLaunches,
        setFavoriteLaunches,
        defaultMapApp,
        setDefaultMapApp,
        apiEnvironment,
        followedProviders,
        loadFollowedProviders,
        toggleProviderFollow,
        isProviderFollowed: isProviderFollowedContext,
        locationTrackingEnabled,
        setLocationTrackingEnabled,
        currentLocation,
        currentLocationName,
        showDataSourceLabels,
        setShowDataSourceLabels,
        setApiEnvironment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

