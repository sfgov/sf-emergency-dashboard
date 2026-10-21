import { useState, useEffect, useCallback } from 'react';
import type { Incident } from '../types/incidents';
import { fetchPoliceIncidents, type TimeRange } from '../services/sfOpenData';

interface UseIncidentsReturn {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIncidents(timeRange: TimeRange = 'month'): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPoliceIncidents(timeRange);
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    incidents,
    loading,
    error,
    refetch: fetchData,
  };
}
