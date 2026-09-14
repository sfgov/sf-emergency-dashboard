export interface Incident {
  id: string;
  type: 'police' | 'fire' | '311';
  category: string;
  description: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  status?: string;
  resolution?: string;
}

export interface PoliceIncident {
  incident_id: string;
  incident_category: string;
  incident_description: string;
  incident_date: string;
  incident_time: string;
  police_district: string;
  latitude: string;
  longitude: string;
  resolution: string;
  intersection: string;
}

export interface FireCall {
  call_number: string;
  call_type: string;
  call_date: string;
  received_dttm: string;
  battalion: string;
  station_area: string;
  address: string;
  city: string;
  zipcode_of_incident: string;
  latitude: string;
  longitude: string;
  final_priority: string;
  disposition: string;
}

export interface Case311 {
  service_request_id: string;
  requested_datetime: string;
  closed_date: string;
  status_description: string;
  status_notes: string;
  service_name: string;
  service_subtype: string;
  address: string;
  street: string;
  supervisor_district: string;
  neighborhood: string;
  lat: string;
  long: string;
  source: string;
}

export interface DistrictStats {
  district: string;
  totalCalls: number;
  policeIncidents: number;
  fireCalls: number;
  calls311: number;
}

export type IncidentFilter = {
  types: ('police' | 'fire' | '311')[];
  districts: string[];
  timeRange: 'today' | 'week' | 'month';
};
