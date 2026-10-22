import { useState, useMemo } from 'react';
import {
  CITYWIDE, STATION_TOTAL, BUREAUS, MODIFIED_DUTY_BREAKDOWN,
  DAILY_ON_DUTY, DAILY_TOTALS
} from './data/staffing';
import { CALL_DATA, getShiftCalls } from './data/calls';
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
      const callStats = CALL_DATA[key];
      const totalCalls = callStats ? callStats.daily.A + callStats.daily.B + callStats.daily.C : 0;
      const stationInfo = BUREAUS.fieldOps.units[key];

      return {
        key,
        name,
        officers,
        totalOfficers,
        calls: callStats,
        totalCalls: Math.round(totalCalls),
        callsPerOfficer: totalOfficers > 0 ? totalCalls / totalOfficers : 0,
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
            <h2>Station workload by shift</h2>
            <p>Officers on duty vs calls for service. Click to see hourly breakdown.</p>
          </div>

          <div className="station-table">
            <div className="st-header">
              <span className="st-name">Station</span>
              <span className="st-officers">Officers/day</span>
              <span className="st-calls">Calls/day</span>
              <span className="st-ratio">Calls/officer</span>
            </div>

            {stationData.map(station => {
              const isExpanded = expandedStation === station.key;
              const isHighWorkload = station.callsPerOfficer > 4;

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
                    <span className="st-officers">{station.totalOfficers}</span>
                    <span className="st-calls">{station.totalCalls}</span>
                    <span className={`st-ratio ${isHighWorkload ? 'st-ratio-high' : ''}`}>
                      {station.callsPerOfficer.toFixed(1)}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="st-detail">
                      <div className="st-detail-section">
                        <div className="st-detail-title">Assigned personnel ({station.ranks.total} full duty)</div>
                        <div className="st-ranks">
                          <span className="st-rank">Capt: {station.ranks.capt}</span>
                          <span className="st-rank">Lt: {station.ranks.lt}</span>
                          <span className="st-rank">Sgt: {station.ranks.sgt}</span>
                          <span className="st-rank">Officers: {station.ranks.off}</span>
                        </div>
                      </div>

                      <div className="st-detail-section">
                        <div className="st-detail-title">Calls by priority (daily avg)</div>
                        <div className="st-priority-row">
                          <span className="st-pri st-pri-a">Priority A: {station.calls?.daily.A || 0}</span>
                          <span className="st-pri st-pri-b">Priority B: {station.calls?.daily.B || 0}</span>
                          <span className="st-pri st-pri-c">Priority C: {station.calls?.daily.C || 0}</span>
                        </div>
                      </div>

                      <div className="st-detail-section">
                        <div className="st-detail-title">By shift</div>
                        <div className="st-detail-header">
                          <span className="st-shift-label">Shift</span>
                          <span className="st-shift-hours">Hours</span>
                          <span className="st-shift-officers">Officers</span>
                          <span className="st-shift-calls">Calls</span>
                          <span className="st-shift-ratio">Per officer</span>
                        </div>
                        {[
                          { key: 'days', label: 'Days', hours: '6am–4pm', color: '#2a78d6' },
                          { key: 'elevens', label: "11's", hours: '11am–9pm', color: '#9333ea' },
                          { key: 'swings', label: 'Swings', hours: '3pm–1am', color: '#eb6834' },
                          { key: 'mids', label: 'Mids', hours: '9pm–7am', color: '#1baf7a' },
                        ].map(shift => {
                          const off = station.officers[shift.key as keyof typeof station.officers];
                          const shiftCalls = getShiftCalls(station.key, shift.key as 'days' | 'elevens' | 'swings' | 'mids');
                          const totalShiftCalls = shiftCalls.A + shiftCalls.B + shiftCalls.C;
                          const ratio = off > 0 ? totalShiftCalls / off : 0;
                          const isShiftHigh = ratio > 5;
                          return (
                            <div key={shift.key} className={`st-detail-row ${isShiftHigh ? 'st-detail-high' : ''}`}>
                              <span className="st-shift-label">
                                <span className="st-shift-dot" style={{ background: shift.color }} />
                                {shift.label}
                              </span>
                              <span className="st-shift-hours">{shift.hours}</span>
                              <span className="st-shift-officers">{off}</span>
                              <span className="st-shift-calls">{Math.round(totalShiftCalls)}</span>
                              <span className={`st-shift-ratio ${isShiftHigh ? 'st-ratio-high' : ''}`}>
                                {ratio.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="st-row st-total">
              <span className="st-name">Total (all stations)</span>
              <span className="st-officers">{DAILY_TOTALS.total}</span>
              <span className="st-calls">{stationData.reduce((s, d) => s + d.totalCalls, 0)}</span>
              <span className="st-ratio">
                {(stationData.reduce((s, d) => s + d.totalCalls, 0) / DAILY_TOTALS.total).toFixed(1)}
              </span>
            </div>
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
