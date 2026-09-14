import type { Incident } from '../types/incidents';
import { format } from 'date-fns';

interface IncidentListProps {
  incidents: Incident[];
}

function getTypeClass(type: string): string {
  return type === '311' ? 'calls311' : type;
}

export function IncidentList({ incidents }: IncidentListProps) {
  return (
    <div className="incident-list">
      <h3>Recent Incidents ({incidents.length})</h3>
      <div className="incident-items">
        {incidents.slice(0, 50).map(incident => (
          <div key={incident.id} className={`incident-item incident-${getTypeClass(incident.type)}`}>
            <div className="incident-header">
              <span className={`incident-badge ${getTypeClass(incident.type)}`}>
                {incident.type.toUpperCase()}
              </span>
              <span className="incident-time">
                {format(incident.timestamp, 'MMM d, h:mm a')}
              </span>
            </div>
            <div className="incident-category">{incident.category}</div>
            {incident.description && (
              <div className="incident-description">{incident.description}</div>
            )}
            <div className="incident-location">
              <span className="location-icon">📍</span>
              {incident.address || incident.district}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
