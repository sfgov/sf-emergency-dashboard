import { useState, useMemo } from 'react';
import { useIncidents, useResponseTimes } from './hooks/useIncidents';
import type { TimeRange } from './services/sfOpenData';
import {
  CITYWIDE, BUREAUS, STATIONS as STATION_KEYS, STATION_TOTAL, MODIFIED_DUTY_BREAKDOWN,
  SHIFTS as SHIFT_DEFS, DAILY_ON_DUTY, DAILY_TOTALS, SHIFT_ASSIGNMENTS, SHIFT_TOTALS
} from './data/staffing';
import './App.css';

const STATIONS = STATION_KEYS.map(key => {
  const unit = BUREAUS.fieldOps.units[key];
  return {
    id: key,
    name: unit.name,
    capt: unit.capt || 0,
    lt: unit.lt || 0,
    sgt: unit.sgt || 0,
    off: unit.off || 0,
    staff: unit.total,
  };
});

const OTHER_FIELD_OPS = [
  { id: 'dmac', ...BUREAUS.fieldOps.units.dmac },
  { id: 'fob', ...BUREAUS.fieldOps.units.fob },
  { id: 'ced', ...BUREAUS.fieldOps.units.ced },
];

const NON_PATROL_BUREAUS = [
  { id: 'investigations', name: 'Investigations', total: BUREAUS.investigations.total },
  { id: 'specialOps', name: 'Special Operations', total: BUREAUS.specialOps.total },
  { id: 'admin', name: 'Administration', total: BUREAUS.admin.total },
  { id: 'chiefOfStaff', name: 'Chief of Staff', total: BUREAUS.chiefOfStaff.total },
  { id: 'chiefsOffice', name: "Chief's Office", total: BUREAUS.chiefsOffice.total },
];

const NON_PATROL_TOTAL = NON_PATROL_BUREAUS.reduce((sum, b) => sum + b.total, 0);

const DISTRICTS = STATIONS;

const SHIFTS = [
  { id: 'days', label: 'Days', range: '6a-4p', col: SHIFT_DEFS.days.color },
  { id: '11s', label: "11's", range: '11a-9p', col: SHIFT_DEFS.elevens.color },
  { id: 'swings', label: 'Swings', range: '3p-1a', col: SHIFT_DEFS.swings.color },
  { id: 'mids', label: 'Mids', range: '9p-7a', col: SHIFT_DEFS.mids.color },
];

