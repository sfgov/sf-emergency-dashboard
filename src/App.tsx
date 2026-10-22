import { useState, useMemo } from 'react';
import {
  CITYWIDE, STATION_TOTAL, BUREAUS, DAILY_ON_DUTY
} from './data/staffing';
import { CALL_DATA, type StationCalls } from './data/calls';
import './App.css';

const STATION_NAMES: Record<string, string> = {
  cent: 'Central', sout: 'Southern', potr: 'Bayview', miss: 'Mission',
  nort: 'Northern', park: 'Park', rich: 'Richmond', ingl: 'Ingleside',
  tara: 'Taraval', tend: 'Tenderloin',
};

function getShiftCallsPerHour(calls: StationCalls | undefined) {
  if (!calls) return { days: 0, elevens: 0, swings: 0, mids: 0 };
  const h = calls.byHour;
  const sum = (start: number, end: number) => {
    let total = 0;
    for (let i = start; i < end; i++) {
      total += h[i].A + h[i].B + h[i].C;
    }
    return total;
  };
  return {
    days: (sum(6, 16)) / 10,      // 6am-4pm
    elevens: (sum(11, 21)) / 10,  // 11am-9pm
    swings: (sum(15, 24) + sum(0, 1)) / 10,  // 3pm-1am
    mids: (sum(21, 24) + sum(0, 7)) / 10,    // 9pm-7am
  };
}

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

      const shiftCalls = getShiftCallsPerHour(callStats);

      return {
        key,
        name,
        officers,
        totalOfficers,
        patrolOfficers,
        calls: callStats,
        totalCalls: Math.round(totalCalls),
        callsPerOfficer: patrolOfficers > 0 ? totalCalls / patrolOfficers : 0,
        shiftCalls,
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

  const bureauBreakdown = [
    { key: 'fieldOps', label: 'Field Operations', value: BUREAUS.fieldOps.total, detail: `${STATION_TOTAL} in stations`, units: BUREAUS.fieldOps.units },
    { key: 'investigations', label: 'Investigations', value: BUREAUS.investigations.total, units: (BUREAUS.investigations as any).units },
    { key: 'airport', label: 'Airport', value: BUREAUS.airport.total, units: (BUREAUS.airport as any).units },
    { key: 'specialOps', label: 'Special Ops', value: BUREAUS.specialOps.total, units: (BUREAUS.specialOps as any).units },
    { key: 'admin', label: 'Admin', value: BUREAUS.admin.total, units: (BUREAUS.admin as any).units },
    { key: 'chiefOfStaff', label: 'Chief of Staff', value: BUREAUS.chiefOfStaff.total, units: (BUREAUS.chiefOfStaff as any).units },
    { key: 'chiefsOffice', label: "Chief's Office", value: BUREAUS.chiefsOffice.total, units: (BUREAUS.chiefsOffice as any).units },
    { key: 'partTime', label: 'Part-time officers', value: CITYWIDE.partTime },
  ];

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-text">
            <h1>SFPD staffing analysis</h1>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-label">Staffing Target</span>
              <span className="header-stat-value">{CITYWIDE.target.toLocaleString()}</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Current City Staffing</span>
              <span className="header-stat-value">{CITYWIDE.currentStaffing.toLocaleString()}</span>
            </div>
          </div>
        </header>

        <section className="card">
          <div className="card-header">
            <h2>Station workload</h2>
            <p>Patrol officers (excluding footbeats) vs calls for service. Click a station to see details.</p>
          </div>

          <div className="station-table">
            <div className="st-header">
              <span className="st-name">Station</span>
              <span className="st-col">Total</span>
              <span className="st-col">Patrol/day</span>
              <span className="st-col-wide">Patrol/shift</span>
              <span className="st-col">Calls/day</span>
            </div>

            {stationData.map(station => {
              const isExpanded = expandedStation === station.key;
              const isHighWorkload = station.callsPerOfficer > 5;

              return (
                <div key={station.key} className="st-station">
                  <button
                    className={`st-row ${isHighWorkload ? 'st-high' : ''} ${isExpanded ? 'st-expanded' : ''}`}
                    onClick={() => setExpandedStation(isExpanded ? null : station.key)}
                  >
                    <span className="st-name">
                      <span className="st-expand">{isExpanded ? '▼' : '▶'}</span>
                      {station.name}
                    </span>
                    <span className="st-col">{station.ranks.total}</span>
                    <span className="st-col">{station.patrolOfficers}</span>
                    <span className="st-col-wide st-shift-cols">
                      <span>{station.officers.days}D</span>
                      <span>{station.officers.elevens}E</span>
                      <span>{station.officers.swings}S</span>
                      <span>{station.officers.mids}M</span>
                    </span>
                    <span className="st-col">{station.totalCalls}</span>
                  </button>

                  {isExpanded && (
                    <div className="st-detail">
                      <div className="st-detail-section">
                        <div className="st-detail-title">Assigned</div>
                        <div className="st-detail-row">
                          <span className="st-detail-label">Total full duty:</span>
                          <span className="st-detail-value">{station.ranks.total}</span>
                          <span className="st-detail-sub">({station.ranks.capt} Capt · {station.ranks.lt} Lt · {station.ranks.sgt} Sgt · {station.ranks.off} Off)</span>
                        </div>
                      </div>

                      <div className="st-detail-section">
                        <div className="st-detail-title">By shift</div>
                        <table className="st-shift-table">
                          <thead>
                            <tr>
                              <th>Shift</th>
                              <th>Hours</th>
                              <th>Officers/day</th>
                              <th>Calls/hr</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Days</td>
                              <td>6am–4pm</td>
                              <td>{station.officers.days}</td>
                              <td>{station.shiftCalls.days.toFixed(1)}</td>
                            </tr>
                            <tr>
                              <td>11's</td>
                              <td>11am–9pm</td>
                              <td>{station.officers.elevens}</td>
                              <td className="st-muted">{station.shiftCalls.elevens.toFixed(1)}*</td>
                            </tr>
                            <tr>
                              <td>Swings</td>
                              <td>3pm–1am</td>
                              <td>{station.officers.swings}</td>
                              <td>{station.shiftCalls.swings.toFixed(1)}</td>
                            </tr>
                            <tr>
                              <td>Mids</td>
                              <td>9pm–7am</td>
                              <td>{station.officers.mids}</td>
                              <td>{station.shiftCalls.mids.toFixed(1)}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="st-detail-note">*11's are footbeat officers—don't respond to calls for service</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="st-row st-total">
              <span className="st-name">All stations</span>
              <span className="st-col">{stationData.reduce((s, d) => s + d.patrolOfficers, 0)}</span>
              <span className="st-col">{stationData.reduce((s, d) => s + d.totalCalls, 0)}</span>
              <span className="st-col">
                {(stationData.reduce((s, d) => s + d.totalCalls, 0) / stationData.reduce((s, d) => s + d.patrolOfficers, 0)).toFixed(1)}
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Where officers are assigned</h2>
            <p>{CITYWIDE.currentStaffing.toLocaleString()} officers by bureau. Click to see unit breakdown.</p>
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
                    <span className="bb-value">{b.value}</span>
                    <span className="bb-pct">{Math.round((b.value / CITYWIDE.currentStaffing) * 100)}%</span>
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
              <span className="bb-value">{CITYWIDE.currentStaffing.toLocaleString()}</span>
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
