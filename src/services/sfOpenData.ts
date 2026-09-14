import { Incident, PoliceIncident, FireCall, Case311 } from '../types/incidents';
import { subDays, format } from 'date-fns';

const SF_DATA_BASE = 'https://data.sfgov.org/resource';

const DATASETS = {
  police: 'wg3w-h783',
  fire: 'nuek-vuh3',
  calls311: 'vw6y-z8j6',
};

function getDateFilter(timeRange: 'today' | 'week' | 'month'): string {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case 'today':
      startDate = subDays(now, 1);
      break;
    case 'week':
      startDate = subDays(now, 7);
      break;
    case 'month':
      startDate = subDays(now, 30);
      break;
  }

  return format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
}

export async function fetchPoliceIncidents(timeRange: 'today' | 'week' | 'month' = 'week'): Promise<Incident[]> {
  const dateFilter = getDateFilter(timeRange);
  const url = `${SF_DATA_BASE}/${DATASETS.police}.json?$where=incident_datetime > '${dateFilter}'&$limit=500&$order=incident_datetime DESC`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch police incidents');

  const data: PoliceIncident[] = await response.json();

  return data
    .filter(d => d.latitude && d.longitude)
    .map(d => ({
      id: d.incident_id,
      type: 'police' as const,
      category: d.incident_category || 'Unknown',
      description: d.incident_description || '',
      address: d.intersection || '',
      district: d.police_district || 'Unknown',
      latitude: parseFloat(d.latitude),
      longitude: parseFloat(d.longitude),
      timestamp: new Date(`${d.incident_date}T${d.incident_time || '00:00:00'}`),
      resolution: d.resolution,
    }));
}

export async function fetchFireCalls(timeRange: 'today' | 'week' | 'month' = 'week'): Promise<Incident[]> {
  const dateFilter = getDateFilter(timeRange);
  const url = `${SF_DATA_BASE}/${DATASETS.fire}.json?$where=received_dttm > '${dateFilter}'&$limit=500&$order=received_dttm DESC`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch fire calls');

  const data: FireCall[] = await response.json();

  return data
    .filter(d => d.latitude && d.longitude)
    .map(d => ({
      id: d.call_number,
      type: 'fire' as const,
      category: d.call_type || 'Unknown',
      description: `Priority: ${d.final_priority || 'N/A'}`,
      address: d.address || '',
      district: d.battalion || d.station_area || 'Unknown',
      latitude: parseFloat(d.latitude),
      longitude: parseFloat(d.longitude),
      timestamp: new Date(d.received_dttm),
      status: d.disposition,
    }));
}

export async function fetch311Cases(timeRange: 'today' | 'week' | 'month' = 'week'): Promise<Incident[]> {
  const dateFilter = getDateFilter(timeRange);
  const url = `${SF_DATA_BASE}/${DATASETS.calls311}.json?$where=requested_datetime > '${dateFilter}'&$limit=500&$order=requested_datetime DESC`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch 311 cases');

  const data: Case311[] = await response.json();

  return data
    .filter(d => d.lat && d.long)
    .map(d => ({
      id: d.service_request_id,
      type: '311' as const,
      category: d.service_name || 'Unknown',
      description: d.service_subtype || '',
      address: d.address || d.street || '',
      district: d.supervisor_district || d.neighborhood || 'Unknown',
      latitude: parseFloat(d.lat),
      longitude: parseFloat(d.long),
      timestamp: new Date(d.requested_datetime),
      status: d.status_description,
    }));
}

export async function fetchAllIncidents(timeRange: 'today' | 'week' | 'month' = 'week'): Promise<Incident[]> {
  const [police, fire, calls311] = await Promise.all([
    fetchPoliceIncidents(timeRange),
    fetchFireCalls(timeRange),
    fetch311Cases(timeRange),
  ]);

  return [...police, ...fire, ...calls311].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}
