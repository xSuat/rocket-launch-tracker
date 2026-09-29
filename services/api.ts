import axios, { AxiosInstance } from 'axios';
import { Launch, LaunchResponse, LaunchFilters } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl, getBaseUrlForEnv, getApiEnvSync, CACHE_TTL_MS, STALE_CACHE_TTL_MS } from './config';
import { memoryCache } from './cache';

const normalizeLaunch = (launch: Launch): Launch => ({
  ...launch,
  source: 'LL2' as const,
});

const normalizeLaunchResponse = (response: LaunchResponse): LaunchResponse => ({
  ...response,
  results: (response.results || []).map(normalizeLaunch),
});

const CACHE_PREFIX = 'launch_cache_';
const API_TIMEOUT = 15000;

interface StoredCache<T> {
  data: T;
  isStale: boolean;
  age: number;
}

function toFriendlyError(error: unknown): Error {
  const err = error as {
    response?: { status?: number };
    code?: string;
    message?: string;
  };
  const status = err?.response?.status;
  if (status === 429) {
    return new Error('Launch data is busy right now. Please try again in a few minutes.');
  }
  if (status === 404) {
    return new Error('That launch could not be found.');
  }
  const offline =
    err?.code === 'ECONNABORTED' ||
    err?.code === 'ERR_NETWORK' ||
    err?.message === 'Network Error' ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout')) ||
    !err?.response;
  if (offline) {
    return new Error('Could not reach the launch service. Check your connection and try again.');
  }
  if (status && status >= 500) {
    return new Error('The launch service is temporarily unavailable. Please try again.');
  }
  return new Error('Could not load launch data. Please try again.');
}

class LaunchAPI {
  private client: AxiosInstance;
  private currentEnv: 'dev' | 'prod';
  private inflight = new Map<string, Promise<unknown>>();

  constructor() {
    this.currentEnv = getApiEnvSync();
    this.client = axios.create({
      baseURL: getBaseUrl(),
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getCachePrefix(): string {
    return `${CACHE_PREFIX}${this.currentEnv}_`;
  }

  updateBaseUrl(env: 'dev' | 'prod'): void {
    if (this.currentEnv !== env) {
      this.currentEnv = env;
      this.client.defaults.baseURL = getBaseUrlForEnv(env);
      this.inflight.clear();
    }
  }

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

  private async makeRequestWithRetry<T>(requestFn: () => Promise<{ data: T }>): Promise<T> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error: any) {
      const timedOut =
        error?.code === 'ECONNABORTED' ||
        (typeof error?.message === 'string' && error.message.toLowerCase().includes('timeout'));
      if (timedOut) {
        await this.sleep(1000);
        const response = await requestFn();
        return response.data;
      }
      throw error;
    }
  }

  private async readCache<T>(cacheKey: string): Promise<StoredCache<T> | null> {
    const memory = memoryCache.getWithMeta<T>(cacheKey);
    if (memory.data && !memory.isStale) {
      const age = memory.timestamp ? Date.now() - memory.timestamp : 0;
      return { data: memory.data, isStale: false, age };
    }

    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { data?: T; timestamp?: number };
        if (parsed.data !== undefined && typeof parsed.timestamp === 'number') {
          const age = Date.now() - parsed.timestamp;
          const isStale = age >= CACHE_TTL_MS;
          if (!isStale) {
            memoryCache.set(cacheKey, parsed.data);
          }
          return { data: parsed.data, isStale, age };
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('Error reading from persistent cache', e);
    }

    if (memory.data) {
      const age = memory.timestamp ? Date.now() - memory.timestamp : CACHE_TTL_MS;
      return { data: memory.data, isStale: true, age };
    }
    return null;
  }

  private async writeCache<T>(cacheKey: string, data: T): Promise<void> {
    memoryCache.set(cacheKey, data);
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      if (__DEV__) console.warn('Error writing to persistent cache', e);
    }
  }

  private network<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(cacheKey);
    if (existing) return existing as Promise<T>;

    const promise = (async () => {
      const data = await fetchFn();
      await this.writeCache(cacheKey, data);
      return data;
    })().finally(() => {
      this.inflight.delete(cacheKey);
    });

