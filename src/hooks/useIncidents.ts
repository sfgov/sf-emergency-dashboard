import { useState, useEffect, useMemo } from 'react';
import type { Incident, IncidentFilter, DistrictStats, StationStats } from '../types/incidents';
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
        cadCalls: 0,
      };

      existing.totalCalls++;
      if (incident.type === 'police') existing.policeIncidents++;
      else if (incident.type === 'fire') existing.fireCalls++;
      else if (incident.type === '311') existing.calls311++;
      else if (incident.type === 'cad') existing.cadCalls++;

      statsMap.set(district, existing);
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalCalls - a.totalCalls);
  }, [incidents]);
}

export function useStationStats(incidents: Incident[]): StationStats[] {
  return useMemo(() => {
    const statsMap = new Map<string, StationStats>();

    incidents.forEach(incident => {
      if (!incident.station) return;

      const station = `Station ${incident.station}`;
      const existing = statsMap.get(station) || {
        station,
        totalCalls: 0,
        fireCalls: 0,
        cadCalls: 0,
        medicalCalls: 0,
        otherCalls: 0,
      };

      existing.totalCalls++;

      if (incident.type === 'fire') existing.fireCalls++;
      else if (incident.type === 'cad') existing.cadCalls++;

      const category = incident.category.toLowerCase();
      if (category.includes('medical') || category.includes('medic') || category.includes('als') || category.includes('bls')) {
        existing.medicalCalls++;
      } else {
        existing.otherCalls++;
      }

      statsMap.set(station, existing);
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalCalls - a.totalCalls);
  }, [incidents]);
}
