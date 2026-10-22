import type { Incident, PoliceIncident } from '../types/incidents';
import { subDays, format } from 'date-fns';

const SF_DATA_BASE = 'https://data.sfgov.org/resource';
const POLICE_DATASET = 'wg3w-h783';
const CAD_DATASET = '2zdj-bwza';

export const RESPONSE_TARGETS = {
  A: 8,
  B: 20,
  C: 60,
};

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

export interface CADCall {
  cad_number: string;
  received_datetime: string;
  onscene_datetime: string;
  priority_final: string;
  call_type_final_desc: string;
  analysis_neighborhood: string;
  police_district: string;
  disposition: string;
}

export interface ResponseTimeData {
  priority: string;
  district: string;
  responseMinutes: number;
  hour: number;
  callType: string;
}

export async function fetchCADCalls(timeRange: TimeRange = 'month'): Promise<ResponseTimeData[]> {
  const dateFilter = getDateFilter(timeRange);
  const limit = getLimit(timeRange);

  const params = new URLSearchParams({
    '$where': `received_datetime > '${dateFilter}' AND onscene_datetime IS NOT NULL AND agency = 'POL'`,
    '$limit': limit,
    '$order': 'received_datetime DESC',
    '$select': 'cad_number,received_datetime,onscene_datetime,priority_final,call_type_final_desc,analysis_neighborhood,police_district,disposition',
  });

  const url = `${SF_DATA_BASE}/${CAD_DATASET}.json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch CAD calls');
  }

  const data: CADCall[] = await response.json();

  return data
    .filter(d => d.received_datetime && d.onscene_datetime && d.priority_final && d.police_district)
    .map(d => {
      const received = new Date(d.received_datetime);
      const onscene = new Date(d.onscene_datetime);
      const responseMinutes = (onscene.getTime() - received.getTime()) / 60000;

      return {
        priority: d.priority_final.toUpperCase().charAt(0),
        district: d.police_district,
        responseMinutes: responseMinutes > 0 && responseMinutes < 180 ? responseMinutes : NaN,
        hour: received.getHours(),
        callType: d.call_type_final_desc || 'Unknown',
      };
    })
    .filter(d => !isNaN(d.responseMinutes));
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface DistrictCallStats {
  district: string;
  priorityA: number;
  priorityB: number;
  priorityC: number;
  total: number;
  days: number;
}

export async function fetchCallsByDistrict(): Promise<DistrictCallStats[]> {
  const calls = await fetchCADCalls('month');
  const days = 30;

  const districtMap = new Map<string, { a: number; b: number; c: number }>();

  calls.forEach(call => {
    const dist = call.district.toUpperCase();
    if (!districtMap.has(dist)) {
      districtMap.set(dist, { a: 0, b: 0, c: 0 });
    }
    const counts = districtMap.get(dist)!;
    if (call.priority === 'A') counts.a++;
    else if (call.priority === 'B') counts.b++;
    else if (call.priority === 'C') counts.c++;
  });

  return Array.from(districtMap.entries()).map(([district, counts]) => ({
    district,
    priorityA: Math.round(counts.a / days),
    priorityB: Math.round(counts.b / days),
    priorityC: Math.round(counts.c / days),
    total: Math.round((counts.a + counts.b + counts.c) / days),
    days,
  }));
}
