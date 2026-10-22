import { useState, useMemo } from 'react';
import { useDistrictCalls } from './hooks/useIncidents';
import {
  CITYWIDE, STATION_TOTAL, BUREAUS, MODIFIED_DUTY_BREAKDOWN,
  DAILY_ON_DUTY, DAILY_TOTALS
} from './data/staffing';
import './App.css';

const STATION_CODE_MAP: Record<string, string> = {
  CENTRAL: 'cent', SOUTHERN: 'sout', BAYVIEW: 'potr', MISSION: 'miss',
  NORTHERN: 'nort', PARK: 'park', RICHMOND: 'rich', INGLESIDE: 'ingl',
  TARAVAL: 'tara', TENDERLOIN: 'tend',
};

const STATION_NAMES: Record<string, string> = {
  cent: 'Central', sout: 'Southern', potr: 'Bayview', miss: 'Mission',
  nort: 'Northern', park: 'Park', rich: 'Richmond', ingl: 'Ingleside',
  tara: 'Taraval', tend: 'Tenderloin',
};

function App() {
  const { data: callData, loading: callsLoading } = useDistrictCalls();
  const [expandedStation, setExpandedStation] = useState<string | null>(null);

  const stationData = useMemo(() => {
    const stations = Object.keys(STATION_NAMES) as Array<keyof typeof DAILY_ON_DUTY>;

    return stations.map(key => {
      const name = STATION_NAMES[key];
      const officers = DAILY_ON_DUTY[key];
      const totalOfficers = officers.days + officers.elevens + officers.swings + officers.mids;
      const callStats = callData.find(c => STATION_CODE_MAP[c.district] === key);

      return {
        key,
        name,
        officers,
        totalOfficers,
        calls: callStats,
        totalCalls: callStats?.total || 0,
        callsPerOfficer: totalOfficers > 0 && callStats ? callStats.total / totalOfficers : 0,
      };
    }).sort((a, b) => b.callsPerOfficer - a.callsPerOfficer);
  }, [callData]);

  const bureauBreakdown = [
    { label: 'Field Operations', value: BUREAUS.fieldOps.total, detail: `${STATION_TOTAL} stations` },
    { label: 'Investigations', value: BUREAUS.investigations.total },
    { label: 'Airport', value: BUREAUS.airport.total },
    { label: 'Special Ops', value: BUREAUS.specialOps.total },
    { label: 'Admin', value: BUREAUS.admin.total },
    { label: "Chief's Office", value: BUREAUS.chiefOfStaff.total + BUREAUS.chiefsOffice.total },
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
              <span className="wf-label">+ Modified duty (not counted above)</span>
              <span className="wf-value">{MODIFIED_DUTY_BREAKDOWN.total}</span>
            </div>
          </div>

          <div className="section-divider" />

          <div className="card-header">
            <h2>Where officers are assigned</h2>
          </div>

          <div className="bureau-breakdown">
            {bureauBreakdown.map(b => (
              <div key={b.label} className="bb-row">
                <span className="bb-label">{b.label}</span>
                <span className="bb-bar">
                  <span className="bb-fill" style={{ width: `${(b.value / CITYWIDE.fullDuty) * 100}%` }} />
                </span>
                <span className="bb-value">{b.value}</span>
                <span className="bb-pct">{Math.round((b.value / CITYWIDE.fullDuty) * 100)}%</span>
              </div>
            ))}
            <div className="bb-row bb-total">
              <span className="bb-label">Total</span>
              <span className="bb-bar" />
              <span className="bb-value">{CITYWIDE.fullDuty.toLocaleString()}</span>
              <span className="bb-pct">100%</span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Station workload: officers vs calls</h2>
            <p>Click a station to see shift breakdown. Sorted by calls per officer (highest workload first).</p>
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
              const isHighWorkload = station.callsPerOfficer > 2.5;

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
                    <span className="st-calls">{callsLoading ? '...' : station.totalCalls}</span>
                    <span className={`st-ratio ${isHighWorkload ? 'st-ratio-high' : ''}`}>
                      {callsLoading ? '...' : station.callsPerOfficer.toFixed(1)}
                    </span>
                  </button>

                  {isExpanded && station.calls && (
                    <div className="st-detail">
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
                        const calls = station.calls?.byShift[shift.key as keyof typeof station.calls.byShift] || 0;
                        const ratio = off > 0 ? calls / off : 0;
                        const isShiftHigh = ratio > 3;
                        return (
                          <div key={shift.key} className={`st-detail-row ${isShiftHigh ? 'st-detail-high' : ''}`}>
                            <span className="st-shift-label">
                              <span className="st-shift-dot" style={{ background: shift.color }} />
                              {shift.label}
                            </span>
                            <span className="st-shift-hours">{shift.hours}</span>
                            <span className="st-shift-officers">{off}</span>
                            <span className="st-shift-calls">{calls}</span>
                            <span className={`st-shift-ratio ${isShiftHigh ? 'st-ratio-high' : ''}`}>
                              {ratio.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="st-row st-total">
              <span className="st-name">Total (all stations)</span>
              <span className="st-officers">{DAILY_TOTALS.total}</span>
              <span className="st-calls">{callsLoading ? '...' : stationData.reduce((s, d) => s + d.totalCalls, 0)}</span>
              <span className="st-ratio">
                {callsLoading ? '...' : (stationData.reduce((s, d) => s + d.totalCalls, 0) / DAILY_TOTALS.total).toFixed(1)}
              </span>
            </div>
          </div>
        </section>

        <footer className="footer">
          Data: SFPD personnel records, SF OpenData CAD calls (30-day daily average).
        </footer>
      </div>
    </div>
  );
}

export default App;
