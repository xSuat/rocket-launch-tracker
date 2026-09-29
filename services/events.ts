import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchAPI } from './api';
import { getNasaApiKey, NASA_NEO_URL, NASA_APOD_URL } from './config';
import { memoryCache } from './cache';
import { DataSource } from '../types';

export interface SpaceEvent {
  id: string;
  type: 'launch' | 'asteroid' | 'meteor' | 'moon' | 'apod';
  title: string;
  description?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  locationName?: string;
  url?: string;
  icon: string;
  color: string;
  source?: DataSource;
  asteroidData?: {
    diameterMin?: number;
    diameterMax?: number;
    isHazardous?: boolean;
    velocity?: number;
    orbitingBody?: string;
    missDistanceKm?: number;
    missDistanceLunar?: number;
    missDistanceAstronomical?: number;
  };
}

const CACHE_PREFIX = 'events_cache_';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for events
const STALE_EVENTS_TTL_MS = 24 * 60 * 60 * 1000;
const eventsInflight = new Map<string, Promise<SpaceEvent[]>>();

async function readEventsCache(key: string): Promise<{ data: SpaceEvent[]; fresh: boolean } | null> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const memory = memoryCache.getWithMeta<SpaceEvent[]>(cacheKey);
  if (memory.data && !memory.isStale) {
    return { data: memory.data, fresh: true };
  }

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Array.isArray(data) && typeof timestamp === 'number') {
        const age = Date.now() - timestamp;
        if (age < CACHE_TTL_MS) {
          memoryCache.set(cacheKey, data);
          return { data, fresh: true };
        }
        if (age < STALE_EVENTS_TTL_MS) {
          return { data, fresh: false };
        }
      }
    }
  } catch (error) {
    if (__DEV__) console.error('Error reading events cache:', error);
  }

  if (memory.data) {
    return { data: memory.data, fresh: false };
  }
  return null;
}

async function setCachedEvents(key: string, data: SpaceEvent[]): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  memoryCache.set(cacheKey, data);
  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    if (__DEV__) console.error('Error writing events cache:', error);
  }
}

export function getCacheKey(startDate: string, endDate: string): string {
  return `${startDate.split('T')[0]}_${endDate.split('T')[0]}`;
}

// ... rest of the functions (getLaunchEvents, getAsteroidEvents, etc.)
// I need to preserve the logic but update NASA key usage and export.

// Get launches from LL2
export async function getLaunchEvents(startDate: string, endDate: string): Promise<SpaceEvent[]> {
  try {
    const response = await launchAPI.getUpcomingLaunches(
      {
        net__gte: startDate,
        net__lte: endDate,
        limit: 100,
      },
      true
    );
    
    return (response.results || []).map((launch) => ({
      id: `launch-${launch.id}`,
      type: 'launch' as const,
      title: launch.name,
      description: launch.mission?.description,
      date: launch.net,
      startDate: launch.net,
      endDate: launch.window_end || launch.net,
      locationName: launch.pad?.location?.name,
      url: launch.url,
      icon: 'rocket-launch',
      color: '#4A9EFF',
      source: 'LL2' as const,
    }));
  } catch (error: any) {
    if (error.response?.status === 404) return [];
    return [];
  }
}

