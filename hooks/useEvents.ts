import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEvents, SpaceEvent, getCacheKey } from '../services/events';

export const useEvents = (startDate: string, endDate: string) => {
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      // Try to load from cache first before showing loading state
      try {
        const cacheKey = getCacheKey(startDate, endDate);
        const cacheKeyFull = `events_cache_${cacheKey}`;
        
        // Check AsyncStorage immediately
        const cached = await AsyncStorage.getItem(cacheKeyFull);
        if (cached) {
          const { data } = JSON.parse(cached);
          setEvents(data);
          setLoading(false);
          // Continue to fetch fresh data in background
        } else {
          setLoading(true);
        }
      } catch (e) {
        setLoading(true);
      }
    }
    
    setError(null);

    try {
      const data = await getAllEvents(startDate, endDate, !refresh);
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, refreshing, error, refetch: () => fetchEvents(true) };
};

