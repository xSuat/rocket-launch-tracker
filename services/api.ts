import axios, { AxiosInstance } from 'axios';
import { Launch, LaunchResponse, LaunchFilters } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl, getBaseUrlForEnv, getApiEnvSync, CACHE_TTL_MS } from './config';
import { memoryCache } from './cache';

// Helper to normalize Launch objects with source field
const normalizeLaunch = (launch: Launch): Launch => ({
  ...launch,
  source: 'LL2' as const,
});

const normalizeLaunchResponse = (response: LaunchResponse): LaunchResponse => ({
  ...response,
  results: response.results.map(normalizeLaunch),
});

const CACHE_PREFIX = 'launch_cache_';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 10000;
const API_TIMEOUT = 20000;
const SPACEX_API_TIMEOUT = 10000;

class LaunchAPI {
  private client: AxiosInstance;
  private currentEnv: 'dev' | 'prod';

  constructor() {
    // Initialize with default (will be updated when settings load)
    this.currentEnv = getApiEnvSync();
    this.client = axios.create({
      baseURL: getBaseUrl(),
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Get cache prefix with environment
  private getCachePrefix(): string {
    return `${CACHE_PREFIX}${this.currentEnv}_`;
  }

  // Update base URL when environment changes
  updateBaseUrl(env: 'dev' | 'prod'): void {
    if (this.currentEnv !== env) {
      this.currentEnv = env;
      this.client.defaults.baseURL = getBaseUrlForEnv(env);
      // Clear any cached interceptors or request config
      this.client.interceptors.request.clear();
      this.client.interceptors.response.clear();
    }
  }

  // Helper to build query string
  private buildQueryString(filters: LaunchFilters): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      
      if (Array.isArray(value)) {
        value
          .filter((item) => item !== undefined && item !== null && item !== '')
          .forEach((item) => params.append(key, String(item)));
        return;
      }
      
      params.append(key, String(value));
    });
    return params.toString();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<any>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        if (retries > 0) {
          const retryAfter = error.response?.headers?.['retry-after'];
          const waitTime = retryAfter 
            ? Math.min(parseInt(retryAfter) * 1000, MAX_RETRY_DELAY)
            : Math.min(INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries), MAX_RETRY_DELAY);

          await this.sleep(waitTime);
          return this.makeRequestWithRetry(requestFn, retries - 1);
        }
      }

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        if (retries > 0) {
          const waitTime = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries), MAX_RETRY_DELAY);
          await this.sleep(waitTime);
          return this.makeRequestWithRetry(requestFn, retries - 1);
        }
      }

      throw error;
    }
  }

  // Get cached data from AsyncStorage (for immediate display)
  private async getCachedDataFromStorage<T>(cacheKey: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Update memory cache for faster future access
        memoryCache.set(cacheKey, data);
        return data;
      }
    } catch (e) {
      if (__DEV__) console.warn('Error reading from persistent cache', e);
    }
    return null;
  }

  // Generic cache wrapper
  private async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    if (!useCache) return fetchFn();

    const cacheKey = `${this.getCachePrefix()}${key}`;

    // 1. Check Memory Cache (Fastest)
    const memoryData = memoryCache.get<T>(cacheKey);
    if (memoryData) {
      return memoryData;
    }

    // 2. Check Persistent Cache (AsyncStorage) - return immediately if found
    const cachedData = await this.getCachedDataFromStorage<T>(cacheKey);
    if (cachedData) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // If fresh, return immediately
        if (age < CACHE_TTL_MS) {
          return cachedData;
        }
        // If stale, return it anyway (stale-while-revalidate pattern)
        // Fresh data will be fetched in background and update the cache
        return cachedData;
      }
    }

    // 3. Fetch from API (no cache available)
    try {
      const data = await fetchFn();
      
      // Update caches (data is already normalized in fetchFn for Launch/LaunchResponse)
      memoryCache.set(cacheKey, data);
      AsyncStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() })).catch(e => {
        if (__DEV__) console.warn('Error writing to persistent cache', e);
      });
      
      return data;
    } catch (error: any) {
      // 4. Fallback to stale cache on error
      if (cachedData) {
        if (__DEV__) console.warn('Using stale cache due to API error');
        return cachedData;
      }
      
      throw error;
    }
  }

  // Cache key helpers (environment is included via getCachePrefix)
  private getUpcomingLaunchesCacheKey(filters: LaunchFilters): string {
    return `upcoming_${JSON.stringify(filters)}`;
  }

  private getPastLaunchesCacheKey(filters: LaunchFilters): string {
    return `past_${JSON.stringify(filters)}`;
  }

  // Public access to cache for background refresh patterns
  async getCachedUpcomingLaunches(filters: LaunchFilters): Promise<{ data: LaunchResponse | null, isStale: boolean }> {
    const key = this.getUpcomingLaunchesCacheKey(filters);
    const cacheKey = `${this.getCachePrefix()}${key}`;
    
    // Check memory cache first
    const memoryResult = memoryCache.getWithMeta<LaunchResponse>(cacheKey);
    if (memoryResult.data) {
      return memoryResult;
    }
    
    // Check AsyncStorage
    const cachedData = await this.getCachedDataFromStorage<LaunchResponse>(cacheKey);
    if (cachedData) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          return { data: cachedData, isStale: age >= CACHE_TTL_MS };
        }
      } catch (e) {
        // ignore
      }
    }
    
    return { data: null, isStale: false };
  }

  async getCachedPastLaunches(filters: LaunchFilters): Promise<{ data: LaunchResponse | null, isStale: boolean }> {
    const key = this.getPastLaunchesCacheKey(filters);
    const cacheKey = `${this.getCachePrefix()}${key}`;
    
    // Check memory cache first
    const memoryResult = memoryCache.getWithMeta<LaunchResponse>(cacheKey);
    if (memoryResult.data) {
      return memoryResult;
    }
    
    // Check AsyncStorage
    const cachedData = await this.getCachedDataFromStorage<LaunchResponse>(cacheKey);
    if (cachedData) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          return { data: cachedData, isStale: age >= CACHE_TTL_MS };
        }
      } catch (e) {
        // ignore
      }
    }
    
    return { data: null, isStale: false };
  }

  async getUpcomingLaunches(filters: LaunchFilters = {}, useCache: boolean = true): Promise<LaunchResponse> {
    const response = await this.fetchWithCache<LaunchResponse>(
      this.getUpcomingLaunchesCacheKey(filters),
      async () => {
        const queryString = this.buildQueryString({
          ...filters,
          ordering: filters.ordering || 'net',
          limit: filters.limit || 20,
        });
        const rawResponse = await this.makeRequestWithRetry<LaunchResponse>(() => this.client.get(`/launches/upcoming/?${queryString}`));
        return normalizeLaunchResponse(rawResponse);
      },
      useCache
    );
    // Response is already normalized (either from cache or from fetchFn)
    return response;
  }

  async getPastLaunches(filters: LaunchFilters = {}, useCache: boolean = true): Promise<LaunchResponse> {
    const response = await this.fetchWithCache<LaunchResponse>(
      this.getPastLaunchesCacheKey(filters),
      async () => {
        const queryString = this.buildQueryString({
          ...filters,
          ordering: filters.ordering || '-net',
          limit: filters.limit || 20,
        });
        const rawResponse = await this.makeRequestWithRetry<LaunchResponse>(() => this.client.get(`/launches/previous/?${queryString}`));
        return normalizeLaunchResponse(rawResponse);
      },
      useCache
    );
    // Response is already normalized (either from cache or from fetchFn)
    return response;
  }

  async getLaunchById(id: string, useCache: boolean = true): Promise<Launch> {
    const launch = await this.fetchWithCache<Launch>(
      `detail_${id}`,
      async () => {
        try {
          const rawLaunch = await this.makeRequestWithRetry<Launch>(() => this.client.get(`/launches/${id}/`));
          return normalizeLaunch(rawLaunch);
        } catch (error: any) {
          if (error.response?.status === 404) {
            // Try singular endpoint fallback
            const rawLaunch = await this.makeRequestWithRetry<Launch>(() => this.client.get(`/launch/${id}/`));
            return normalizeLaunch(rawLaunch);
          }
          throw error;
        }
      },
      useCache
    );
    // Launch is already normalized (either from cache or from fetchFn)
    return launch;
  }

  async searchLaunches(search: string, filters: LaunchFilters = {}, useCache: boolean = true): Promise<LaunchResponse> {
    if (search.length <= 2) return { count: 0, results: [] };
    
    const response = await this.fetchWithCache<LaunchResponse>(
      `search_${search}_${JSON.stringify(filters)}`,
      async () => {
        const queryString = this.buildQueryString({
          ...filters,
          search,
          limit: filters.limit || 20,
        });
        const rawResponse = await this.makeRequestWithRetry<LaunchResponse>(() => this.client.get(`/launch/?${queryString}`));
        return normalizeLaunchResponse(rawResponse);
      },
      useCache
    );
    // Response is already normalized (either from cache or from fetchFn)
    return response;
  }

  async getRocketConfiguration(configId: number, useCache: boolean = true): Promise<any> {
    return this.fetchWithCache(
      `rocket_config_${configId}`,
      async () => {
        try {
          return await this.makeRequestWithRetry(() => this.client.get(`/config/launcher/${configId}/`));
        } catch (error: any) {
          if (error.response?.status === 404) return null;
          throw error;
        }
      },
      useCache
    );
  }

  async getRocketConfigurations(filters: any = {}, useCache: boolean = true): Promise<any> {
    return this.fetchWithCache(
      `rockets_${JSON.stringify(filters)}`,
      async () => {
        const queryString = this.buildQueryString(filters);
        try {
           return await this.makeRequestWithRetry(() => this.client.get(`/config/launcher/?${queryString}`));
        } catch (error: any) {
           if (error.response?.status === 404) {
             return await this.makeRequestWithRetry(() => this.client.get(`/config/launcherconfig/?${queryString}`));
           }
           throw error;
        }
      },
      useCache
    );
  }

  // SpaceX specific
  async getSpaceXRocketData(rocketName: string): Promise<any | null> {
     try {
      const response = await axios.get(
        `https://api.spacexdata.com/v4/rockets/${rocketName.toLowerCase().replace(/\s+/g, '-')}`,
        { timeout: SPACEX_API_TIMEOUT }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export const launchAPI = new LaunchAPI();
