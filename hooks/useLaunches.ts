import { useCallback, useEffect, useRef, useState } from 'react';
import { launchAPI } from '../services/api';
import { Launch, LaunchFilters } from '../types';

interface UseLaunchesResult {
  data: Launch[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  updatedAt: number | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

function useLaunchList(
  kind: 'upcoming' | 'past',
  filters: LaunchFilters,
  enabled: boolean
): UseLaunchesResult {
  const [data, setData] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [next, setNext] = useState<string | undefined>(undefined);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const loadingMoreRef = useRef(false);
  const dataLength = useRef(0);
  dataLength.current = data.length;

  const fetchLaunches = useCallback(async (isRefresh = false, isLoadMore = false) => {
    if (!enabled && !isRefresh && !isLoadMore) return;

    if (isRefresh) {
      setRefreshing(true);
    } else if (isLoadMore) {
      setLoadingMore(true);
      setLoadMoreError(null);
    } else {
      const initialFilters = { ...filters, offset: 0 };
      const cached = kind === 'upcoming'
        ? await launchAPI.getCachedUpcomingLaunches(initialFilters)
        : await launchAPI.getCachedPastLaunches(initialFilters);
      if (cached.data) {
        setData(cached.data.results);
        setNext(cached.data.next);
        if (cached.fetchedAt) setUpdatedAt(cached.fetchedAt);
        setLoading(false);
        if (!cached.isStale && !isRefresh) return;
      } else {
        setLoading(true);
      }
    }

    setError(null);

    try {
      const fetchFilters = { ...filters };
      if (isLoadMore) {
        fetchFilters.offset = dataLength.current;
      } else {
        fetchFilters.offset = 0;
      }
      const response = kind === 'upcoming'
        ? await launchAPI.getUpcomingLaunches(fetchFilters, !isRefresh)
        : await launchAPI.getPastLaunches(fetchFilters, !isRefresh);
      if (isRefresh || !isLoadMore) {
        setData(response.results);
        setUpdatedAt(Date.now());
      } else {
        setData((prev) => [...prev, ...response.results]);
      }
      setNext(response.next);
    } catch (err: any) {
      const message = err.message || 'Failed to fetch launches';
      if (isLoadMore) setLoadMoreError(message);
      else setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [enabled, JSON.stringify(filters), kind]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (dataLength.current === 0) setLoading(true);
    fetchLaunches();
  }, [enabled, fetchLaunches]);

  const loadMore = async () => {
    if (!next || loading || refreshing || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    await fetchLaunches(false, true);
  };

  return {
    data,
    loading,
    refreshing,
    loadingMore,
    error,
    loadMoreError,
    updatedAt,
    refetch: () => fetchLaunches(true),
    hasMore: !!next,
    loadMore,
  };
}

export const useUpcomingLaunches = (filters: LaunchFilters = {}, enabled = true) =>
  useLaunchList('upcoming', filters, enabled);

export const usePastLaunches = (filters: LaunchFilters = {}, enabled = true) =>
  useLaunchList('past', filters, enabled);
