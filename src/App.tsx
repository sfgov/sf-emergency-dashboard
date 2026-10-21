import { useState, useMemo } from 'react';
import { useIncidents } from './hooks/useIncidents';
import type { TimeRange } from './services/sfOpenData';
import './App.css';

const CITYWIDE = {
  target: 2257,
  totalSworn: 1934,
  airport: 134,
  recruits: 84,
  get cityOfficers() { return this.totalSworn - this.airport; },
  get effective() { return this.cityOfficers - this.recruits; },
  get shortage() { return this.target - this.effective; },
};

const DISTRICTS = [
  { id: 'central', name: 'Central', staff: 156, auth: 205, f: [0.30, 0.40, 0.30] },
  { id: 'southern', name: 'Southern', staff: 188, auth: 248, f: [0.30, 0.42, 0.28] },
  { id: 'bayview', name: 'Bayview', staff: 166, auth: 219, f: [0.31, 0.38, 0.31] },
  { id: 'mission', name: 'Mission', staff: 179, auth: 236, f: [0.29, 0.41, 0.30] },
  { id: 'northern', name: 'Northern', staff: 175, auth: 231, f: [0.30, 0.40, 0.30] },
  { id: 'park', name: 'Park', staff: 112, auth: 147, f: [0.34, 0.38, 0.28] },
  { id: 'richmond', name: 'Richmond', staff: 108, auth: 143, f: [0.34, 0.38, 0.28] },
  { id: 'ingleside', name: 'Ingleside', staff: 134, auth: 176, f: [0.32, 0.38, 0.30] },
  { id: 'taraval', name: 'Taraval', staff: 115, auth: 151, f: [0.33, 0.38, 0.29] },
  { id: 'tenderloin', name: 'Tenderloin', staff: 183, auth: 241, f: [0.28, 0.40, 0.32] },
];

const SHIFTS = [
  { label: 'Day', range: '6a–2p', col: '#2a78d6', hours: [6,7,8,9,10,11,12,13] },
  { label: 'Swing', range: '2p–10p', col: '#eb6834', hours: [14,15,16,17,18,19,20,21] },
  { label: 'Night', range: '10p–6a', col: '#1baf7a', hours: [22,23,0,1,2,3,4,5] },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const shiftOf = (h: number) => (h >= 6 && h < 14 ? 0 : h >= 14 && h < 22 ? 1 : 2);
const hourName = (h: number) => { const s = h < 12 ? 'a' : 'p'; const n = h % 12 === 0 ? 12 : h % 12; return n + s; };

const splitShift = (total: number, f: number[]) => {
  const a = Math.round(total * f[0]);
  const b = Math.round(total * f[1]);
  return [a, b, total - a - b];
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const { incidents, loading } = useIncidents(timeRange);

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
    const scope = DISTRICTS.filter(d => activeDistricts.includes(d.id));
    let authTotal = 0;
    let staffTotal = 0;

    scope.forEach(d => {
      const assigned = splitShift(d.staff, d.f);
      const authorized = splitShift(d.auth, d.f);
      activeShifts.forEach(s => {
        authTotal += authorized[s];
        staffTotal += assigned[s];
      });
    });

    const shortage = authTotal - staffTotal;
    const fillPct = authTotal > 0 ? Math.round((staffTotal / authTotal) * 100) : 0;
    const totalCalls = hourlyCallData.reduce((a, b) => a + b, 0);
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === '3months' ? 90 : 365;
    const callsPerDay = Math.round(totalCalls / days);

    return { authTotal, staffTotal, shortage, fillPct, totalCalls, callsPerDay };
  }, [activeDistricts, activeShifts, hourlyCallData, timeRange]);

  const districtRows = useMemo(() => {
    const maxAuth = Math.max(...DISTRICTS.map(d => {
      const auth = splitShift(d.auth, d.f);
      return activeShifts.reduce((sum, s) => sum + auth[s], 0);
    }));

    return DISTRICTS.map(d => {
      const assigned = splitShift(d.staff, d.f);
      const authorized = splitShift(d.auth, d.f);
      const staffSel = activeShifts.reduce((sum, s) => sum + assigned[s], 0);
      const authSel = activeShifts.reduce((sum, s) => sum + authorized[s], 0);
      const gap = authSel - staffSel;
      const isSelected = selectedDistricts.includes(d.id);
      const isDimmed = selectedDistricts.length > 0 && !isSelected;

      const segments = activeShifts.map(s => ({
        width: (assigned[s] / maxAuth) * 100,
        color: SHIFTS[s].col,
      }));

      const gapWidth = (gap / maxAuth) * 100;

      return {
        id: d.id,
        name: d.name,
        segments,
        gapWidth,
        staffSel,
        authSel,
        gap,
        isSelected,
        isDimmed,
      };
    });
  }, [activeDistricts, activeShifts, selectedDistricts]);

  const hourlyChartData = useMemo(() => {
    const maxCalls = Math.max(...hourlyCallData, 1);
    const scope = DISTRICTS.filter(d => activeDistricts.includes(d.id));

    return HOURS.map(h => {
      const s = shiftOf(h);
      const isActive = activeShifts.includes(s);

      let dutyTotal = 0;
      scope.forEach(d => {
        const assigned = splitShift(d.staff, d.f);
        dutyTotal += Math.round(assigned[s] * 0.72);
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
            <div className="kpi-sub">{fmt(CITYWIDE.airport)} airport, {fmt(CITYWIDE.recruits)} recruits</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">City officers (non-airport)</div>
            <div className="kpi-value">{fmt(CITYWIDE.effective)}</div>
            <div className="kpi-sub">{fmt(CITYWIDE.cityOfficers)} minus {fmt(CITYWIDE.recruits)} recruits</div>
          </div>
          <div className="kpi-card inverted">
            <div className="kpi-label">Shortage</div>
            <div className="kpi-value">−{fmt(CITYWIDE.shortage)}</div>
            <div className="kpi-sub">{Math.round((CITYWIDE.shortage / CITYWIDE.target) * 100)}% below target</div>
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
            <h2>Officers on hand vs. authorized, by district</h2>
            <p>Filled bars are officers assigned, split by shift. Dashed outlines are unfilled authorized positions.</p>
          </div>

          <div className="legend-row">
            {SHIFTS.map((s, i) => (
              <span key={i} className="legend-item">
                <span className="legend-swatch" style={{ background: s.col }} />
                {s.label} {s.range}
              </span>
            ))}
            <span className="legend-item">
              <span className="legend-swatch unfilled" />
              Unfilled
            </span>
          </div>

          <div className="district-table">
            <div className="district-header">
              <span className="col-name" />
              <span className="col-bar" />
              <span className="col-fill">On hand / auth.</span>
              <span className="col-short">Short</span>
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
                    {row.gapWidth > 0 && (
                      <span className="bar-gap" style={{ width: `${row.gapWidth}%` }} />
                    )}
                  </span>
                </span>
                <span className="col-fill">{row.staffSel} / {row.authSel}</span>
                <span className="col-short">{row.gap > 0 ? `−${row.gap}` : row.gap < 0 ? `+${Math.abs(row.gap)}` : '0'}</span>
              </button>
            ))}
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

        <footer className="footer">
          Data from SF OpenData police incident reports. Staffing figures are illustrative.
          Officers on duty assumes 72% of assigned officers are available per shift (accounting for days off, leave, court).
        </footer>
      </div>
    </div>
  );
}

export default App;
