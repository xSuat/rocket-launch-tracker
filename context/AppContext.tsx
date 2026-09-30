import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Launch } from '../types';
import { getApiEnvSync } from '../services/config';

interface AppContextType {
  favorites: string[];
  addFavorite: (launchId: string) => Promise<void>;
  removeFavorite: (launchId: string) => Promise<void>;
  isFavorite: (launchId: string) => boolean;
  favoriteLaunches: Launch[];
  setFavoriteLaunches: (launches: Launch[]) => void;
  defaultMapApp: string | null;
  setDefaultMapApp: (appId: string | null) => Promise<void>;
  apiEnvironment: 'dev' | 'prod';
  setApiEnvironment: (env: 'dev' | 'prod') => Promise<void>;
  showDataSourceLabels: boolean;
  setShowDataSourceLabels: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FAVORITES_KEY = 'favorite_launches';
const DEFAULT_MAP_APP_KEY = 'default_map_app';
const SHOW_DATA_SOURCE_LABELS_KEY = 'show_data_source_labels';
const API_ENVIRONMENT_KEY = 'api_environment';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteLaunches, setFavoriteLaunches] = useState<Launch[]>([]);
  const [defaultMapApp, setDefaultMapAppState] = useState<string | null>(null);
  const [apiEnvironment, setApiEnvironmentState] = useState<'dev' | 'prod'>(getApiEnvSync());
  const [showDataSourceLabels, setShowDataSourceLabelsState] = useState(false);

  useEffect(() => {
    loadFavorites();
    loadSettings();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const addFavorite = useCallback(async (launchId: string) => {
    setFavorites((current) => {
      if (current.includes(launchId)) return current;
      const next = [...current, launchId];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch((error) => {
        console.error('Error saving favorites:', error);
      });
      return next;
    });
  }, []);

  const removeFavorite = useCallback(async (launchId: string) => {
    setFavorites((current) => {
      const next = current.filter((id) => id !== launchId);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch((error) => {
        console.error('Error saving favorites:', error);
      });
      return next;
    });
    setFavoriteLaunches((current) => current.filter((launch) => launch.id !== launchId));
  }, []);

  const isFavorite = useCallback((launchId: string) => favorites.includes(launchId), [favorites]);

  const loadSettings = async () => {
    try {
      const [mapApp, dataSourceLabels, apiEnv] = await Promise.all([
        AsyncStorage.getItem(DEFAULT_MAP_APP_KEY),
        AsyncStorage.getItem(SHOW_DATA_SOURCE_LABELS_KEY),
        AsyncStorage.getItem(API_ENVIRONMENT_KEY),
      ]);
      if (mapApp) setDefaultMapAppState(mapApp);
      if (dataSourceLabels !== null) setShowDataSourceLabelsState(dataSourceLabels === 'true');
      if (__DEV__ && (apiEnv === 'prod' || apiEnv === 'dev')) {
        setApiEnvironmentState(apiEnv);
        const { launchAPI } = require('../services/api');
        launchAPI.updateBaseUrl(apiEnv);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const setDefaultMapApp = useCallback(async (appId: string | null) => {
    if (appId) await AsyncStorage.setItem(DEFAULT_MAP_APP_KEY, appId);
    else await AsyncStorage.removeItem(DEFAULT_MAP_APP_KEY);
    setDefaultMapAppState(appId);
  }, []);

  const setShowDataSourceLabels = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem(SHOW_DATA_SOURCE_LABELS_KEY, String(enabled));
    setShowDataSourceLabelsState(enabled);
  }, []);

  const setApiEnvironment = useCallback(async (env: 'dev' | 'prod') => {
    await AsyncStorage.setItem(API_ENVIRONMENT_KEY, env);
    setApiEnvironmentState(env);
    const { launchAPI } = require('../services/api');
    launchAPI.updateBaseUrl(env);
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      favoriteLaunches,
      setFavoriteLaunches,
      defaultMapApp,
      setDefaultMapApp,
      apiEnvironment,
      setApiEnvironment,
      showDataSourceLabels,
      setShowDataSourceLabels,
    }),
    [
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      favoriteLaunches,
      defaultMapApp,
      setDefaultMapApp,
      apiEnvironment,
      setApiEnvironment,
      showDataSourceLabels,
      setShowDataSourceLabels,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
