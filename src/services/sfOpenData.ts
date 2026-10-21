import type { Incident, PoliceIncident } from '../types/incidents';
import { subDays, format } from 'date-fns';

const SF_DATA_BASE = 'https://data.sfgov.org/resource';
const POLICE_DATASET = 'wg3w-h783';

export type TimeRange = 'week' | 'month' | '3months' | 'year';

function getDateFilter(timeRange: TimeRange): string {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case 'week':
      startDate = subDays(now, 7);
      break;
    case 'month':
      startDate = subDays(now, 30);
      break;
    case '3months':
      startDate = subDays(now, 90);
      break;
    case 'year':
      startDate = subDays(now, 365);
      break;
  }

  return format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
}

function getLimit(timeRange: TimeRange): string {
  switch (timeRange) {
    case 'week':
      return '5000';
    case 'month':
      return '15000';
    case '3months':
      return '40000';
    case 'year':
      return '50000';
  }
}

export async function fetchPoliceIncidents(timeRange: TimeRange = 'month'): Promise<Incident[]> {
  const dateFilter = getDateFilter(timeRange);
  const limit = getLimit(timeRange);

  const params = new URLSearchParams({
    '$where': `incident_datetime > '${dateFilter}'`,
    '$limit': limit,
    '$order': 'incident_datetime DESC',
  });

  const url = `${SF_DATA_BASE}/${POLICE_DATASET}.json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch police incidents');
  }

  const data: PoliceIncident[] = await response.json();

  return data
    .filter(d => d.latitude && d.longitude && d.police_district)
    .map(d => {
      const timestamp = new Date(d.incident_datetime);
      return {
        id: d.incident_id,
        category: d.incident_category || 'Unknown',
        subcategory: d.incident_subcategory || '',
        description: d.incident_description || '',
        district: d.police_district,
        neighborhood: d.analysis_neighborhood || '',
        latitude: parseFloat(d.latitude),
        longitude: parseFloat(d.longitude),
        timestamp,
        dayOfWeek: d.incident_day_of_week || timestamp.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: timestamp.getHours(),
        resolution: d.resolution || '',
        address: d.intersection || '',
      };
    });
}
