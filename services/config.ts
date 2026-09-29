import Constants from 'expo-constants';

// API Configuration
const DEV_BASE_URL = 'https://lldev.thespacedevs.com/2.3.0';
const PROD_BASE_URL = 'https://ll.thespacedevs.com/2.3.0';

// NASA APIs
export const NASA_BASE_URL = 'https://api.nasa.gov';
export const NASA_NEO_URL = `${NASA_BASE_URL}/neo/rest/v1/feed`;
export const NASA_APOD_URL = `${NASA_BASE_URL}/planetary/apod`;

const readLl2Env = (): 'dev' | 'prod' | null => {
  const env = process.env.EXPO_PUBLIC_LL2_ENV;
  if (env === 'prod' || env === 'production') return 'prod';
  if (env === 'dev') return 'dev';
  return null;
};

// Development builds may override the endpoint from Settings. Store builds
// follow EXPO_PUBLIC_LL2_ENV, and use production when that variable is unset.
export const getApiEnv = async (): Promise<'dev' | 'prod'> => {
  if (__DEV__) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem('api_environment');
      if (stored === 'prod' || stored === 'dev') {
        return stored;
      }
    } catch {
      // ignore
    }
  }

  return readLl2Env() ?? (__DEV__ ? 'dev' : 'prod');
};

export const getApiEnvSync = (): 'dev' | 'prod' => {
  return readLl2Env() ?? (__DEV__ ? 'dev' : 'prod');
};

// Get Base URL (synchronous - uses env var, for initial setup)
export const getBaseUrl = (): string => {
  return getApiEnvSync() === 'prod' ? PROD_BASE_URL : DEV_BASE_URL;
};

// Get Base URL dynamically based on environment
export const getBaseUrlForEnv = (env: 'dev' | 'prod'): string => {
  return env === 'prod' ? PROD_BASE_URL : DEV_BASE_URL;
};

const NASA_KEY_PLACEHOLDERS = new Set([
  'demo_key',
  '<your_nasa_api_key_here>',
  'your_nasa_api_key_here',
  'your_api_key_here',
  'your_actual_api_key_here',
  'changeme',
  'placeholder',
]);

const readNasaKey = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('<') || trimmed.includes('>')) return null;
  if (NASA_KEY_PLACEHOLDERS.has(trimmed.toLowerCase())) return null;
  return trimmed;
};

export const getNasaApiKey = (): string => {
  return (
    readNasaKey(process.env.EXPO_PUBLIC_NASA_API_KEY) ||
    readNasaKey(Constants.expoConfig?.extra?.nasaApiKey) ||
    'DEMO_KEY'
  );
};

// Cache Config
export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const STALE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (allow stale data for up to a day if offline)
