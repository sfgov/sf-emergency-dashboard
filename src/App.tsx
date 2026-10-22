import { useMemo } from 'react';
import { useDistrictCalls } from './hooks/useIncidents';
import {
  CITYWIDE, STATION_TOTAL, BUREAUS,
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

const SHIFT_COLORS = {
  days: '#2a78d6',
  elevens: '#9333ea',
  swings: '#eb6834',
  mids: '#1baf7a',
};

function App() {
  const { data: callData, loading: callsLoading } = useDistrictCalls();

  const stationData = useMemo(() => {
    const stations = Object.keys(STATION_NAMES) as Array<keyof typeof DAILY_ON_DUTY>;
    const maxOfficers = Math.max(...stations.map(k => {
      const d = DAILY_ON_DUTY[k];
      return d.days + d.elevens + d.swings + d.mids;
    }));

    return stations.map(key => {
      const name = STATION_NAMES[key];
      const daily = DAILY_ON_DUTY[key];
      const totalOfficers = daily.days + daily.elevens + daily.swings + daily.mids;
      const callStats = callData.find(c => STATION_CODE_MAP[c.district] === key);
      const totalCalls = callStats ? callStats.total : 0;
      const callsPerOfficer = totalOfficers > 0 ? totalCalls / totalOfficers : 0;

      return {
        key,
        name,
        daily,
        totalOfficers,
        maxOfficers,
        calls: callStats || { priorityA: 0, priorityB: 0, priorityC: 0, total: 0 },
        totalCalls,
        callsPerOfficer,
      };
    }).sort((a, b) => b.callsPerOfficer - a.callsPerOfficer);
  }, [callData]);

  const maxCalls = Math.max(...stationData.map(s => s.totalCalls), 1);
  const maxRatio = Math.max(...stationData.map(s => s.callsPerOfficer), 1);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-text">
            <h1>SFPD station workload</h1>
            <p>Which stations are stretched thin? Officers on duty vs calls for service.</p>
          </div>
        </header>

        <section className="summary-bar">
          <div className="summary-item">
            <span className="summary-label">Full duty officers</span>
            <span className="summary-value">{CITYWIDE.fullDuty.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Station patrol</span>
            <span className="summary-value">{STATION_TOTAL.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">On duty daily</span>
            <span className="summary-value">{DAILY_TOTALS.total}</span>
          </div>
          <div className="summary-item summary-shortage">
            <span className="summary-label">Shortage</span>
            <span className="summary-value">−{CITYWIDE.shortage.toLocaleString()}</span>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Stations ranked by workload</h2>
            <p>Sorted by calls per officer — higher = more stretched. Daily averages over last 30 days.</p>
          </div>

          <div className="legend-row">
            <span className="legend-item"><span className="legend-swatch" style={{ background: SHIFT_COLORS.days }} /> Days 6a-4p</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: SHIFT_COLORS.elevens }} /> 11's 11a-9p</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: SHIFT_COLORS.swings }} /> Swings 3p-1a</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: SHIFT_COLORS.mids }} /> Mids 9p-7a</span>
          </div>

          <div className="workload-list">
            {stationData.map((station, idx) => {
              const isHighWorkload = station.callsPerOfficer > 2.5;
              return (
                <div key={station.key} className={`workload-row ${isHighWorkload ? 'high-workload' : ''}`}>
                  <div className="wl-rank">{idx + 1}</div>
                  <div className="wl-name">{station.name}</div>

                  <div className="wl-officers">
                    <div className="wl-label">Officers/day</div>
                    <div className="wl-stacked-bar">
                      <span className="wl-seg" style={{ width: `${(station.daily.days / station.maxOfficers) * 100}%`, background: SHIFT_COLORS.days }} title={`Days: ${station.daily.days}`} />
                      <span className="wl-seg" style={{ width: `${(station.daily.elevens / station.maxOfficers) * 100}%`, background: SHIFT_COLORS.elevens }} title={`11's: ${station.daily.elevens}`} />
                      <span className="wl-seg" style={{ width: `${(station.daily.swings / station.maxOfficers) * 100}%`, background: SHIFT_COLORS.swings }} title={`Swings: ${station.daily.swings}`} />
                      <span className="wl-seg" style={{ width: `${(station.daily.mids / station.maxOfficers) * 100}%`, background: SHIFT_COLORS.mids }} title={`Mids: ${station.daily.mids}`} />
                    </div>
                    <div className="wl-value">{station.totalOfficers}</div>
                  </div>

                  <div className="wl-calls">
                    <div className="wl-label">Calls/day</div>
                    <div className="wl-bar-track">
                      <span className="wl-bar" style={{ width: `${(station.totalCalls / maxCalls) * 100}%` }} />
                    </div>
                    <div className="wl-value">{callsLoading ? '-' : station.totalCalls}</div>
                  </div>

                  <div className="wl-ratio">
                    <div className="wl-label">Calls/officer</div>
                    <div className="wl-bar-track">
                      <span className={`wl-bar ${isHighWorkload ? 'wl-bar-high' : ''}`} style={{ width: `${(station.callsPerOfficer / maxRatio) * 100}%` }} />
                    </div>
                    <div className={`wl-value ${isHighWorkload ? 'wl-value-high' : ''}`}>
                      {callsLoading ? '-' : station.callsPerOfficer.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Bureau breakdown</h2>
            <p>Where the {CITYWIDE.fullDuty.toLocaleString()} full duty officers are assigned</p>
          </div>

          <div className="bureau-list">
            {[
              { name: 'Field Operations', total: BUREAUS.fieldOps.total, sub: `${STATION_TOTAL} stations + ${BUREAUS.fieldOps.total - STATION_TOTAL} other` },
              { name: 'Investigations', total: BUREAUS.investigations.total },
              { name: 'Airport', total: BUREAUS.airport.total },
              { name: 'Special Operations', total: BUREAUS.specialOps.total },
              { name: 'Administration', total: BUREAUS.admin.total },
              { name: 'Chief of Staff + Office', total: BUREAUS.chiefOfStaff.total + BUREAUS.chiefsOffice.total },
            ].map(bureau => (
              <div key={bureau.name} className="bureau-row">
                <span className="bureau-name">{bureau.name}</span>
                <span className="bureau-bar">
                  <span className="bureau-fill" style={{ width: `${(bureau.total / CITYWIDE.fullDuty) * 100}%` }} />
                </span>
                <span className="bureau-count">{bureau.total}</span>
                {bureau.sub && <span className="bureau-sub">{bureau.sub}</span>}
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">
          Data: SFPD personnel records, SF OpenData CAD calls (30-day average).
        </footer>
      </div>
    </div>
  );
}

export default App;
