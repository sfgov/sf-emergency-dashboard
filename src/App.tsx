import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useIncidents } from './hooks/useIncidents';
import { ChevronRight, ChevronLeft, Calendar, MapPin, AlertTriangle, Building2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './App.css';

type TimeRange = 'week' | 'month' | '3months';
type DrillLevel = 'city' | 'district' | 'station';
type TimeBucket = 'overnight' | 'morning' | 'afternoon' | 'evening';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const TIME_BUCKETS: Record<TimeBucket, { label: string; hours: number[] }> = {
  overnight: { label: 'Overnight (10p-6a)', hours: [22, 23, 0, 1, 2, 3, 4, 5] },
  morning: { label: 'Morning (6a-12p)', hours: [6, 7, 8, 9, 10, 11] },
  afternoon: { label: 'Afternoon (12p-6p)', hours: [12, 13, 14, 15, 16, 17] },
  evening: { label: 'Evening (6p-10p)', hours: [18, 19, 20, 21] },
};

function getTimeBucket(hour: number): TimeBucket {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'overnight';
}

function getPriorityColor(priority?: string): string {
  if (!priority) return '#737373';
  const p = priority.toUpperCase().charAt(0);
  if (p === 'A' || p === '1' || p === 'E' || p === '3') return '#ff3b30';
  if (p === 'B' || p === '2') return '#ff9f0a';
  return '#30d158';
}

function getIncidentColor(incident: { type: string; isEncampment?: boolean; priority?: string }): string {
  if (incident.isEncampment) return '#ff6b35';
  if (incident.type === 'police') return '#3b82f6';
  if (incident.type === 'fire' || incident.type === 'cad') return getPriorityColor(incident.priority);
  return '#737373';
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useMemo(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [drillLevel, setDrillLevel] = useState<DrillLevel>('city');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showEncampmentsOnly, setShowEncampmentsOnly] = useState(false);

  const apiTimeRange = timeRange === '3months' ? 'month' : timeRange;
  const { incidents, loading, error, refetch } = useIncidents(apiTimeRange);

  const filteredIncidents = useMemo(() => {
    let filtered = incidents;

    if (selectedDistrict) {
      filtered = filtered.filter(i =>
        i.district === selectedDistrict ||
        i.district === `District ${selectedDistrict}` ||
        i.neighborhood === selectedDistrict
      );
    }

    if (selectedStation) {
      filtered = filtered.filter(i => i.station === selectedStation);
    }

    if (showEncampmentsOnly) {
      filtered = filtered.filter(i => i.isEncampment);
    }

    return filtered;
  }, [incidents, selectedDistrict, selectedStation, showEncampmentsOnly]);

  const stats = useMemo(() => {
    const incidentsWithPriority = filteredIncidents.filter(i => i.priority);

    const priorityA = incidentsWithPriority.filter(i => {
      const p = i.priority!.toUpperCase();
      return p === '3' || p === 'E' || p === 'A';
    }).length;

    const priorityB = incidentsWithPriority.filter(i => {
      const p = i.priority!.toUpperCase();
      return p === '2' || p === 'B';
    }).length;

    const priorityC = incidentsWithPriority.filter(i => {
      const p = i.priority!.toUpperCase();
      return p === '1' || p === 'C';
    }).length;

    const encampments = filteredIncidents.filter(i => i.isEncampment).length;

    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;

    const timeBuckets = {
      overnight: 0,
      morning: 0,
      afternoon: 0,
      evening: 0,
    };

    filteredIncidents.forEach(i => {
      if (i.timestamp && !isNaN(i.timestamp.getTime())) {
        const bucket = getTimeBucket(i.timestamp.getHours());
        timeBuckets[bucket]++;
      }
    });

    const callTypes = new Map<string, number>();
    filteredIncidents.forEach(i => {
      const cat = i.category || 'Unknown';
      callTypes.set(cat, (callTypes.get(cat) || 0) + 1);
    });
    const topCallTypes = Array.from(callTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const districts = new Map<string, number>();
    incidents.forEach(i => {
      districts.set(i.district, (districts.get(i.district) || 0) + 1);
    });
    const districtList = Array.from(districts.entries())
      .sort((a, b) => b[1] - a[1]);

    const stations = new Map<string, number>();
    filteredIncidents.forEach(i => {
      if (i.station) {
        stations.set(i.station, (stations.get(i.station) || 0) + 1);
      }
    });
    const stationList = Array.from(stations.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      total: filteredIncidents.length,
      priorityA,
      priorityB,
      priorityC,
      encampments,
      perDay: {
        total: Math.round(filteredIncidents.length / days),
        priorityA: Math.round(priorityA / days),
        priorityB: Math.round(priorityB / days),
        priorityC: Math.round(priorityC / days),
      },
      timeBuckets,
      topCallTypes,
      districtList,
      stationList,
    };
  }, [filteredIncidents, incidents, timeRange]);

  const mapCenter: [number, number] = useMemo(() => {
    if (selectedDistrict && filteredIncidents.length > 0) {
      const avgLat = filteredIncidents.reduce((sum, i) => sum + i.latitude, 0) / filteredIncidents.length;
      const avgLng = filteredIncidents.reduce((sum, i) => sum + i.longitude, 0) / filteredIncidents.length;
      return [avgLat, avgLng];
    }
    return [37.7749, -122.4194];
  }, [selectedDistrict, filteredIncidents]);

  const mapZoom = drillLevel === 'city' ? 12 : drillLevel === 'district' ? 13 : 14;

  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(district);
    setDrillLevel('district');
    setSelectedStation(null);
  };

  const handleStationClick = (station: string) => {
    setSelectedStation(station);
    setDrillLevel('station');
  };

  const handleBack = () => {
    if (drillLevel === 'station') {
      setSelectedStation(null);
      setDrillLevel('district');
    } else if (drillLevel === 'district') {
      setSelectedDistrict(null);
      setDrillLevel('city');
    }
  };

  const handleHome = () => {
    setSelectedDistrict(null);
    setSelectedStation(null);
    setDrillLevel('city');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>SF Emergency Response</h1>
          <div className="breadcrumb">
            <button onClick={handleHome} className={drillLevel === 'city' ? 'active' : ''}>
              City
            </button>
            {selectedDistrict && (
              <>
                <ChevronRight size={14} />
                <button
                  onClick={() => { setSelectedStation(null); setDrillLevel('district'); }}
                  className={drillLevel === 'district' ? 'active' : ''}
                >
                  {selectedDistrict}
                </button>
              </>
            )}
            {selectedStation && (
              <>
                <ChevronRight size={14} />
                <span className="active">Station {selectedStation}</span>
              </>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="time-selector">
            <Calendar size={14} />
            <button
              className={timeRange === 'week' ? 'active' : ''}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button
              className={timeRange === 'month' ? 'active' : ''}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button
              className={timeRange === '3months' ? 'active' : ''}
              onClick={() => setTimeRange('3months')}
            >
              3 Mo
            </button>
          </div>
          <button className="refresh-btn" onClick={refetch}>
            Refresh
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="map-panel">
          {drillLevel !== 'city' && (
            <button className="back-btn" onClick={handleBack}>
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          <div className="map-controls">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showEncampmentsOnly}
                onChange={(e) => setShowEncampmentsOnly(e.target.checked)}
              />
              Encampments only
            </label>
          </div>

          {loading && <div className="map-loading">Loading...</div>}
          {error && <div className="map-error">{error}</div>}

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="map"
            zoomControl={false}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
              attribution='&copy; Mapbox'
            />
            {filteredIncidents.map(incident => (
              <CircleMarker
                key={incident.id}
                center={[incident.latitude, incident.longitude]}
                radius={incident.isEncampment ? 6 : 4}
                fillColor={getIncidentColor(incident)}
                fillOpacity={0.7}
                stroke={incident.isEncampment}
                color="#fff"
                weight={incident.isEncampment ? 2 : 0}
                eventHandlers={{
                  click: () => {
                    if (drillLevel === 'city' && incident.district) {
                      handleDistrictClick(incident.district);
                    } else if (drillLevel === 'district' && incident.station) {
                      handleStationClick(incident.station);
                    }
                  }
                }}
              >
                <Popup>
                  <div className="popup-content">
                    <strong>{incident.category}</strong>
                    <p>{incident.description}</p>
                    <p className="popup-meta">
                      {incident.district} {incident.station && `• Station ${incident.station}`}
                    </p>
                    <p className="popup-time">
                      {incident.timestamp.toLocaleString()}
                    </p>
                    {incident.isEncampment && (
                      <span className="popup-tag encampment">Encampment</span>
                    )}
                    {incident.priority && (
                      <span className="popup-tag" style={{ background: getPriorityColor(incident.priority) }}>
                        Priority {incident.priority}
                      </span>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="map-legend">
            <span><span className="dot" style={{ background: '#3b82f6' }}></span>Police</span>
            <span><span className="dot" style={{ background: '#ff3b30' }}></span>Priority A</span>
            <span><span className="dot" style={{ background: '#ff9f0a' }}></span>Priority B</span>
            <span><span className="dot" style={{ background: '#30d158' }}></span>Priority C</span>
            <span><span className="dot encampment-dot" style={{ background: '#ff6b35' }}></span>Encampment</span>
          </div>
        </div>

        <div className="analytics-panel">
          <div className="stats-grid">
            <div className="stat-card priority-a">
              <div className="stat-label">Priority A</div>
              <div className="stat-value">{stats.priorityA.toLocaleString()}</div>
              <div className="stat-sub">{stats.perDay.priorityA}/day</div>
            </div>
            <div className="stat-card priority-b">
              <div className="stat-label">Priority B</div>
              <div className="stat-value">{stats.priorityB.toLocaleString()}</div>
              <div className="stat-sub">{stats.perDay.priorityB}/day</div>
            </div>
            <div className="stat-card priority-c">
              <div className="stat-label">Priority C</div>
              <div className="stat-value">{stats.priorityC.toLocaleString()}</div>
              <div className="stat-sub">{stats.perDay.priorityC}/day</div>
            </div>
            <div className="stat-card encampment">
              <div className="stat-label">Encampment 311</div>
              <div className="stat-value">{stats.encampments.toLocaleString()}</div>
              <div className="stat-sub">{Math.round(stats.encampments / (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90))}/day</div>
            </div>
          </div>

          <div className="section">
            <h3><AlertTriangle size={14} /> Time of Day</h3>
            <div className="time-buckets">
              {(Object.keys(TIME_BUCKETS) as TimeBucket[]).map(bucket => (
                <div key={bucket} className="time-bucket">
                  <div className="bucket-label">{TIME_BUCKETS[bucket].label}</div>
                  <div className="bucket-bar">
                    <div
                      className="bucket-fill"
                      style={{
                        width: `${(stats.timeBuckets[bucket] / Math.max(...Object.values(stats.timeBuckets), 1)) * 100}%`
                      }}
                    />
                  </div>
                  <div className="bucket-count">{stats.timeBuckets[bucket].toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Top Call Types</h3>
            <div className="call-types-list">
              {stats.topCallTypes.map(([type, count]) => (
                <div key={type} className="call-type-row">
                  <span className="call-type-name">{type}</span>
                  <span className="call-type-count">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {drillLevel === 'city' && (
            <div className="section">
              <h3><MapPin size={14} /> Districts</h3>
              <div className="district-list">
                {stats.districtList.slice(0, 12).map(([district, count]) => (
                  <button
                    key={district}
                    className="district-row"
                    onClick={() => handleDistrictClick(district)}
                  >
                    <span className="district-name">{district}</span>
                    <span className="district-count">{count.toLocaleString()}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {drillLevel === 'district' && stats.stationList.length > 0 && (
            <div className="section">
              <h3><Building2 size={14} /> Stations</h3>
              <div className="station-list">
                {stats.stationList.map(([station, count]) => (
                  <button
                    key={station}
                    className="station-row"
                    onClick={() => handleStationClick(station)}
                  >
                    <span className="station-name">Station {station}</span>
                    <span className="station-count">{count.toLocaleString()}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="total-footer">
            Total: {stats.total.toLocaleString()} incidents ({stats.perDay.total}/day)
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
