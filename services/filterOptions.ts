import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV_BASE_URL = 'https://lldev.thespacedevs.com/2.3.0';
const PROD_BASE_URL = 'https://ll.thespacedevs.com/2.3.0';
const CACHE_PREFIX = 'filter_options_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const getBaseUrl = async (): Promise<string> => {
  try {
    const env = await AsyncStorage.getItem('api_environment');
    return env === 'production' ? PROD_BASE_URL : DEV_BASE_URL;
  } catch {
    return DEV_BASE_URL;
  }
};

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp }: CachedData<T> = JSON.parse(cached);
      const age = Date.now() - timestamp;
      if (age < CACHE_EXPIRY) {
        return data;
      }
    }
  } catch (error) {
    if (__DEV__) console.error('Error reading cache:', error);
  }
  return null;
};

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
    const cacheKey = `${CACHE_PREFIX}locations`;
    const cached = await getCachedData<LocationOption[]>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.get(`${baseUrl}/location/?limit=500`);
      const locations = response.data.results.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        country_code: loc.country_code,
      }));
      await setCachedData(cacheKey, locations);
      return locations;
    } catch (error: any) {
      // Silently return empty array on 404 or other errors
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Error fetching locations:', error);
      }
      return [];
    }
  }

  async getRockets(): Promise<RocketOption[]> {
    const cacheKey = `${CACHE_PREFIX}rockets`;
    const cached = await getCachedData<RocketOption[]>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = await getBaseUrl();
      // Try launcher endpoint first, fallback to launcherconfig
      let response;
      try {
        response = await axios.get(`${baseUrl}/config/launcher/?limit=500`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Try alternative endpoint
          response = await axios.get(`${baseUrl}/config/launcherconfig/?limit=500`);
        } else {
          throw error;
        }
      }
      const rockets = response.data.results.map((rocket: any) => ({
        id: rocket.id,
        name: rocket.name,
        family: rocket.family || '',
        variant: rocket.variant || undefined,
      }));
      await setCachedData(cacheKey, rockets);
      return rockets;
    } catch (error: any) {
      // Silently return empty array on 404 or other errors
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Error fetching rockets:', error);
      }
      return [];
    }
  }

  async getAgencies(): Promise<AgencyOption[]> {
    const cacheKey = `${CACHE_PREFIX}agencies`;
    const cached = await getCachedData<AgencyOption[]>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.get(`${baseUrl}/agencies/?limit=500`);
      const agencies = response.data.results.map((agency: any) => ({
        id: agency.id,
        name: agency.name,
        country_code: agency.country_code || '',
      }));
      await setCachedData(cacheKey, agencies);
      return agencies;
    } catch (error: any) {
      // Silently return empty array on 404 or other errors
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Error fetching agencies:', error);
      }
      return [];
    }
  }

  async getOrbits(): Promise<OrbitOption[]> {
    const cacheKey = `${CACHE_PREFIX}orbits`;
    const cached = await getCachedData<OrbitOption[]>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.get(`${baseUrl}/config/orbit/?limit=500`);
      const orbits = response.data.results.map((orbit: any) => ({
        id: orbit.id,
        name: orbit.name,
        abbrev: orbit.abbrev || '',
      }));
      await setCachedData(cacheKey, orbits);
      return orbits;
    } catch (error: any) {
      // Silently return empty array on 404 or other errors
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Error fetching orbits:', error);
      }
      return [];
    }
  }

  async getPrograms(): Promise<ProgramOption[]> {
    const cacheKey = `${CACHE_PREFIX}programs`;
    const cached = await getCachedData<ProgramOption[]>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.get(`${baseUrl}/program/?limit=500`);
      const programs = response.data.results.map((program: any) => ({
        id: program.id,
        name: program.name,
      }));
      await setCachedData(cacheKey, programs);
      return programs;
    } catch (error: any) {
      // Silently return empty array on 404 or other errors
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Error fetching programs:', error);
      }
      return [];
    }
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
    const cached = await getCachedData<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.get(`${baseUrl}/launch/?limit=1000`);
      const types = new Set<string>();
      response.data.results.forEach((launch: any) => {
        if (launch.mission?.type) {
          types.add(launch.mission.type);
        }
      });
      const typesArray = Array.from(types).sort();
      await setCachedData(cacheKey, typesArray);
      return typesArray;
    } catch (error: any) {
      // Silently return empty array on 404 or other errors
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Error fetching mission types:', error);
      }
      return [];
    }
  }
}

export const filterOptionsService = new FilterOptionsService();