    this.inflight.set(cacheKey, promise);
    return promise;
  }

  private async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = `${this.getCachePrefix()}${key}`;
    const cached = await this.readCache<T>(cacheKey);

    if (useCache && cached && !cached.isStale) {
      return cached.data;
    }

    try {
      return await this.network(cacheKey, fetchFn);
    } catch (error) {
      if (cached && cached.age < STALE_CACHE_TTL_MS) {
        return cached.data;
      }
      throw toFriendlyError(error);
    }
  }

  private getUpcomingLaunchesCacheKey(filters: LaunchFilters): string {
    return `upcoming_${JSON.stringify(filters)}`;
  }

  private getPastLaunchesCacheKey(filters: LaunchFilters): string {
    return `past_${JSON.stringify(filters)}`;
  }

  async getCachedUpcomingLaunches(filters: LaunchFilters): Promise<{ data: LaunchResponse | null; isStale: boolean }> {
    const cacheKey = `${this.getCachePrefix()}${this.getUpcomingLaunchesCacheKey(filters)}`;
    const cached = await this.readCache<LaunchResponse>(cacheKey);
    if (!cached) return { data: null, isStale: false };
    return { data: cached.data, isStale: cached.isStale };
  }

  async getCachedPastLaunches(filters: LaunchFilters): Promise<{ data: LaunchResponse | null; isStale: boolean }> {
    const cacheKey = `${this.getCachePrefix()}${this.getPastLaunchesCacheKey(filters)}`;
    const cached = await this.readCache<LaunchResponse>(cacheKey);
    if (!cached) return { data: null, isStale: false };
    return { data: cached.data, isStale: cached.isStale };
  }

  async getUpcomingLaunches(filters: LaunchFilters = {}, useCache: boolean = true): Promise<LaunchResponse> {
    return this.fetchWithCache<LaunchResponse>(
      this.getUpcomingLaunchesCacheKey(filters),
      async () => {
        const queryString = this.buildQueryString({
          ...filters,
          ordering: filters.ordering || 'net',
          limit: filters.limit || 20,
        });
        const rawResponse = await this.makeRequestWithRetry<LaunchResponse>(() =>
          this.client.get(`/launches/upcoming/?${queryString}`)
        );
        return normalizeLaunchResponse(rawResponse);
      },
      useCache
    );
  }

  async getPastLaunches(filters: LaunchFilters = {}, useCache: boolean = true): Promise<LaunchResponse> {
    return this.fetchWithCache<LaunchResponse>(
      this.getPastLaunchesCacheKey(filters),
      async () => {
        const queryString = this.buildQueryString({
          ...filters,
          ordering: filters.ordering || '-net',
          limit: filters.limit || 20,
        });
        const rawResponse = await this.makeRequestWithRetry<LaunchResponse>(() =>
          this.client.get(`/launches/previous/?${queryString}`)
        );
        return normalizeLaunchResponse(rawResponse);
      },
      useCache
    );
  }

  async getLaunchById(id: string, useCache: boolean = true): Promise<Launch> {
    return this.fetchWithCache<Launch>(
      `detail_${id}`,
      async () => {
        try {
          const rawLaunch = await this.makeRequestWithRetry<Launch>(() => this.client.get(`/launches/${id}/`));
          return normalizeLaunch(rawLaunch);
        } catch (error: any) {
          if (error.response?.status === 404) {
            const rawLaunch = await this.makeRequestWithRetry<Launch>(() => this.client.get(`/launch/${id}/`));
            return normalizeLaunch(rawLaunch);
          }
          throw error;
        }
      },
      useCache
    );
  }

  async searchLaunches(search: string, filters: LaunchFilters = {}, useCache: boolean = true): Promise<LaunchResponse> {
    if (search.length <= 2) return { count: 0, results: [] };

    return this.fetchWithCache<LaunchResponse>(
      `search_${search}_${JSON.stringify(filters)}`,
      async () => {
        const queryString = this.buildQueryString({
          ...filters,
          search,
          limit: filters.limit || 20,
        });
        const rawResponse = await this.makeRequestWithRetry<LaunchResponse>(() =>
          this.client.get(`/launch/?${queryString}`)
        );
        return normalizeLaunchResponse(rawResponse);
      },
      useCache
    );
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

  async getRocketConfigurations(filters: LaunchFilters = {}, useCache: boolean = true): Promise<any> {
    return this.fetchWithCache(
      `rockets_${JSON.stringify(filters)}`,
      async () => {
        const queryString = this.buildQueryString({
          ...filters,
          limit: filters.limit && filters.limit > 100 ? 100 : filters.limit,
        });
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

  async getLaunchesByRocket(configId: number, useCache: boolean = true): Promise<LaunchResponse> {
    return this.fetchWithCache<LaunchResponse>(
      `by_rocket_${configId}`,
      async () => {
        const queryString = this.buildQueryString({
          rocket__configuration__id: configId,
          limit: 20,
          ordering: '-net',
        });
        const rawResponse = await this.makeRequestWithRetry<LaunchResponse>(() =>
          this.client.get(`/launch/?${queryString}`)
        );
        return normalizeLaunchResponse(rawResponse);
      },
      useCache
    );
  }
}

export const launchAPI = new LaunchAPI();
