import { useMemo } from 'react';
import { useDistrictCalls, useResponseTimes } from './hooks/useIncidents';
import {
  CITYWIDE, STATION_TOTAL, MODIFIED_DUTY_BREAKDOWN, BUREAUS,
  DAILY_ON_DUTY, DAILY_TOTALS, SHIFT_ASSIGNMENTS
} from './data/staffing';
import './App.css';

const STATION_CODE_MAP: Record<string, string> = {
  CENTRAL: 'cent', SOUTHERN: 'sout', BAYVIEW: 'potr', MISSION: 'miss',
  NORTHERN: 'nort', PARK: 'park', RICHMOND: 'rich', INGLESIDE: 'ingl',
  TARAVAL: 'tara', TENDERLOIN: 'tend',
};

const STATION_NAME_MAP: Record<string, string> = {
  cent: 'Central', sout: 'Southern', potr: 'Bayview', miss: 'Mission',
  nort: 'Northern', park: 'Park', rich: 'Richmond', ingl: 'Ingleside',
  tara: 'Taraval', tend: 'Tenderloin',
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

function App() {
  const { data: callData, loading: callsLoading } = useDistrictCalls();
  const { stats: responseStats, loading: responseLoading } = useResponseTimes('month');

  const stationData = useMemo(() => {
    const stations = Object.keys(STATION_NAME_MAP) as Array<keyof typeof DAILY_ON_DUTY>;

    return stations.map(key => {
      const name = STATION_NAME_MAP[key];
      const daily = DAILY_ON_DUTY[key];
      const assigned = SHIFT_ASSIGNMENTS[key];
      const dailyTotal = daily.days + daily.elevens + daily.swings + daily.mids;

      const callStats = callData.find(c => STATION_CODE_MAP[c.district] === key);

      return {
        key,
        name,
        assigned,
        daily,
        dailyTotal,
        calls: callStats || { priorityA: 0, priorityB: 0, priorityC: 0, total: 0 },
        callsPerOfficer: dailyTotal > 0 && callStats ? (callStats.total / dailyTotal).toFixed(1) : '-',
      };
    });
  }, [callData]);

  const totals = useMemo(() => {
    const totalCalls = stationData.reduce((s, d) => s + d.calls.total, 0);
    return {
      calls: totalCalls,
      callsPerOfficer: DAILY_TOTALS.total > 0 ? (totalCalls / DAILY_TOTALS.total).toFixed(1) : '-',
    };
  }, [stationData]);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-text">
            <h1>SFPD patrol staffing</h1>
            <p>Officers on duty vs calls for service by station</p>
          </div>
        </header>

        <section className="card" aria-label="Staffing breakdown">
          <div className="card-header">
            <h2>How {fmt(CITYWIDE.fullDuty)} full duty officers are assigned</h2>
            <p>Target is {fmt(CITYWIDE.target)} — shortage of {fmt(CITYWIDE.shortage)} ({CITYWIDE.shortagePercent}% below). Plus {fmt(MODIFIED_DUTY_BREAKDOWN.total)} on modified duty.</p>
          </div>

          <div className="breakdown-grid">
            <div className="breakdown-row breakdown-header">
              <span className="bd-label">Bureau / Unit</span>
              <span className="bd-count">Officers</span>
              <span className="bd-bar"></span>
            </div>

            <div className="breakdown-row breakdown-bureau">
              <span className="bd-label">Field Operations Bureau</span>
              <span className="bd-count">{fmt(BUREAUS.fieldOps.total)}</span>
              <span className="bd-bar">
                <span className="bd-fill" style={{ width: `${(BUREAUS.fieldOps.total / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>
            <div className="breakdown-row breakdown-sub">
              <span className="bd-label">↳ 10 District Stations</span>
              <span className="bd-count">{fmt(STATION_TOTAL)}</span>
              <span className="bd-bar">
                <span className="bd-fill bd-sub" style={{ width: `${(STATION_TOTAL / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>
            <div className="breakdown-row breakdown-sub">
              <span className="bd-label">↳ DMACC + FOB + CED</span>
              <span className="bd-count">{fmt(BUREAUS.fieldOps.total - STATION_TOTAL)}</span>
              <span className="bd-bar">
                <span className="bd-fill bd-sub" style={{ width: `${((BUREAUS.fieldOps.total - STATION_TOTAL) / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>

            <div className="breakdown-row breakdown-bureau">
              <span className="bd-label">Bureau of Investigations</span>
              <span className="bd-count">{fmt(BUREAUS.investigations.total)}</span>
              <span className="bd-bar">
                <span className="bd-fill" style={{ width: `${(BUREAUS.investigations.total / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>

            <div className="breakdown-row breakdown-bureau">
              <span className="bd-label">Airport Bureau</span>
              <span className="bd-count">{fmt(BUREAUS.airport.total)}</span>
              <span className="bd-bar">
                <span className="bd-fill" style={{ width: `${(BUREAUS.airport.total / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>

            <div className="breakdown-row breakdown-bureau">
              <span className="bd-label">Special Operations Bureau</span>
              <span className="bd-count">{fmt(BUREAUS.specialOps.total)}</span>
              <span className="bd-bar">
                <span className="bd-fill" style={{ width: `${(BUREAUS.specialOps.total / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>

            <div className="breakdown-row breakdown-bureau">
              <span className="bd-label">Administration Bureau</span>
              <span className="bd-count">{fmt(BUREAUS.admin.total)}</span>
              <span className="bd-bar">
                <span className="bd-fill" style={{ width: `${(BUREAUS.admin.total / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>

            <div className="breakdown-row breakdown-bureau">
              <span className="bd-label">Chief of Staff + Chief's Office</span>
              <span className="bd-count">{fmt(BUREAUS.chiefOfStaff.total + BUREAUS.chiefsOffice.total)}</span>
              <span className="bd-bar">
                <span className="bd-fill" style={{ width: `${((BUREAUS.chiefOfStaff.total + BUREAUS.chiefsOffice.total) / CITYWIDE.fullDuty) * 100}%` }} />
              </span>
            </div>

            <div className="breakdown-row breakdown-total">
              <span className="bd-label">Total Full Duty</span>
              <span className="bd-count">{fmt(CITYWIDE.fullDuty)}</span>
              <span className="bd-bar"></span>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Station staffing and calls">
          <div className="card-header">
            <h2>Station staffing vs daily calls</h2>
            <p>Officers on duty per shift and average daily calls by priority (last 30 days)</p>
          </div>

          <div className="station-grid">
            <div className="station-grid-header">
              <span className="sg-name">Station</span>
              <span className="sg-shift">Days</span>
              <span className="sg-shift">11's</span>
              <span className="sg-shift">Swings</span>
              <span className="sg-shift">Mids</span>
              <span className="sg-total">On duty</span>
              <span className="sg-calls">Pri A</span>
              <span className="sg-calls">Pri B</span>
              <span className="sg-calls">Pri C</span>
              <span className="sg-total">Calls/day</span>
              <span className="sg-ratio">Per officer</span>
            </div>

            {stationData.map(station => (
              <div key={station.key} className="station-grid-row">
                <span className="sg-name">{station.name}</span>
                <span className="sg-shift">{station.daily.days}</span>
                <span className="sg-shift">{station.daily.elevens}</span>
                <span className="sg-shift">{station.daily.swings}</span>
                <span className="sg-shift">{station.daily.mids}</span>
                <span className="sg-total">{station.dailyTotal}</span>
                <span className="sg-calls sg-pri-a">{callsLoading ? '-' : station.calls.priorityA}</span>
                <span className="sg-calls sg-pri-b">{callsLoading ? '-' : station.calls.priorityB}</span>
                <span className="sg-calls sg-pri-c">{callsLoading ? '-' : station.calls.priorityC}</span>
                <span className="sg-total">{callsLoading ? '-' : station.calls.total}</span>
                <span className="sg-ratio">{callsLoading ? '-' : station.callsPerOfficer}</span>
              </div>
            ))}

            <div className="station-grid-row station-grid-total">
              <span className="sg-name">Total</span>
              <span className="sg-shift">{DAILY_TOTALS.days}</span>
              <span className="sg-shift">{DAILY_TOTALS.elevens}</span>
              <span className="sg-shift">{DAILY_TOTALS.swings}</span>
              <span className="sg-shift">{DAILY_TOTALS.mids}</span>
              <span className="sg-total">{DAILY_TOTALS.total}</span>
              <span className="sg-calls">{callsLoading ? '-' : stationData.reduce((s, d) => s + d.calls.priorityA, 0)}</span>
              <span className="sg-calls">{callsLoading ? '-' : stationData.reduce((s, d) => s + d.calls.priorityB, 0)}</span>
              <span className="sg-calls">{callsLoading ? '-' : stationData.reduce((s, d) => s + d.calls.priorityC, 0)}</span>
              <span className="sg-total">{callsLoading ? '-' : totals.calls}</span>
              <span className="sg-ratio">{callsLoading ? '-' : totals.callsPerOfficer}</span>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Response times">
          <div className="card-header">
            <h2>Response times by priority</h2>
            <p>Median minutes from call to first unit on scene. Targets: A=8min, B=20min, C=60min.</p>
          </div>

          {responseLoading ? (
            <div className="loading-text">Loading...</div>
          ) : (
            <div className="response-grid">
              {responseStats.byPriority.map(p => {
                const overPct = p.count > 0 ? Math.round((p.overTarget / p.count) * 100) : 0;
                const isOver = p.median > p.target;
                return (
                  <div key={p.priority} className={`response-card ${isOver ? 'over' : 'ok'}`}>
                    <div className="response-priority">Priority {p.priority}</div>
                    <div className="response-median">{p.median.toFixed(1)} min</div>
                    <div className="response-target">Target: {p.target} min</div>
                    <div className="response-count">{fmt(p.count)} calls</div>
                    <div className="response-over">{overPct}% over target</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="footer">
          Staffing data from SFPD personnel records. Call data from SF OpenData CAD dataset (last 30 days).
        </footer>
      </div>
    </div>
  );
}

export default App;
