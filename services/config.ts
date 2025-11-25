import Constants from 'expo-constants';

// API Configuration
const DEV_BASE_URL = 'https://lldev.thespacedevs.com/2.3.0';
const PROD_BASE_URL = 'https://ll.thespacedevs.com/2.3.0';

// NASA APIs
export const NASA_BASE_URL = 'https://api.nasa.gov';
export const NASA_NEO_URL = `${NASA_BASE_URL}/neo/rest/v1/feed`;
export const NASA_APOD_URL = `${NASA_BASE_URL}/planetary/apod`;

// ISS APIs
export const ISS_NOTIFY_URL = 'https://api.open-notify.org/iss-pass.json';

// Get API Environment
// First checks AsyncStorage for user preference, then falls back to env variable
// If not set, defaults to 'dev' (safer for development to avoid using prod quota)
export const getApiEnv = async (): Promise<'dev' | 'prod'> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem('api_environment');
    if (stored === 'prod' || stored === 'dev') {
      return stored;
    }
  } catch (e) {
    // ignore
  }
  
  // Fallback to environment variable
  const env = process.env.EXPO_PUBLIC_LL2_ENV;
  return env === 'prod' || env === 'production' ? 'prod' : 'dev';
};

// Synchronous version for initial load (uses env var only)
export const getApiEnvSync = (): 'dev' | 'prod' => {
  const env = process.env.EXPO_PUBLIC_LL2_ENV;
  return env === 'prod' || env === 'production' ? 'prod' : 'dev';
};

// Get Base URL (synchronous - uses env var, for initial setup)
export const getBaseUrl = (): string => {
  return getApiEnvSync() === 'prod' ? PROD_BASE_URL : DEV_BASE_URL;
};

// Get Base URL dynamically based on environment
export const getBaseUrlForEnv = (env: 'dev' | 'prod'): string => {
  return env === 'prod' ? PROD_BASE_URL : DEV_BASE_URL;
};

// NASA Config
export const getNasaApiKey = (): string => {
  return process.env.EXPO_PUBLIC_NASA_API_KEY || Constants.expoConfig?.extra?.nasaApiKey || 'DEMO_KEY';
};

// Cache Config
export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const STALE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (allow stale data for up to a day if offline)
