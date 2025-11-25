import { useState, useEffect, useCallback } from 'react';
import { launchAPI } from '../services/api';
import { Launch } from '../types';

export const useLaunch = (id: string) => {
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLaunch = useCallback(async (refresh = false) => {
    if (!id) return;
    
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await launchAPI.getLaunchById(id, !refresh);
      setLaunch(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch launch details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLaunch();
  }, [fetchLaunch]);

  return { launch, loading, refreshing, error, refetch: () => fetchLaunch(true) };
};

