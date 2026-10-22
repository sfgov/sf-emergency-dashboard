import { useState, useMemo } from 'react';
import {
  CITYWIDE, STATION_TOTAL, BUREAUS, DAILY_ON_DUTY
} from './data/staffing';
import { CALL_DATA, RESPONSE_TIMES, RESPONSE_TARGETS, type StationCalls } from './data/calls';
import './App.css';

const STATION_NAMES: Record<string, string> = {
  cent: 'Central', sout: 'Southern', potr: 'Bayview', miss: 'Mission',
  nort: 'Northern', park: 'Park', rich: 'Richmond', ingl: 'Ingleside',
  tara: 'Taraval', tend: 'Tenderloin',
};

function getShiftCallsPerHour(calls: StationCalls | undefined) {
  if (!calls) return {
    days: { A: 0, B: 0, C: 0 },
    swings: { A: 0, B: 0, C: 0 },
    mids: { A: 0, B: 0, C: 0 },
  };
  const h = calls.byHour;
  const sumByPriority = (start: number, end: number) => {
    let A = 0, B = 0, C = 0;
    for (let i = start; i < end; i++) {
      A += h[i].A;
      B += h[i].B;
      C += h[i].C;
    }
    return { A, B, C };
  };
  const addRanges = (r1: {A:number,B:number,C:number}, r2: {A:number,B:number,C:number}) => ({
    A: r1.A + r2.A, B: r1.B + r2.B, C: r1.C + r2.C
  });
  const divide = (r: {A:number,B:number,C:number}, n: number) => ({
    A: r.A / n, B: r.B / n, C: r.C / n
  });

  return {
    days: divide(sumByPriority(6, 16), 10),
    swings: divide(addRanges(sumByPriority(15, 24), sumByPriority(0, 1)), 10),
    mids: divide(addRanges(sumByPriority(21, 24), sumByPriority(0, 7)), 10),
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
      const responseTimes = RESPONSE_TIMES[key];

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
        responseTimes,
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
                      <span>{station.officers.swings}S</span>
                      <span>{station.officers.mids}M</span>
                    </span>
                    <span className="st-col">{station.totalCalls}</span>
                  </button>

                  {isExpanded && (
                    <div className="st-detail">
                      <div className="st-detail-grid">
                        <div className="st-detail-left">
                          <div className="st-detail-info">
                            <strong>{station.ranks.total} assigned</strong> · {station.ranks.capt} Capt · {station.ranks.lt} Lt · {station.ranks.sgt} Sgt · {station.ranks.off} Off
                          </div>
                          <table className="st-shift-table">
                            <thead>
                              <tr>
                                <th>Shift</th>
                                <th>Hours</th>
                                <th>Officers</th>
                                <th>Calls/hr</th>
                                <th>A</th>
                                <th>B</th>
                                <th>C</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Days</td>
                                <td>6am–4pm</td>
                                <td>{station.officers.days}</td>
                                <td>{(station.shiftCalls.days.A + station.shiftCalls.days.B + station.shiftCalls.days.C).toFixed(1)}</td>
                                <td className="st-pri-a">{station.shiftCalls.days.A.toFixed(1)}</td>
                                <td className="st-pri-b">{station.shiftCalls.days.B.toFixed(1)}</td>
                                <td>{station.shiftCalls.days.C.toFixed(1)}</td>
                              </tr>
                              <tr>
                                <td>Swings</td>
                                <td>3pm–1am</td>
                                <td>{station.officers.swings}</td>
                                <td>{(station.shiftCalls.swings.A + station.shiftCalls.swings.B + station.shiftCalls.swings.C).toFixed(1)}</td>
                                <td className="st-pri-a">{station.shiftCalls.swings.A.toFixed(1)}</td>
                                <td className="st-pri-b">{station.shiftCalls.swings.B.toFixed(1)}</td>
                                <td>{station.shiftCalls.swings.C.toFixed(1)}</td>
                              </tr>
                              <tr>
                                <td>Mids</td>
                                <td>9pm–7am</td>
                                <td>{station.officers.mids}</td>
                                <td>{(station.shiftCalls.mids.A + station.shiftCalls.mids.B + station.shiftCalls.mids.C).toFixed(1)}</td>
                                <td className="st-pri-a">{station.shiftCalls.mids.A.toFixed(1)}</td>
                                <td className="st-pri-b">{station.shiftCalls.mids.B.toFixed(1)}</td>
                                <td>{station.shiftCalls.mids.C.toFixed(1)}</td>
                              </tr>
                              {station.officers.elevens > 0 && (
                                <tr className="st-footbeat-row">
                                  <td>Footbeats</td>
                                  <td>11am–9pm</td>
                                  <td>{station.officers.elevens}</td>
                                  <td colSpan={4} className="st-muted">don't respond to calls</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {station.responseTimes && (
                          <div className="st-detail-right">
                            <div className="st-response-title">Response time</div>
                            <div className="st-response-subtitle">30-day median</div>
                            <div className="st-response-list">
                              <div className={`st-response-item ${station.responseTimes.A.median > RESPONSE_TARGETS.A ? 'st-over' : ''}`}>
                                <span className="st-response-pri st-pri-a">A</span>
                                <span className="st-response-val">{station.responseTimes.A.median}m</span>
                                <span className="st-response-tgt">/ {RESPONSE_TARGETS.A}m</span>
                              </div>
                              <div className={`st-response-item ${station.responseTimes.B.median > RESPONSE_TARGETS.B ? 'st-over' : ''}`}>
                                <span className="st-response-pri st-pri-b">B</span>
                                <span className="st-response-val">{station.responseTimes.B.median}m</span>
                                <span className="st-response-tgt">/ {RESPONSE_TARGETS.B}m</span>
                              </div>
                              <div className={`st-response-item ${station.responseTimes.C.median > RESPONSE_TARGETS.C ? 'st-over' : ''}`}>
                                <span className="st-response-pri">C</span>
                                <span className="st-response-val">{station.responseTimes.C.median}m</span>
                                <span className="st-response-tgt">/ {RESPONSE_TARGETS.C}m</span>
                              </div>
                            </div>
                          </div>
                        )}
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
                            <span className="bb-rank">{unit.capt ? `${unit.capt} Capt` : ''}</span>
                            <span className="bb-rank">{unit.lt ? `${unit.lt} Lt` : ''}</span>
                            <span className="bb-rank">{unit.sgt ? `${unit.sgt} Sgt` : ''}</span>
                            <span className="bb-rank">{unit.off ? `${unit.off} Off` : ''}</span>
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
