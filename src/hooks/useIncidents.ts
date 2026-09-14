import { useState, useEffect, useMemo } from 'react';
import { Incident, IncidentFilter, DistrictStats } from '../types/incidents';
import { fetchAllIncidents } from '../services/sfOpenData';

export function useIncidents(timeRange: 'today' | 'week' | 'month' = 'week') {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchAllIncidents(timeRange)
      .then(setIncidents)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [timeRange]);

  const refetch = () => {
    setLoading(true);
    fetchAllIncidents(timeRange)
      .then(setIncidents)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return { incidents, loading, error, refetch };
}

export function useFilteredIncidents(incidents: Incident[], filter: IncidentFilter) {
  return useMemo(() => {
    return incidents.filter(incident => {
      if (filter.types.length > 0 && !filter.types.includes(incident.type)) {
        return false;
      }
      if (filter.districts.length > 0 && !filter.districts.includes(incident.district)) {
        return false;
      }
      return true;
    });
  }, [incidents, filter]);
}

export function useDistrictStats(incidents: Incident[]): DistrictStats[] {
  return useMemo(() => {
    const statsMap = new Map<string, DistrictStats>();

    incidents.forEach(incident => {
      const district = incident.district;
      const existing = statsMap.get(district) || {
        district,
        totalCalls: 0,
        policeIncidents: 0,
        fireCalls: 0,
        calls311: 0,
      };

      existing.totalCalls++;
      if (incident.type === 'police') existing.policeIncidents++;
      else if (incident.type === 'fire') existing.fireCalls++;
      else if (incident.type === '311') existing.calls311++;

      statsMap.set(district, existing);
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalCalls - a.totalCalls);
  }, [incidents]);
}