const STATION_NAME_MAP: Record<string, string> = {
  cent: 'Central', sout: 'Southern', potr: 'Bayview', miss: 'Mission',
  nort: 'Northern', park: 'Park', rich: 'Richmond', ingl: 'Ingleside',
  tara: 'Taraval', tend: 'Tenderloin', dmac: 'DMACC',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const shiftOf = (h: number) => (h >= 6 && h < 14 ? 0 : h >= 14 && h < 22 ? 1 : 2);
const hourName = (h: number) => { const s = h < 12 ? 'a' : 'p'; const n = h % 12 === 0 ? 12 : h % 12; return n + s; };

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const { incidents, loading } = useIncidents(timeRange);
  const { stats: responseStats, loading: responseLoading } = useResponseTimes(timeRange);

  const toggleDistrict = (id: string) => {
    setSelectedDistricts(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleShift = (idx: number) => {
    setSelectedShifts(prev =>
      prev.includes(idx) ? prev.filter(s => s !== idx) : [...prev, idx]
    );
  };

  const activeDistricts = selectedDistricts.length ? selectedDistricts : DISTRICTS.map(d => d.id);
  const activeShifts = selectedShifts.length ? selectedShifts : [0, 1, 2];

  const hourlyCallData = useMemo(() => {
    const counts = HOURS.map(() => 0);
    const filteredIncidents = incidents.filter(inc => {
      const districtMatch = activeDistricts.some(id => {
        const district = DISTRICTS.find(d => d.id === id);
        return district && inc.district.toLowerCase().includes(district.name.toLowerCase());
      });
      return districtMatch;
    });

    filteredIncidents.forEach(inc => {
      if (inc.hour >= 0 && inc.hour < 24) {
        if (activeShifts.includes(shiftOf(inc.hour))) {
          counts[inc.hour]++;
        }
      }
    });

    return counts;
  }, [incidents, activeDistricts, activeShifts]);

  const kpis = useMemo(() => {
    const totalCalls = hourlyCallData.reduce((a, b) => a + b, 0);
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === '3months' ? 90 : 365;
    const callsPerDay = Math.round(totalCalls / days);

    return { totalCalls, callsPerDay };
  }, [hourlyCallData, timeRange]);

  const districtRows = useMemo(() => {
    const maxStaff = Math.max(...DISTRICTS.map(d => d.staff));

    return DISTRICTS.map(d => {
      const isSelected = selectedDistricts.includes(d.id);
      const isDimmed = selectedDistricts.length > 0 && !isSelected;

      const segments = [
        { width: (d.lt / maxStaff) * 100, color: '#1b1b1a', label: 'Lt' },
        { width: (d.sgt / maxStaff) * 100, color: '#55544f', label: 'Sgt' },
        { width: (d.off / maxStaff) * 100, color: '#2a78d6', label: 'Off' },
      ];

      return {
        id: d.id,
        name: d.name,
        lt: d.lt,
        sgt: d.sgt,
        off: d.off,
        staff: d.staff,
        segments,
        isSelected,
        isDimmed,
      };
    });
  }, [selectedDistricts]);

  const hourlyChartData = useMemo(() => {
    const maxCalls = Math.max(...hourlyCallData, 1);
    const scope = DISTRICTS.filter(d => activeDistricts.includes(d.id));

    return HOURS.map(h => {
      const s = shiftOf(h);
      const isActive = activeShifts.includes(s);

      let dutyTotal = 0;
      scope.forEach(d => {
        const perShift = Math.round(d.staff / 3);
        dutyTotal += Math.round(perShift * 0.72);
      });

      const calls = hourlyCallData[h];
      const ratio = dutyTotal > 0 ? calls / dutyTotal : 0;

      return {
        hour: h,
        label: hourName(h),
        shift: s,
        calls,
        duty: dutyTotal,
        ratio,
        callsHeight: (calls / maxCalls) * 100,
        isActive,
      };
    });
  }, [hourlyCallData, activeDistricts, activeShifts]);

  const maxDuty = Math.max(...hourlyChartData.map(h => h.duty), 1);
  const maxRatio = Math.max(...hourlyChartData.map(h => h.ratio), 1);

  const scopeText = useMemo(() => {
    const dText = selectedDistricts.length
      ? DISTRICTS.filter(d => selectedDistricts.includes(d.id)).map(d => d.name).join(', ')
      : 'Citywide (all 10 districts)';
    const sText = selectedShifts.length
      ? selectedShifts.map(i => SHIFTS[i].label).join(' + ') + ' shift' + (selectedShifts.length > 1 ? 's' : '')
      : 'all shifts';
    return `${dText} · ${sText}`;
  }, [selectedDistricts, selectedShifts]);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-text">
            <h1>Patrol staffing shortage and capacity</h1>
            <p>How many officers we have against what is authorized, and what it means for calls for service</p>
          </div>
          <div className="header-badge">
            <select value={timeRange} onChange={e => setTimeRange(e.target.value as TimeRange)}>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="3months">Last 90 days</option>
              <option value="year">Last year</option>
            </select>
          </div>
        </header>

        <section className="kpi-grid" aria-label="Staffing summary">
          <div className="kpi-card">
            <div className="kpi-label">Target staffing</div>
            <div className="kpi-value">{fmt(CITYWIDE.target)}</div>
            <div className="kpi-sub">authorized for the city</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total sworn</div>
            <div className="kpi-value">{fmt(CITYWIDE.totalSworn)}</div>
            <div className="kpi-sub">all ranks, all statuses</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Modified duty</div>
            <div className="kpi-value">−{fmt(MODIFIED_DUTY_BREAKDOWN.total)}</div>
            <div className="kpi-sub">{fmt(MODIFIED_DUTY_BREAKDOWN.medicalLeave)} medical, {fmt(MODIFIED_DUTY_BREAKDOWN.otherModified)} other</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Full duty sworn</div>
            <div className="kpi-value">{fmt(CITYWIDE.fullDuty)}</div>
            <div className="kpi-sub">+ {fmt(CITYWIDE.recruits)} recruits in training</div>
          </div>
          <div className="kpi-card inverted">
            <div className="kpi-label">Shortage vs target</div>
            <div className="kpi-value">−{fmt(CITYWIDE.shortage)}</div>
            <div className="kpi-sub">{CITYWIDE.shortagePercent}% below authorized</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Field Operations</div>
            <div className="kpi-value">{fmt(BUREAUS.fieldOps.total)}</div>
            <div className="kpi-sub">{fmt(STATION_TOTAL)} in stations</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Calls for service</div>
            <div className="kpi-value">{loading ? '...' : fmt(kpis.totalCalls)}</div>
            <div className="kpi-sub">{kpis.callsPerDay} per day average</div>
          </div>
        </section>

        <section className="filter-section" aria-label="Filters">
          <div className="filter-header">
            <div className="filter-scope">Showing: <strong>{scopeText}</strong></div>
            {(selectedDistricts.length > 0 || selectedShifts.length > 0) && (
              <button className="reset-btn" onClick={() => { setSelectedDistricts([]); setSelectedShifts([]); }}>
                Reset to citywide
              </button>
            )}
          </div>

          <div className="filter-row">
            <span className="filter-label">District</span>
            <div className="chip-group">
              <button
                className={`chip ${selectedDistricts.length === 0 ? 'active' : ''}`}
                onClick={() => setSelectedDistricts([])}
              >
                All districts
              </button>
              {DISTRICTS.map(d => (
                <button
                  key={d.id}
                  className={`chip ${selectedDistricts.includes(d.id) ? 'active' : ''}`}
                  onClick={() => toggleDistrict(d.id)}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="filter-label">Shift</span>
            <div className="chip-group">
              <button
                className={`chip ${selectedShifts.length === 0 ? 'active' : ''}`}
                onClick={() => setSelectedShifts([])}
              >
                All shifts
              </button>
              {SHIFTS.map((s, i) => (
                <button
                  key={i}
                  className={`chip ${selectedShifts.includes(i) ? 'active' : ''}`}
                  onClick={() => toggleShift(i)}
                >
                  <span className="chip-dot" style={{ background: s.col }} />
                  {s.label} {s.range}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card" aria-label="Officers by district">
          <div className="card-header">
            <h2>Station staffing by rank</h2>
            <p>Lieutenants, sergeants, and officers assigned to each district station. Total: {fmt(STATION_TOTAL)} patrol personnel.</p>
          </div>

          <div className="legend-row">
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: '#1b1b1a' }} />
              Lieutenants
            </span>
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: '#55544f' }} />
              Sergeants
            </span>
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: '#2a78d6' }} />
              Officers
            </span>
          </div>

          <div className="district-table">
            <div className="district-header">
              <span className="col-name" />
              <span className="col-bar" />
              <span className="col-rank">Lt</span>
              <span className="col-rank">Sgt</span>
              <span className="col-rank">Off</span>
              <span className="col-total">Total</span>
            </div>
            {districtRows.map(row => (
              <button
                key={row.id}
                className={`district-row ${row.isSelected ? 'selected' : ''} ${row.isDimmed ? 'dimmed' : ''}`}
                onClick={() => toggleDistrict(row.id)}
              >
                <span className="col-name">{row.name}</span>
                <span className="col-bar">
                  <span className="bar-track">
                    {row.segments.map((seg, i) => (
                      <span
                        key={i}
                        className="bar-segment"
                        style={{ width: `${seg.width}%`, background: seg.color }}
                      />
                    ))}
                  </span>
                </span>
                <span className="col-rank">{row.lt}</span>
                <span className="col-rank">{row.sgt}</span>
                <span className="col-rank">{row.off}</span>
                <span className="col-total">{row.staff}</span>
              </button>
            ))}
            <div className="district-row subtotal">
              <span className="col-name">Station Total</span>
              <span className="col-bar" />
              <span className="col-rank">{STATIONS.reduce((s, d) => s + d.lt, 0)}</span>
              <span className="col-rank">{STATIONS.reduce((s, d) => s + d.sgt, 0)}</span>
              <span className="col-rank">{STATIONS.reduce((s, d) => s + d.off, 0)}</span>
              <span className="col-total">{fmt(STATION_TOTAL)}</span>
            </div>
          </div>

          <div className="section-divider" />

          <div className="card-header">
            <h2>Other Field Operations</h2>
            <p>DMACC, FOB HQ, and CED units within Field Operations Bureau.</p>
          </div>

          <div className="district-table">
            <div className="district-header">
              <span className="col-name" />
              <span className="col-bar" />
              <span className="col-rank">Lt</span>
              <span className="col-rank">Sgt</span>
              <span className="col-rank">Off</span>
              <span className="col-total">Total</span>
            </div>
            {OTHER_FIELD_OPS.map(unit => (
              <div key={unit.id} className="district-row">
                <span className="col-name">{unit.name}</span>
                <span className="col-bar">
                  <span className="bar-track">
                    <span className="bar-segment" style={{ width: `${(unit.total / 80) * 100}%`, background: '#6f6e68' }} />
                  </span>
                </span>
                <span className="col-rank">{unit.lt || 0}</span>
                <span className="col-rank">{unit.sgt || 0}</span>
                <span className="col-rank">{unit.off || 0}</span>
                <span className="col-total">{unit.total}</span>
              </div>
            ))}
            <div className="district-row subtotal">
              <span className="col-name">Field Ops Total</span>
              <span className="col-bar" />
              <span className="col-rank" />
              <span className="col-rank" />
              <span className="col-rank" />
              <span className="col-total">{fmt(BUREAUS.fieldOps.total)}</span>
            </div>
          </div>

          <div className="section-divider" />

          <div className="card-header">
            <h2>Non-patrol bureaus</h2>
            <p>Investigations, Special Operations, Administration, and leadership.</p>
          </div>

          <div className="partial-duty-grid">
            {NON_PATROL_BUREAUS.map(b => (
              <div key={b.id} className="partial-duty-item">
                <span className="partial-location">{b.name}</span>
                <span className="partial-count">{b.total}</span>
              </div>
            ))}
            <div className="partial-duty-item total">
              <span className="partial-location">Total</span>
              <span className="partial-count">{NON_PATROL_TOTAL}</span>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Shift staffing">
          <div className="card-header">
            <h2>Officers assigned by shift</h2>
            <p>Full duty officers assigned to each shift. {SHIFT_TOTALS.total} total across stations + DMACC.</p>
          </div>

          <div className="shift-table">
            <div className="shift-table-header">
              <span className="shift-col-name">Station</span>
              <span className="shift-col-val">Days</span>
              <span className="shift-col-val">11's</span>
              <span className="shift-col-val">Swings</span>
              <span className="shift-col-val">Mids</span>
              <span className="shift-col-total">Total</span>
            </div>
            {Object.entries(SHIFT_ASSIGNMENTS).map(([key, data]) => (
              <div key={key} className="shift-table-row">
                <span className="shift-col-name">{STATION_NAME_MAP[key] || key}</span>
                <span className="shift-col-val">{data.days}</span>
                <span className="shift-col-val">{data.elevens}</span>
                <span className="shift-col-val">{data.swings}</span>
                <span className="shift-col-val">{data.mids}</span>
                <span className="shift-col-total">{data.total}</span>
              </div>
            ))}
            <div className="shift-table-row subtotal">
              <span className="shift-col-name">Total</span>
              <span className="shift-col-val">{SHIFT_TOTALS.days}</span>
              <span className="shift-col-val">{SHIFT_TOTALS.elevens}</span>
              <span className="shift-col-val">{SHIFT_TOTALS.swings}</span>
              <span className="shift-col-val">{SHIFT_TOTALS.mids}</span>
              <span className="shift-col-total">{SHIFT_TOTALS.total}</span>
            </div>
          </div>

          <div className="section-divider" />

          <div className="card-header">
            <h2>Daily on-duty by shift</h2>
            <p>Typical daily staffing (~50% of assigned due to two sides of week). {DAILY_TOTALS.total} on duty.</p>
          </div>

          <div className="shift-table">
            <div className="shift-table-header">
              <span className="shift-col-name">Station</span>
              <span className="shift-col-val">Days</span>
              <span className="shift-col-val">11's</span>
              <span className="shift-col-val">Swings</span>
              <span className="shift-col-val">Mids</span>
              <span className="shift-col-total">Total</span>
            </div>
            {Object.entries(DAILY_ON_DUTY).map(([key, data]) => {
              const total = data.days + data.elevens + data.swings + data.mids;
              return (
                <div key={key} className="shift-table-row">
                  <span className="shift-col-name">{STATION_NAME_MAP[key] || key}</span>
                  <span className="shift-col-val">{data.days}</span>
                  <span className="shift-col-val">{data.elevens}</span>
                  <span className="shift-col-val">{data.swings}</span>
                  <span className="shift-col-val">{data.mids}</span>
                  <span className="shift-col-total">{total}</span>
                </div>
              );
            })}
            <div className="shift-table-row subtotal">
              <span className="shift-col-name">Total</span>
              <span className="shift-col-val">{DAILY_TOTALS.days}</span>
              <span className="shift-col-val">{DAILY_TOTALS.elevens}</span>
              <span className="shift-col-val">{DAILY_TOTALS.swings}</span>
              <span className="shift-col-val">{DAILY_TOTALS.mids}</span>
              <span className="shift-col-total">{DAILY_TOTALS.total}</span>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Hourly capacity">
          <div className="card-header">
            <h2>Capacity by hour of day</h2>
            <p>Officers on duty and calls for service for {scopeText}.</p>
          </div>

          <div className="hour-readout">
            {hoveredHour !== null
              ? `${hourName(hoveredHour)} · ${SHIFTS[shiftOf(hoveredHour)].label} shift · ${hourlyChartData[hoveredHour].duty} officers on duty · ${hourlyChartData[hoveredHour].calls} calls · ${hourlyChartData[hoveredHour].ratio.toFixed(2)} calls per officer`
              : 'Hover an hour to see details.'
            }
          </div>

          <div className="hourly-charts">
            <div className="chart-row">
              <div className="chart-label">
                <div className="chart-title">Officers on duty</div>
                <div className="chart-sub">peak {fmt(maxDuty)}</div>
              </div>
              <div className="chart-bars">
                {hourlyChartData.map(h => (
                  <button
                    key={h.hour}
                    className="chart-col"
                    onMouseEnter={() => setHoveredHour(h.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                    style={{ opacity: h.isActive ? 1 : 0.25 }}
                  >
                    <span
                      className="chart-bar"
                      style={{
                        height: `${(h.duty / maxDuty) * 100}%`,
                        background: SHIFTS[h.shift].col,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-row">
              <div className="chart-label">
                <div className="chart-title">Calls per hour</div>
                <div className="chart-sub">peak {fmt(Math.max(...hourlyCallData))}</div>
              </div>
              <div className="chart-bars">
                {hourlyChartData.map(h => (
                  <button
                    key={h.hour}
                    className="chart-col"
                    onMouseEnter={() => setHoveredHour(h.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                    style={{ opacity: h.isActive ? 1 : 0.25 }}
                  >
                    <span
                      className="chart-bar"
                      style={{
                        height: `${h.callsHeight}%`,
                        background: '#7d7c75',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-row">
              <div className="chart-label">
                <div className="chart-title">Calls per officer</div>
                <div className="chart-sub">scale 0 to {maxRatio.toFixed(1)}</div>
              </div>
              <div className="chart-bars">
                {hourlyChartData.map(h => (
                  <button
                    key={h.hour}
                    className="chart-col"
                    onMouseEnter={() => setHoveredHour(h.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                    style={{ opacity: h.isActive ? 1 : 0.25 }}
                  >
                    <span
                      className="chart-bar"
                      style={{
                        height: `${(h.ratio / maxRatio) * 100}%`,
                        background: h.ratio > 1.1 ? '#d03a39' : '#3b3a37',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-axis">
              <div className="chart-label" />
              <div className="axis-labels">
                {HOURS.map(h => (
                  <span key={h} className="axis-tick">
                    {h % 3 === 0 ? hourName(h) : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Response times">
          <div className="card-header">
            <h2>Response times by priority</h2>
            <p>Median minutes from call received to first unit on scene. Targets: A=8min, B=20min, C=60min.</p>
          </div>

          {responseLoading ? (
            <div className="loading-text">Loading response time data...</div>
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
          Data from SF OpenData. Response times from CAD dataset (2zdj-bwza).
          Methodology follows Controller's Office definitions: median time from call received to first unit on scene, by priority.
        </footer>
      </div>
    </div>
  );
}

export default App;
