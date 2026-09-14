export interface Incident {
  id: string;
  type: 'police' | 'fire' | '311' | 'cad';
  category: string;
  description: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  status?: string;
  resolution?: string;
  priority?: string;
  unitType?: string;
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

export interface CADCall {
  cad_number: string;
  unit_id: string;
  incident_number: string;
  call_type: string;
  call_date: string;
  watch_date: string;
  received_dttm: string;
  entry_dttm: string;
  dispatch_dttm: string;
  enroute_dttm: string;
  onscene_dttm: string;
  transport_dttm: string;
  hospital_dttm: string;
  available_dttm: string;
  address: string;
  city: string;
  zipcode_of_incident: string;
  battalion: string;
  station_area: string;
  box: string;
  original_priority: string;
  priority: string;
  final_priority: string;
  als_unit: string;
  call_type_group: string;
  number_of_alarms: string;
  unit_type: string;
  unit_sequence_in_call_dispatch: string;
  fire_prevention_district: string;
  supervisor_district: string;
  neighborhood_district: string;
  rowid: string;
  latitude: string;
  longitude: string;
  point: { coordinates: [number, number] };
}

export interface DistrictStats {
  district: string;
  totalCalls: number;
  policeIncidents: number;
  fireCalls: number;
  calls311: number;
  cadCalls: number;
}

export type IncidentFilter = {
  types: ('police' | 'fire' | '311' | 'cad')[];
  districts: string[];
  timeRange: 'today' | 'week' | 'month';
};
