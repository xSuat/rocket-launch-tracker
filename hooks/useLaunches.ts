import { useState, useEffect, useCallback } from 'react';
import { launchAPI } from '../services/api';
import { Launch, LaunchFilters } from '../types';

interface UseLaunchesResult {
  data: Launch[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export const useUpcomingLaunches = (
  filters: LaunchFilters = {}
): UseLaunchesResult => {
  const [data, setData] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState<string | undefined>(undefined);

  const fetchLaunches = useCallback(async (isRefresh = false, isLoadMore = false) => {
    if (isRefresh) {
        setRefreshing(true);
    } else if (isLoadMore) {
        // Don't set loading for infinite scroll
    } else {
        // Try to load from cache first (check AsyncStorage immediately)
        const initialFilters = { ...filters, offset: 0 };
        const { data: cachedData, isStale } = await launchAPI.getCachedUpcomingLaunches(initialFilters);
        
        if (cachedData) {
            setData(cachedData.results);
            setNext(cachedData.next);
            setLoading(false);
            // If data is fresh, we don't need to fetch
            if (!isStale && !isRefresh) {
                return; 
            }
            // If data is stale, we show it but continue to fetch in background
        } else {
            setLoading(true);
        }
    }
    
    setError(null);

    try {
      const fetchFilters = { ...filters };
      if (isLoadMore && next) {
          fetchFilters.offset = data.length;
      } else if (isRefresh) {
          fetchFilters.offset = 0;
      }

      const response = await launchAPI.getUpcomingLaunches(fetchFilters, !isRefresh);
      
      if (isRefresh || !isLoadMore) {
        setData(response.results);
      } else {
        setData(prev => [...prev, ...response.results]);
      }
      
      setNext(response.next);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch launches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [JSON.stringify(filters), next, data.length]);

  useEffect(() => {
    fetchLaunches();
  }, [JSON.stringify(filters)]);

  const refetch = () => fetchLaunches(true);
  
  const loadMore = async () => {
      if (next && !loading && !refreshing) {
          await fetchLaunches(false, true);
      }
  };

  return { data, loading, refreshing, error, refetch, hasMore: !!next, loadMore };
};

export const usePastLaunches = (
    filters: LaunchFilters = {}
  ): UseLaunchesResult => {
    const [data, setData] = useState<Launch[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [next, setNext] = useState<string | undefined>(undefined);
  
    const fetchLaunches = useCallback(async (isRefresh = false, isLoadMore = false) => {
      if (isRefresh) {
          setRefreshing(true);
      } else if (isLoadMore) {
           // No loading for load more
      } else {
          // Try to load from cache first (check AsyncStorage immediately)
          const initialFilters = { ...filters, offset: 0 };
          const { data: cachedData, isStale } = await launchAPI.getCachedPastLaunches(initialFilters);
          
          if (cachedData) {
              setData(cachedData.results);
              setNext(cachedData.next);
              setLoading(false);
              // If data is fresh, we don't need to fetch
              if (!isStale && !isRefresh) {
                  return;
              }
              // If data is stale, we show it but continue to fetch in background
          } else {
              setLoading(true);
          }
      }
      
      setError(null);
  
      try {
        const fetchFilters = { ...filters };
        if (isLoadMore) {
            fetchFilters.offset = data.length;
        } else {
            fetchFilters.offset = 0;
        }
  
        const response = await launchAPI.getPastLaunches(fetchFilters, !isRefresh);
        
        if (isRefresh || !isLoadMore) {
          setData(response.results);
        } else {
          setData(prev => [...prev, ...response.results]);
        }
        
        setNext(response.next);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch launches');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [JSON.stringify(filters), next, data.length]);
  
    useEffect(() => {
      fetchLaunches();
    }, [JSON.stringify(filters)]);
  
    const refetch = () => fetchLaunches(true);
    
    const loadMore = async () => {
        if (next && !loading && !refreshing) {
            await fetchLaunches(false, true);
        }
    };
  
    return { data, loading, refreshing, error, refetch, hasMore: !!next, loadMore };
  };
