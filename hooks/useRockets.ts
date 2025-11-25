import { useState, useEffect, useCallback } from 'react';
import { launchAPI } from '../services/api';
import { Launch } from '../types';

export const useRockets = (filters: any = {}) => {
  const [rockets, setRockets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState<string | undefined>(undefined);

  const fetchRockets = useCallback(async (isRefresh = false, isLoadMore = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!isLoadMore) setLoading(true);
    setError(null);

    try {
      const fetchFilters = { ...filters, limit: 20 };
      if (isLoadMore) {
          fetchFilters.offset = rockets.length;
      } else {
          fetchFilters.offset = 0;
      }

      const response = await launchAPI.getRocketConfigurations(fetchFilters, !isRefresh);
      
      if (isRefresh || !isLoadMore) {
        setRockets(response.results || []);
      } else {
        setRockets(prev => [...prev, ...(response.results || [])]);
      }
      
      setNext(response.next);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rockets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [JSON.stringify(filters), next, rockets.length]);

  useEffect(() => {
    fetchRockets();
  }, [JSON.stringify(filters)]);

  const loadMore = async () => {
    if (next && !loading && !refreshing) {
        await fetchRockets(false, true);
    }
  };

  return { rockets, loading, refreshing, error, refetch: () => fetchRockets(true), loadMore, hasMore: !!next };
};

export const useRocket = (id: number) => {
    const [rocket, setRocket] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const fetchRocket = useCallback(async (refresh = false) => {
      if (!id) return;
      
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
  
      try {
        const data = await launchAPI.getRocketConfiguration(id, !refresh);
        setRocket(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch rocket details');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [id]);
  
    useEffect(() => {
      fetchRocket();
    }, [fetchRocket]);
  
    return { rocket, loading, refreshing, error, refetch: () => fetchRocket(true) };
};

