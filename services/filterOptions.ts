import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiEnv, getBaseUrlForEnv } from './config';

const CACHE_PREFIX = 'filter_options_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const LIST_LIMIT = 100;
const filterInflight = new Map<string, Promise<unknown>>();

const getBaseUrl = async (): Promise<string> => {
  return getBaseUrlForEnv(await getApiEnv());
};

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const readCachedData = async <T>(key: string): Promise<{ data: T; fresh: boolean } | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp }: CachedData<T> = JSON.parse(cached);
      if (data === undefined || typeof timestamp !== 'number') return null;
      return { data, fresh: Date.now() - timestamp < CACHE_EXPIRY };
    }
  } catch (error) {
    if (__DEV__) console.error('Error reading cache:', error);
  }
  return null;
};

async function fetchFilterList<T>(cacheKey: string, path: string, mapRow: (row: any) => T): Promise<T[]> {
  const cached = await readCachedData<T[]>(cacheKey);
  if (cached?.fresh) return cached.data;

  const existing = filterInflight.get(cacheKey);
  if (existing) return existing as Promise<T[]>;

  const request = (async () => {
    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.get(`${baseUrl}${path}`, { timeout: 15000 });
      const rows = Array.isArray(response.data?.results) ? response.data.results.map(mapRow) : [];
      await setCachedData(cacheKey, rows);
      return rows;
    } catch (error: any) {
      if (cached) return cached.data;
      if (error?.response?.status !== 404 && __DEV__) {
        console.error(`Error fetching ${path}:`, error);
      }
      return [];
    }
  })();

  filterInflight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    filterInflight.delete(cacheKey);
  }
}

const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    if (__DEV__) console.error('Error writing cache:', error);
  }
};

export interface LocationOption {
  id: number;
  name: string;
  country_code: string;
}

export interface RocketOption {
  id: number;
  name: string;
  family: string;
  variant?: string;
}

export interface AgencyOption {
  id: number;
  name: string;
  country_code: string;
}

export interface OrbitOption {
  id: number;
  name: string;
  abbrev: string;
}

export interface ProgramOption {
  id: number;
  name: string;
}

class FilterOptionsService {
  async getLocations(): Promise<LocationOption[]> {
    return fetchFilterList(`${CACHE_PREFIX}locations`, `/location/?limit=${LIST_LIMIT}`, (loc) => ({
      id: loc.id,
      name: loc.name,
      country_code: loc.country_code,
    }));
  }

  async getRockets(): Promise<RocketOption[]> {
    const cacheKey = `${CACHE_PREFIX}rockets`;
    const cached = await readCachedData<RocketOption[]>(cacheKey);
    if (cached?.fresh) return cached.data;

    const existing = filterInflight.get(cacheKey);
    if (existing) return existing as Promise<RocketOption[]>;

    const request = (async () => {
      try {
        const baseUrl = await getBaseUrl();
        let response;
        try {
          response = await axios.get(`${baseUrl}/config/launcher/?limit=${LIST_LIMIT}`, { timeout: 15000 });
        } catch (error: any) {
          if (error.response?.status === 404) {
            response = await axios.get(`${baseUrl}/config/launcherconfig/?limit=${LIST_LIMIT}`, { timeout: 15000 });
          } else {
            throw error;
          }
        }
        const rockets = (response.data?.results || []).map((rocket: any) => ({
          id: rocket.id,
          name: rocket.name,
          family: rocket.family || '',
          variant: rocket.variant || undefined,
        }));
        await setCachedData(cacheKey, rockets);
        return rockets;
      } catch (error: any) {
        if (cached) return cached.data;
        if (error?.response?.status !== 404 && __DEV__) {
          console.error('Error fetching rockets:', error);
        }
        return [];
      }
    })();

    filterInflight.set(cacheKey, request);
    try {
      return await request;
    } finally {
      filterInflight.delete(cacheKey);
    }
  }

  async getAgencies(): Promise<AgencyOption[]> {
    return fetchFilterList(`${CACHE_PREFIX}agencies`, `/agencies/?limit=${LIST_LIMIT}`, (agency) => ({
      id: agency.id,
      name: agency.name,
      country_code: agency.country_code || '',
    }));
  }

  async getOrbits(): Promise<OrbitOption[]> {
    return fetchFilterList(`${CACHE_PREFIX}orbits`, `/config/orbit/?limit=${LIST_LIMIT}`, (orbit) => ({
      id: orbit.id,
      name: orbit.name,
      abbrev: orbit.abbrev || '',
    }));
  }

  async getPrograms(): Promise<ProgramOption[]> {
    return fetchFilterList(`${CACHE_PREFIX}programs`, `/program/?limit=${LIST_LIMIT}`, (program) => ({
      id: program.id,
      name: program.name,
    }));
  }

  // Get unique countries from locations
  async getCountries(): Promise<string[]> {
    const locations = await this.getLocations();
    const countries = new Set<string>();
    locations.forEach((loc) => {
      if (loc.country_code) {
        countries.add(loc.country_code);
      }
    });
    return Array.from(countries).sort();
  }

  // Get unique rocket families
  async getRocketFamilies(): Promise<string[]> {
    const rockets = await this.getRockets();
    const families = new Set<string>();
    rockets.forEach((rocket) => {
      if (rocket.family) {
        families.add(rocket.family);
      }
    });
    return Array.from(families).sort();
  }

  // Get unique rocket variants
  async getRocketVariants(): Promise<string[]> {
    const rockets = await this.getRockets();
    const variants = new Set<string>();
    rockets.forEach((rocket) => {
      if (rocket.variant) {
        variants.add(rocket.variant);
      }
    });
    return Array.from(variants).sort();
  }

  // Get unique mission types (from launches)
  async getMissionTypes(): Promise<string[]> {
    const cacheKey = `${CACHE_PREFIX}mission_types`;
    const cached = await readCachedData<string[]>(cacheKey);
    if (cached?.fresh) return cached.data;

    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.get(`${baseUrl}/launch/?limit=${LIST_LIMIT}`, { timeout: 15000 });
      const types = new Set<string>();
      (response.data?.results || []).forEach((launch: any) => {
        if (launch.mission?.type) {
          types.add(launch.mission.type);
        }
      });
      const typesArray = Array.from(types).sort();
      await setCachedData(cacheKey, typesArray);
      return typesArray;
    } catch (error: any) {
      if (cached) return cached.data;
      if (error?.response?.status !== 404 && __DEV__) {
        console.error('Error fetching mission types:', error);
      }
      return [];
    }
  }
}

export const filterOptionsService = new FilterOptionsService();

