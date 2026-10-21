export interface PoliceIncident {
  incident_id: string;
  incident_number: string;
  incident_code: string;
  incident_category: string;
  incident_subcategory: string;
  incident_description: string;
  incident_date: string;
  incident_time: string;
  incident_datetime: string;
  incident_day_of_week: string;
  incident_year: string;
  report_datetime: string;
  report_type_code: string;
  report_type_description: string;
  filed_online: string;
  cad_number: string;
  police_district: string;
  analysis_neighborhood: string;
  supervisor_district: string;
  latitude: string;
  longitude: string;
  resolution: string;
  intersection: string;
}

export interface Incident {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  district: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  dayOfWeek: string;
  hour: number;
  resolution: string;
  address: string;
}

export interface DistrictStats {
  district: string;
  totalIncidents: number;
  perDay: number;
  topCategories: { category: string; count: number }[];
}

export interface TimeStats {
  hour: number;
  count: number;
  label: string;
}

export interface StaffingMetrics {
  district: string;
  incidentsPerOfficer: number;
  peakHours: number[];
  recommendedStaffing: number;
}