// Get asteroid close approaches from NASA NeoWs
export async function getAsteroidEvents(startDate: string, endDate: string): Promise<SpaceEvent[]> {
  try {
    const nasaApiKey = getNasaApiKey();
    const start = startDate.split('T')[0];
    const end = endDate.split('T')[0];
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    const events: SpaceEvent[] = [];
    const maxChunkSize = 7; 
    
    if (daysDiff <= maxChunkSize) {
      try {
        const response = await axios.get(
          NASA_NEO_URL,
          {
            params: {
              start_date: start,
              end_date: end,
              api_key: nasaApiKey,
            },
            timeout: 10000,
            validateStatus: (status) => status < 500,
          }
        );
        
        if (response.status >= 400) return [];
        
        const nearEarthObjects = response.data?.near_earth_objects || {};
        Object.entries(nearEarthObjects).forEach(([date, asteroids]) => {
          if (Array.isArray(asteroids)) {
            asteroids.forEach((asteroid: any) => {
              const closeApproach = asteroid.close_approach_data?.[0];
              if (closeApproach && closeApproach.miss_distance) {
                events.push({
                  id: `asteroid-${asteroid.id}-${date}`,
                  type: 'asteroid' as const,
                  title: `${asteroid.name} Close Approach`,
                  description: `Distance: ${parseFloat(closeApproach.miss_distance.kilometers).toFixed(0)} km`,
                  date: `${date}T${closeApproach.close_approach_date_full?.split(' ')[1] || '12:00:00'}`,
                  startDate: `${date}T${closeApproach.close_approach_date_full?.split(' ')[1] || '12:00:00'}`,
                  locationName: 'Near Earth',
                  url: asteroid.nasa_jpl_url,
                  icon: 'star',
                  color: '#FF6B6B',
                  source: 'NASA_NeoWs' as const,
                  asteroidData: {
                    diameterMin: asteroid.estimated_diameter?.meters?.estimated_diameter_min,
                    diameterMax: asteroid.estimated_diameter?.meters?.estimated_diameter_max,
                    isHazardous: asteroid.is_potentially_hazardous_asteroid || false,
                    velocity: parseFloat(closeApproach.relative_velocity?.kilometers_per_second || '0'),
                    orbitingBody: closeApproach.orbiting_body || 'Earth',
                    missDistanceKm: parseFloat(closeApproach.miss_distance.kilometers),
                    missDistanceLunar: parseFloat(closeApproach.miss_distance.lunar || '0'),
                    missDistanceAstronomical: parseFloat(closeApproach.miss_distance.astronomical || '0'),
                  },
                });
              }
            });
          }
        });
      } catch (e) { /* ignore */ }
    } else {
        // Simplified chunking for brevity - reuse logic if needed or keep simple
        // For now, to save space, I'll just fetch the first 7 days if range is too long, 
        // or implemented the loop if really needed. 
        // The user wants "clean up", so robust code is better.
        // I'll implement the loop.
        let currentStart = new Date(startDateObj);
        const chunkPromises: Promise<void>[] = [];
        let chunkCount = 0;
        const MAX_CHUNKS = 3;

        while (currentStart <= endDateObj && chunkCount < MAX_CHUNKS) {
            const chunkEnd = new Date(currentStart);
            chunkEnd.setDate(chunkEnd.getDate() + maxChunkSize - 1);
            if (chunkEnd > endDateObj) chunkEnd.setTime(endDateObj.getTime());

            const chunkStartStr = currentStart.toISOString().split('T')[0];
            const chunkEndStr = chunkEnd.toISOString().split('T')[0];

             chunkPromises.push(
                axios.get(NASA_NEO_URL, {
                    params: { start_date: chunkStartStr, end_date: chunkEndStr, api_key: nasaApiKey },
                    timeout: 10000,
                    validateStatus: s => s < 500
                }).then(response => {
                    if (response.status >= 400) return;
                    const nearEarthObjects = response.data?.near_earth_objects || {};
                    Object.entries(nearEarthObjects).forEach(([date, asteroids]) => {
                        if (Array.isArray(asteroids)) {
                            asteroids.forEach((asteroid: any) => {
                                const closeApproach = asteroid.close_approach_data?.[0];
                                if (closeApproach && closeApproach.miss_distance) {
                                    events.push({
                                        id: `asteroid-${asteroid.id}-${date}`,
                                        type: 'asteroid' as const,
                                        title: `${asteroid.name} Close Approach`,
                                        description: `Distance: ${parseFloat(closeApproach.miss_distance.kilometers).toFixed(0)} km`,
                                        date: `${date}T${closeApproach.close_approach_date_full?.split(' ')[1] || '12:00:00'}`,
                                        startDate: `${date}T${closeApproach.close_approach_date_full?.split(' ')[1] || '12:00:00'}`,
                                        locationName: 'Near Earth',
                                        url: asteroid.nasa_jpl_url,
                                        icon: 'star',
                                        color: '#FF6B6B',
                                        source: 'NASA_NeoWs' as const,
                                        asteroidData: {
                                            diameterMin: asteroid.estimated_diameter?.meters?.estimated_diameter_min,
                                            diameterMax: asteroid.estimated_diameter?.meters?.estimated_diameter_max,
                                            isHazardous: asteroid.is_potentially_hazardous_asteroid || false,
                                            velocity: parseFloat(closeApproach.relative_velocity?.kilometers_per_second || '0'),
                                            orbitingBody: closeApproach.orbiting_body || 'Earth',
                                            missDistanceKm: parseFloat(closeApproach.miss_distance.kilometers),
                                            missDistanceLunar: parseFloat(closeApproach.miss_distance.lunar || '0'),
                                            missDistanceAstronomical: parseFloat(closeApproach.miss_distance.astronomical || '0'),
                                        }
                                    });
                                }
                            });
                        }
                    });
                }).catch(() => {})
            );
            currentStart = new Date(chunkEnd);
            currentStart.setDate(currentStart.getDate() + 1);
            chunkCount++;
        }
        await Promise.allSettled(chunkPromises);
    }
    return events;
  } catch (error) {
    return [];
  }
}

