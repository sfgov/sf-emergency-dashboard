import { useState, useMemo } from 'react';
import {
  CITYWIDE, STATION_TOTAL, BUREAUS, MODIFIED_DUTY_BREAKDOWN,
  DAILY_ON_DUTY
} from './data/staffing';
import { CALL_DATA } from './data/calls';
import './App.css';

const STATION_NAMES: Record<string, string> = {
  cent: 'Central', sout: 'Southern', potr: 'Bayview', miss: 'Mission',
  nort: 'Northern', park: 'Park', rich: 'Richmond', ingl: 'Ingleside',
  tara: 'Taraval', tend: 'Tenderloin',
};

function App() {
  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [expandedBureau, setExpandedBureau] = useState<string | null>(null);

  const stationData = useMemo(() => {
    const stations = Object.keys(STATION_NAMES) as Array<keyof typeof DAILY_ON_DUTY>;

    return stations.map(key => {
      const name = STATION_NAMES[key];
      const officers = DAILY_ON_DUTY[key];
      const totalOfficers = officers.days + officers.elevens + officers.swings + officers.mids;
      const patrolOfficers = officers.days + officers.swings + officers.mids; // exclude 11's (footbeats)
      const callStats = CALL_DATA[key];
      const totalCalls = callStats ? callStats.daily.A + callStats.daily.B + callStats.daily.C : 0;
      const stationInfo = BUREAUS.fieldOps.units[key];

      return {
        key,
        name,
        officers,
        totalOfficers,
        patrolOfficers,
        calls: callStats,
        totalCalls: Math.round(totalCalls),
        callsPerOfficer: patrolOfficers > 0 ? totalCalls / patrolOfficers : 0,
        ranks: {
          capt: stationInfo?.capt || 0,
          lt: stationInfo?.lt || 0,
          sgt: stationInfo?.sgt || 0,
          off: stationInfo?.off || 0,
          total: stationInfo?.total || 0,
        },
      };
    }).sort((a, b) => b.callsPerOfficer - a.callsPerOfficer);
  }, []);

  const maxCalls = Math.max(...stationData.map(s => s.totalCalls));
  const maxOfficers = Math.max(...stationData.map(s => s.patrolOfficers));

  const bureauBreakdown = [
    { key: 'fieldOps', label: 'Field Operations', value: BUREAUS.fieldOps.total, detail: `${STATION_TOTAL} in stations`, units: BUREAUS.fieldOps.units },
    { key: 'investigations', label: 'Investigations', value: BUREAUS.investigations.total, units: (BUREAUS.investigations as any).units },
    { key: 'airport', label: 'Airport', value: BUREAUS.airport.total, units: (BUREAUS.airport as any).units },
    { key: 'specialOps', label: 'Special Ops', value: BUREAUS.specialOps.total, units: (BUREAUS.specialOps as any).units },
    { key: 'admin', label: 'Admin', value: BUREAUS.admin.total, units: (BUREAUS.admin as any).units },
    { key: 'chiefOfStaff', label: 'Chief of Staff', value: BUREAUS.chiefOfStaff.total, units: (BUREAUS.chiefOfStaff as any).units },
    { key: 'chiefsOffice', label: "Chief's Office", value: BUREAUS.chiefsOffice.total, units: (BUREAUS.chiefsOffice as any).units },
  ];

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-text">
            <h1>SFPD staffing analysis</h1>
          </div>
        </header>

        <section className="card">
          <div className="card-header">
            <h2>Staffing overview</h2>
          </div>

          <div className="waterfall">
            <div className="wf-row wf-start">
              <span className="wf-label">Target authorized</span>
              <span className="wf-value">{CITYWIDE.target.toLocaleString()}</span>
            </div>
            <div className="wf-row wf-subtract">
              <span className="wf-label">Shortage</span>
              <span className="wf-value">−{CITYWIDE.shortage.toLocaleString()}</span>
            </div>
            <div className="wf-row wf-result">
              <span className="wf-label">Full duty sworn</span>
              <span className="wf-value">{CITYWIDE.fullDuty.toLocaleString()}</span>
            </div>
            <div className="wf-row wf-note">
              <span className="wf-label">+ {MODIFIED_DUTY_BREAKDOWN.total} modified duty</span>
              <span className="wf-value">{CITYWIDE.totalSworn.toLocaleString()} total</span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Station workload</h2>
            <p>Patrol officers (excluding footbeats) vs calls for service. Sorted by calls per officer.</p>
          </div>

          <div className="chart-legend">
            <span className="chart-legend-item"><span className="legend-bar legend-officers"></span> Patrol officers/day</span>
            <span className="chart-legend-item"><span className="legend-bar legend-calls"></span> Calls/day</span>
          </div>

          <div className="station-chart">
            {stationData.map(station => {
              const isExpanded = expandedStation === station.key;
              const isHighWorkload = station.callsPerOfficer > 5;

              return (
                <div key={station.key} className="sc-row">
                  <button
                    className={`sc-header ${isExpanded ? 'sc-expanded' : ''}`}
                    onClick={() => setExpandedStation(isExpanded ? null : station.key)}
                  >
                    <span className="sc-name">{station.name}</span>
                    <span className="sc-bars">
                      <span className="sc-bar sc-officers" style={{ width: `${(station.patrolOfficers / maxOfficers) * 100}%` }}>
                        {station.patrolOfficers}
                      </span>
                      <span className="sc-bar sc-calls" style={{ width: `${(station.totalCalls / maxCalls) * 100}%` }}>
                        {station.totalCalls}
                      </span>
                    </span>
                    <span className={`sc-ratio ${isHighWorkload ? 'sc-ratio-high' : ''}`}>
                      {station.callsPerOfficer.toFixed(1)}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="sc-detail">
                      <div className="sc-detail-grid">
                        <div className="sc-detail-box">
                          <div className="sc-detail-label">Full duty assigned</div>
                          <div className="sc-detail-value">{station.ranks.total}</div>
                          <div className="sc-detail-sub">
                            {station.ranks.capt} Capt · {station.ranks.lt} Lt · {station.ranks.sgt} Sgt · {station.ranks.off} Off
                          </div>
                        </div>
                        <div className="sc-detail-box">
                          <div className="sc-detail-label">Daily on duty</div>
                          <div className="sc-detail-value">{station.totalOfficers}</div>
                          <div className="sc-detail-sub">
                            {station.officers.days} Days · {station.officers.elevens} 11's · {station.officers.swings} Swings · {station.officers.mids} Mids
                          </div>
                        </div>
                        <div className="sc-detail-box">
                          <div className="sc-detail-label">Calls by priority</div>
                          <div className="sc-detail-value">{station.totalCalls}/day</div>
                          <div className="sc-detail-sub sc-priority">
                            <span className="sc-pri-a">{station.calls?.daily.A || 0} A</span>
                            <span className="sc-pri-b">{station.calls?.daily.B || 0} B</span>
                            <span className="sc-pri-c">{station.calls?.daily.C || 0} C</span>
                          </div>
                        </div>
                      </div>
                      <div className="sc-detail-note">
                        11's are footbeat officers and excluded from calls/officer ratio.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sc-total">
            <span className="sc-total-label">All stations</span>
            <span className="sc-total-value">{stationData.reduce((s, d) => s + d.patrolOfficers, 0)} patrol officers</span>
            <span className="sc-total-value">{stationData.reduce((s, d) => s + d.totalCalls, 0)} calls/day</span>
            <span className="sc-total-ratio">
              {(stationData.reduce((s, d) => s + d.totalCalls, 0) / stationData.reduce((s, d) => s + d.patrolOfficers, 0)).toFixed(1)} calls/officer
            </span>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Where officers are assigned</h2>
            <p>{CITYWIDE.fullDuty.toLocaleString()} full duty officers by bureau. Click to see unit breakdown.</p>
          </div>

          <div className="bureau-breakdown">
            {bureauBreakdown.map(b => {
              const isExpanded = expandedBureau === b.key;
              const units = b.units ? Object.values(b.units) as Array<{name: string; total: number; capt?: number; lt?: number; sgt?: number; off?: number}> : [];

              return (
                <div key={b.key} className="bb-section">
                  <button
                    className={`bb-row bb-clickable ${isExpanded ? 'bb-expanded' : ''}`}
                    onClick={() => setExpandedBureau(isExpanded ? null : b.key)}
                  >
                    <span className="bb-label">
                      <span className="bb-expand">{units.length > 0 ? (isExpanded ? '▼' : '▶') : ''}</span>
                      {b.label}
                    </span>
                    <span className="bb-bar">
                      <span className="bb-fill" style={{ width: `${(b.value / CITYWIDE.fullDuty) * 100}%` }} />
                    </span>
                    <span className="bb-value">{b.value}</span>
                    <span className="bb-pct">{Math.round((b.value / CITYWIDE.fullDuty) * 100)}%</span>
                  </button>

                  {isExpanded && units.length > 0 && (
                    <div className="bb-units">
                      {units.map((unit: any) => (
                        <div key={unit.name} className="bb-unit">
                          <span className="bb-unit-name">{unit.name}</span>
                          <span className="bb-unit-ranks">
                            {unit.capt ? `${unit.capt} Capt` : ''}
                            {unit.lt ? ` ${unit.lt} Lt` : ''}
                            {unit.sgt ? ` ${unit.sgt} Sgt` : ''}
                            {unit.off ? ` ${unit.off} Off` : ''}
                          </span>
                          <span className="bb-unit-total">{unit.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="bb-row bb-total">
              <span className="bb-label">Total</span>
              <span className="bb-bar" />
              <span className="bb-value">{CITYWIDE.fullDuty.toLocaleString()}</span>
              <span className="bb-pct">100%</span>
            </div>
          </div>
        </section>

        <footer className="footer">
          Data: SFPD personnel records, SF OpenData CAD calls (30-day daily average, Oct 2026).
        </footer>
      </div>
    </div>
  );
}

export default App;
