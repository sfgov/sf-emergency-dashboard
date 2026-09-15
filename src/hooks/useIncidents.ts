import { useState, useEffect, useMemo } from 'react';
import type { Incident, IncidentFilter, DistrictStats, StationStats, PriorityStats, ResponderStats, HourlyStats, EncampmentStats } from '../types/incidents';
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

export function usePriorityStats(incidents: Incident[]): PriorityStats[] {
  return useMemo(() => {
    const statsMap = new Map<string, { count: number; totalResponseTime: number; responseCount: number }>();

    incidents.forEach(incident => {
      if (!incident.priority) return;

      const priority = incident.priority.toUpperCase();
      if (!['A', 'B', 'C', 'E', '1', '2', '3'].includes(priority.charAt(0))) return;

      const normalizedPriority = priority.charAt(0) === 'E' ? 'E (Emergency)' :
        priority.charAt(0) === 'A' || priority.charAt(0) === '1' ? 'A (Critical)' :
        priority.charAt(0) === 'B' || priority.charAt(0) === '2' ? 'B (Urgent)' :
        'C (Non-urgent)';

      const existing = statsMap.get(normalizedPriority) || { count: 0, totalResponseTime: 0, responseCount: 0 };
      existing.count++;

      if (incident.responseTimeMinutes !== undefined) {
        existing.totalResponseTime += incident.responseTimeMinutes;
        existing.responseCount++;
      }

      statsMap.set(normalizedPriority, existing);
    });

    return Array.from(statsMap.entries())
      .map(([priority, data]) => ({
        priority,
        count: data.count,
        avgResponseTime: data.responseCount > 0 ? Math.round(data.totalResponseTime / data.responseCount) : 0,
      }))
      .sort((a, b) => {
        const order = ['E (Emergency)', 'A (Critical)', 'B (Urgent)', 'C (Non-urgent)'];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      });
  }, [incidents]);
}

export function useResponderStats(incidents: Incident[]): ResponderStats[] {
  return useMemo(() => {
    const statsMap = new Map<string, { count: number; totalResponseTime: number; responseCount: number }>();

    incidents.forEach(incident => {
      const responder = incident.responder || 'Other';
      const existing = statsMap.get(responder) || { count: 0, totalResponseTime: 0, responseCount: 0 };
      existing.count++;

      if (incident.responseTimeMinutes !== undefined) {
        existing.totalResponseTime += incident.responseTimeMinutes;
        existing.responseCount++;
      }

      statsMap.set(responder, existing);
    });

    return Array.from(statsMap.entries())
      .map(([responder, data]) => ({
        responder,
        count: data.count,
        avgResponseTime: data.responseCount > 0 ? Math.round(data.totalResponseTime / data.responseCount) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);
}

export function useHourlyStats(incidents: Incident[]): HourlyStats[] {
  return useMemo(() => {
    const hourly: HourlyStats[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      total: 0,
      priorityA: 0,
      priorityB: 0,
      priorityC: 0,
    }));

    if (!incidents || incidents.length === 0) return hourly;

    incidents.forEach(incident => {
      if (!incident.timestamp || isNaN(incident.timestamp.getTime())) return;
      const hour = incident.timestamp.getHours();
      if (hour < 0 || hour > 23) return;

      hourly[hour].total++;

      const priority = incident.priority?.toUpperCase().charAt(0);
      if (priority === 'A' || priority === '1' || priority === 'E') hourly[hour].priorityA++;
      else if (priority === 'B' || priority === '2') hourly[hour].priorityB++;
      else if (priority === 'C' || priority === '3') hourly[hour].priorityC++;
    });

    return hourly;
  }, [incidents]);
}

export function useEncampmentStats(incidents: Incident[]): EncampmentStats[] {
  return useMemo(() => {
    const encampments = incidents.filter(i => i.isEncampment);
    const statsMap = new Map<string, EncampmentStats>();

    encampments.forEach(incident => {
      const district = incident.district || 'Unknown';
      const existing = statsMap.get(district) || {
        district,
        count: 0,
        openCount: 0,
        closedCount: 0,
      };

      existing.count++;
      const status = incident.status?.toLowerCase() || '';
      if (status.includes('closed') || status.includes('resolved')) {
        existing.closedCount++;
      } else {
        existing.openCount++;
      }

      statsMap.set(district, existing);
    });

    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
  }, [incidents]);
}
