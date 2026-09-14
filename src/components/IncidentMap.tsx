import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { Incident } from '../types/incidents';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

interface IncidentMapProps {
  incidents: Incident[];
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const TYPE_COLORS: Record<string, string> = {
  police: '#2563eb',
  fire: '#ff9f0a',
  '311': '#6366f1',
  cad: '#30d158',
};

export function IncidentMap({ incidents }: IncidentMapProps) {
  const sfCenter: [number, number] = [37.7749, -122.4194];

  return (
    <MapContainer
      center={sfCenter}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
      />
      {incidents.map(incident => (
        <CircleMarker
          key={incident.id}
          center={[incident.latitude, incident.longitude]}
          radius={6}
          fillColor={TYPE_COLORS[incident.type]}
          color={TYPE_COLORS[incident.type]}
          weight={1}
          opacity={0.8}
          fillOpacity={0.6}
        >
          <Popup>
            <div className="popup-content">
              <strong>{incident.category}</strong>
              <p>{incident.description}</p>
              <p className="popup-address">{incident.address}</p>
              <p className="popup-time">
                {format(incident.timestamp, 'MMM d, yyyy h:mm a')}
              </p>
              <span className={`popup-badge popup-badge-${incident.type}`}>
                {incident.type.toUpperCase()}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
