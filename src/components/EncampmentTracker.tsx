import type { EncampmentStats, Incident } from '../types/incidents';

interface EncampmentTrackerProps {
  stats: EncampmentStats[];
  incidents: Incident[];
}

export function EncampmentTracker({ stats, incidents }: EncampmentTrackerProps) {
  const encampmentIncidents = incidents.filter(i => i.isEncampment).slice(0, 10);
  const totalOpen = stats.reduce((sum, s) => sum + s.openCount, 0);
  const totalClosed = stats.reduce((sum, s) => sum + s.closedCount, 0);

  return (
    <div className="encampment-tracker">
      <h3>Encampments</h3>
      <p className="chart-subtitle">
        {totalOpen + totalClosed} total — {totalOpen} open, {totalClosed} resolved
      </p>

      <div className="encampment-content">
        <div className="encampment-by-district">
          <h4>By District</h4>
          {stats.slice(0, 8).map(s => (
            <div key={s.district} className="encampment-district-row">
              <span className="district-name">District {s.district}</span>
              <div className="district-bar-container">
                <div
                  className="district-bar open"
                  style={{ width: `${(s.openCount / (s.count || 1)) * 100}%` }}
                />
                <div
                  className="district-bar closed"
                  style={{ width: `${(s.closedCount / (s.count || 1)) * 100}%` }}
                />
              </div>
              <span className="district-count">{s.count}</span>
            </div>
          ))}
          <div className="encampment-legend">
            <span className="legend-item"><span className="legend-dot open" /> Open</span>
            <span className="legend-item"><span className="legend-dot closed" /> Resolved</span>
          </div>
        </div>

        <div className="encampment-recent">
          <h4>Recent Tickets</h4>
          <div className="encampment-list">
            {encampmentIncidents.map(incident => (
              <div key={incident.id} className="encampment-item">
                <div className="encampment-item-header">
                  <span className={`encampment-status ${incident.status?.toLowerCase().includes('closed') ? 'closed' : 'open'}`}>
                    {incident.status?.toLowerCase().includes('closed') ? 'Resolved' : 'Open'}
                  </span>
                  <span className="encampment-district">D{incident.district}</span>
                </div>
                <div className="encampment-category">{incident.category}</div>
                <div className="encampment-address">{incident.address}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