// Moon Phases (Pure calculation, no API)
function getMoonPhase(date: Date): { name: string; icon: string } {
  const knownNewMoon = new Date(2000, 0, 6);
  const daysSince = Math.floor((date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24));
  const lunarCycle = 29.53;
  const phase = (daysSince % lunarCycle) / lunarCycle;
  
  if (phase < 0.03 || phase > 0.97) return { name: 'New Moon', icon: 'circle-outline' };
  if (phase < 0.22) return { name: 'Waxing Crescent', icon: 'moon-waxing-crescent' };
  if (phase < 0.28) return { name: 'First Quarter', icon: 'moon-first-quarter' };
  if (phase < 0.47) return { name: 'Waxing Gibbous', icon: 'moon-waxing-gibbous' };
  if (phase < 0.53) return { name: 'Full Moon', icon: 'moon-full' };
  if (phase < 0.72) return { name: 'Waning Gibbous', icon: 'moon-waning-gibbous' };
  if (phase < 0.78) return { name: 'Last Quarter', icon: 'moon-last-quarter' };
  return { name: 'Waning Crescent', icon: 'moon-waning-crescent' };
}

export async function getMoonPhaseEvents(startDate: string, endDate: string): Promise<SpaceEvent[]> {
  const events: SpaceEvent[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  while (current <= end) {
    const phase = getMoonPhase(current);
    if (['New Moon', 'Full Moon', 'First Quarter', 'Last Quarter'].includes(phase.name)) {
      events.push({
        id: `moon-${current.toISOString().split('T')[0]}`,
        type: 'moon' as const,
        title: `${phase.name}`,
        description: `Moon phase: ${phase.name}`,
        date: current.toISOString(),
        startDate: current.toISOString(),
        endDate: new Date(current.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        locationName: 'Worldwide',
        url: 'https://moon.nasa.gov/',
        icon: phase.icon,
        color: '#C0C0C0',
        source: 'Other' as const,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return events;
}

// APOD
export async function getAPODEvents(startDate: string, endDate: string): Promise<SpaceEvent[]> {
  try {
    const nasaApiKey = getNasaApiKey();
    const events: SpaceEvent[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    const maxDays = 30;
    let daysProcessed = 0;

    while (current <= end && daysProcessed < maxDays) {
      const dateStr = current.toISOString().split('T')[0];
      try {
        const response = await axios.get(NASA_APOD_URL, {
            params: { date: dateStr, api_key: nasaApiKey },
            timeout: 5000,
            validateStatus: s => s < 500
        });
        if (response.status === 200 && response.data) {
             const apod = response.data;
             events.push({
                id: `apod-${dateStr}`,
                type: 'apod' as const,
                title: apod.title || 'Astronomy Picture of the Day',
                description: apod.explanation || apod.title,
                date: `${dateStr}T12:00:00Z`,
                startDate: `${dateStr}T00:00:00Z`,
                endDate: `${dateStr}T23:59:59Z`,
                locationName: 'NASA',
                url: apod.url || apod.hdurl || 'https://apod.nasa.gov/apod/',
                icon: 'image-outline',
                color: '#FF6B6B',
                source: 'NASA_APOD' as const,
             });
        }
      } catch (e) {}
      current.setDate(current.getDate() + 1);
      daysProcessed++;
      if (daysProcessed % 5 === 0) await new Promise(r => setTimeout(r, 100));
    }
    return events;
  } catch { return []; }
}

// Meteor Showers
export async function getMeteorShowerEvents(startDate: string, endDate: string): Promise<SpaceEvent[]> {
    const knownShowers = [
        { name: 'Quadrantids', month: 0, day: 4, peak: 'January 4' },
        { name: 'Lyrids', month: 3, day: 22, peak: 'April 22' },
        { name: 'Eta Aquarids', month: 4, day: 6, peak: 'May 6' },
        { name: 'Perseids', month: 7, day: 12, peak: 'August 12' },
        { name: 'Orionids', month: 9, day: 21, peak: 'October 21' },
        { name: 'Leonids', month: 10, day: 17, peak: 'November 17' },
        { name: 'Geminids', month: 11, day: 14, peak: 'December 14' },
    ];
    const events: SpaceEvent[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
        knownShowers.forEach(shower => {
            const showerDate = new Date(year, shower.month, shower.day);
            if (showerDate >= start && showerDate <= end) {
                events.push({
                    id: `meteor-${shower.name}-${year}`,
                    type: 'meteor' as const,
                    title: `${shower.name} Meteor Shower`,
                    description: `Peak: ${shower.peak}`,
                    date: showerDate.toISOString(),
                    startDate: new Date(showerDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date(showerDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    locationName: 'Worldwide',
                    url: 'https://www.imo.net/',
                    icon: 'meteor',
                    color: '#FFA500',
                    source: 'Other' as const,
                });
            }
        });
    }
    return events;
}

async function loadEvents(startDate: string, endDate: string): Promise<SpaceEvent[]> {
  const results = await Promise.allSettled([
    getLaunchEvents(startDate, endDate),
    getAsteroidEvents(startDate, endDate),
    getMeteorShowerEvents(startDate, endDate),
    getMoonPhaseEvents(startDate, endDate),
    getAPODEvents(startDate, endDate),
  ]);

  const events: SpaceEvent[] = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') events.push(...r.value);
  });

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getAllEvents(
  startDate: string,
  endDate: string,
  useCache: boolean = true
): Promise<SpaceEvent[]> {
  const cacheKey = getCacheKey(startDate, endDate);
  const cached = useCache ? await readEventsCache(cacheKey) : null;
  if (cached?.fresh) return cached.data;

  const existing = eventsInflight.get(cacheKey);
  if (existing) return existing;

  const request = (async () => {
    try {
      const sorted = await loadEvents(startDate, endDate);
      if (sorted.length > 0 || !cached) {
        await setCachedEvents(cacheKey, sorted);
        return sorted;
      }
      return cached.data;
    } catch {
      if (cached) return cached.data;
      throw new Error('Could not load space events. Check your connection and try again.');
    }
  })();

  eventsInflight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    eventsInflight.delete(cacheKey);
  }
}

export async function getEventsForDay(date: Date): Promise<SpaceEvent[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const allEvents = await getAllEvents(startOfDay.toISOString(), endOfDay.toISOString());
  
  return allEvents.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfDay && eventDate <= endOfDay;
  });
}
