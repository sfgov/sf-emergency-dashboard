import { useState, useEffect, useCallback } from 'react';
import type { Incident } from '../types/incidents';
import { fetchPoliceIncidents, fetchCADCalls, calculateMedian, type TimeRange, type ResponseTimeData } from '../services/sfOpenData';

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

export interface ResponseTimeStats {
  priority: string;
  median: number;
  count: number;
  target: number;
  overTarget: number;
}

export interface DistrictResponseStats {
  district: string;
  priorityA: { median: number; count: number };
  priorityB: { median: number; count: number };
  priorityC: { median: number; count: number };
}

export function useResponseTimes(timeRange: TimeRange = 'month') {
  const [data, setData] = useState<ResponseTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const calls = await fetchCADCalls(timeRange);
      setData(calls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch response times');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    byPriority: (['A', 'B', 'C'] as const).map(p => {
      const calls = data.filter(d => d.priority === p);
      const times = calls.map(c => c.responseMinutes);
      const target = p === 'A' ? 8 : p === 'B' ? 20 : 60;
      return {
        priority: p,
        median: calculateMedian(times),
        count: calls.length,
        target,
        overTarget: calls.filter(c => c.responseMinutes > target).length,
      };
    }),
    byDistrict: (districts: string[]) => {
      return districts.map(district => {
        const distCalls = data.filter(d => d.district === district);
        const getStats = (p: string) => {
          const calls = distCalls.filter(d => d.priority === p);
          return {
            median: calculateMedian(calls.map(c => c.responseMinutes)),
            count: calls.length,
          };
        };
        return {
          district,
          priorityA: getStats('A'),
          priorityB: getStats('B'),
          priorityC: getStats('C'),
        };
      });
    },
  };

  return { data, loading, error, stats, refetch: fetchData };
}
