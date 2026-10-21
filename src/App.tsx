import { useState, useMemo } from 'react';
import { useIncidents } from './hooks/useIncidents';
import type { TimeRange } from './services/sfOpenData';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, AreaChart, Area
} from 'recharts';
import './App.css';

const STAFFING = {
  total: 1971,
  assignments: {
    patrol: 1050,
    investigations: 280,
    administration: 195,
    specialUnits: 180,
    training: 85,
    leave: 181,
  },
  shifts: {
    day: { label: 'Day (0600-1400)', officers: 380, hours: [6, 7, 8, 9, 10, 11, 12, 13] },
    swing: { label: 'Swing (1400-2200)', officers: 420, hours: [14, 15, 16, 17, 18, 19, 20, 21] },
    night: { label: 'Night (2200-0600)', officers: 250, hours: [22, 23, 0, 1, 2, 3, 4, 5] },
  },
  stations: {
    'Bayview': { officers: 95, address: '201 Williams Ave' },
    'Central': { officers: 110, address: '766 Vallejo St' },
    'Ingleside': { officers: 100, address: '1 Sgt John V Young Ln' },
    'Mission': { officers: 115, address: '630 Valencia St' },
    'Northern': { officers: 105, address: '1125 Fillmore St' },
    'Park': { officers: 85, address: '1899 Waller St' },
    'Richmond': { officers: 90, address: '461 6th Ave' },
    'Southern': { officers: 120, address: '850 Bryant St' },
    'Taraval': { officers: 95, address: '2345 24th Ave' },
    'Tenderloin': { officers: 135, address: '301 Eddy St' },
  } as Record<string, { officers: number; address: string }>,
};

const SF_DISTRICTS = Object.keys(STAFFING.stations);

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const { incidents, loading, error } = useIncidents(timeRange);

  const filteredIncidents = useMemo(() => {
    if (!selectedStation) return incidents;
    return incidents.filter(i => i.district === selectedStation);
  }, [incidents, selectedStation]);

  const waterfallData = useMemo(() => {
    const { total, assignments } = STAFFING;
    let running = total;

    type StepType = 'total' | 'subtract' | 'result';
    const steps: { label: string; value: number; running: number; type: StepType }[] = [
      { label: 'Total Sworn', value: total, running: total, type: 'total' },
    ];

    const subtractions = [
      { label: 'Investigations', value: assignments.investigations },
      { label: 'Administration', value: assignments.administration },
      { label: 'Special Units', value: assignments.specialUnits },
      { label: 'Training', value: assignments.training },
      { label: 'Leave/Absent', value: assignments.leave },
    ];

    for (const sub of subtractions) {
      running -= sub.value;
      steps.push({
        label: sub.label,
        value: -sub.value,
        running,
        type: 'subtract',
      });
    }

    steps.push({
      label: 'Patrol Ready',
      value: running,
      running,
      type: 'result',
    });

    return steps;
  }, []);

  const shiftData = useMemo(() => {
    return Object.entries(STAFFING.shifts).map(([key, shift]) => ({
      id: key,
      label: shift.label,
      officers: shift.officers,
      hours: shift.hours,
    }));
  }, []);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    filteredIncidents.forEach(inc => {
      if (inc.hour >= 0 && inc.hour < 24) {
        hours[inc.hour].count++;
      }
    });

    return hours;
  }, [filteredIncidents]);

  const districtData = useMemo(() => {
    const counts = new Map<string, number>();
    incidents.forEach(inc => {
      counts.set(inc.district, (counts.get(inc.district) || 0) + 1);
    });

    return SF_DISTRICTS
      .map(d => ({
        district: d,
        count: counts.get(d) || 0,
        officers: STAFFING.stations[d]?.officers || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  const stats = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === '3months' ? 90 : 365;
    const perDay = Math.round(filteredIncidents.length / days);
    const peakHour = hourlyData.reduce((max, h) => h.count > max.count ? h : max, hourlyData[0]);

    const shiftCounts = shiftData.map(shift => {
      const count = shift.hours.reduce((sum, h) => sum + hourlyData[h].count, 0);
      return { ...shift, incidents: count };
    });

    const stationOfficers = selectedStation ? STAFFING.stations[selectedStation]?.officers || 0 : STAFFING.assignments.patrol;

    return {
      total: filteredIncidents.length,
      perDay,
      peakHour,
      shiftCounts,
      stationOfficers,
      incidentsPerOfficer: Math.round(filteredIncidents.length / stationOfficers),
    };
  }, [filteredIncidents, timeRange, hourlyData, shiftData, selectedStation]);

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    filteredIncidents.forEach(inc => {
      counts.set(inc.category, (counts.get(inc.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, count]) => ({ category, count }));
  }, [filteredIncidents]);

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-left">
          <span className="nav-title">SFPD Staffing Analysis</span>
          {selectedStation && (
            <button className="nav-back" onClick={() => setSelectedStation(null)}>
              ← All Stations
            </button>
          )}
        </div>
        <div className="nav-controls">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value as TimeRange)}>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="3months">Last 90 days</option>
            <option value="year">Last year</option>
          </select>
        </div>
      </nav>

      <main className="main">
        {!selectedStation ? (
          <>
            <section className="hero-section">
              <div className="hero-content">
                <span className="hero-label">Total Sworn Officers</span>
                <span className="hero-value">{STAFFING.total.toLocaleString()}</span>
                <span className="hero-sublabel">San Francisco Police Department</span>
              </div>
            </section>

            <section className="section">
              <header className="section-header">
                <h2>From Total to Patrol</h2>
                <p className="section-desc">
                  Not all officers respond to calls. Here's where they go.
                </p>
              </header>

              <div className="waterfall">
                {waterfallData.map((step) => (
                  <div key={step.label} className={`waterfall-row ${step.type}`}>
                    <span className="waterfall-label">{step.label}</span>
                    <div className="waterfall-bar-container">
                      {step.type === 'total' && (
                        <div className="waterfall-bar total" style={{ width: '100%' }}>
                          <span className="bar-value">{step.value.toLocaleString()}</span>
                        </div>
                      )}
                      {step.type === 'subtract' && (
                        <>
                          <div
                            className="waterfall-bar ghost"
                            style={{ width: `${(step.running / STAFFING.total) * 100}%` }}
                          />
                          <div
                            className="waterfall-bar subtract"
                            style={{
                              width: `${(Math.abs(step.value) / STAFFING.total) * 100}%`,
                              marginLeft: `${(step.running / STAFFING.total) * 100}%`,
                            }}
                          >
                            <span className="bar-value">−{Math.abs(step.value)}</span>
                          </div>
                        </>
                      )}
                      {step.type === 'result' && (
                        <div
                          className="waterfall-bar result"
                          style={{ width: `${(step.running / STAFFING.total) * 100}%` }}
                        >
                          <span className="bar-value">{step.running.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <span className="waterfall-running">
                      {step.type !== 'total' && step.type !== 'result' && step.running.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="waterfall-summary">
                <strong>{Math.round((STAFFING.assignments.patrol / STAFFING.total) * 100)}%</strong> of sworn officers are available for patrol duty
              </div>
            </section>

            <section className="section">
              <header className="section-header">
                <h2>Shift Coverage</h2>
                <p className="section-desc">
                  Patrol officers work three shifts. Swing has the most; night the fewest.
                </p>
              </header>

              <div className="shifts-grid">
                {shiftData.map(shift => {
                  const pct = (shift.officers / STAFFING.assignments.patrol) * 100;
                  return (
                    <div key={shift.id} className="shift-card">
                      <div className="shift-header">
                        <span className="shift-label">{shift.label}</span>
                      </div>
                      <div className="shift-value">{shift.officers}</div>
                      <div className="shift-bar">
                        <div className="shift-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="shift-pct">{Math.round(pct)}% of patrol</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="section">
              <header className="section-header">
                <h2>Station Workload</h2>
                <p className="section-desc">
                  {loading ? 'Loading...' : error ? error : 'Click a station to see detailed breakdown.'}
                </p>
              </header>

              <div className="stations-grid">
                {districtData.map(({ district, count, officers }) => {
                  const callsPerOfficer = officers > 0 ? Math.round(count / officers) : 0;
                  return (
                    <button
                      key={district}
                      className="station-card"
                      onClick={() => setSelectedStation(district)}
                    >
                      <div className="station-name">{district}</div>
                      <div className="station-stats">
                        <div className="station-stat">
                          <span className="station-stat-value">{formatNumber(count)}</span>
                          <span className="station-stat-label">incidents</span>
                        </div>
                        <div className="station-stat">
                          <span className="station-stat-value">{officers}</span>
                          <span className="station-stat-label">officers</span>
                        </div>
                        <div className="station-stat highlight">
                          <span className="station-stat-value">{callsPerOfficer}</span>
                          <span className="station-stat-label">per officer</span>
                        </div>
                      </div>
                      <div className="station-bar">
                        <div
                          className="station-fill"
                          style={{ width: `${(count / (districtData[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="hero-section station-hero">
              <div className="hero-content">
                <span className="hero-label">{selectedStation} Station</span>
                <span className="hero-value">{STAFFING.stations[selectedStation]?.officers || 0}</span>
                <span className="hero-sublabel">Patrol Officers Assigned</span>
                <span className="hero-address">{STAFFING.stations[selectedStation]?.address}</span>
              </div>
            </section>

            <section className="section">
              <header className="section-header">
                <h2>Station Overview</h2>
                <p className="section-desc">
                  {loading ? 'Loading...' : `${formatNumber(stats.total)} incidents — ${stats.incidentsPerOfficer} per officer in the selected period.`}
                </p>
              </header>

              <div className="stats-row">
                <div className="stat-tile">
                  <span className="stat-label">Total Incidents</span>
                  <span className="stat-value">{formatNumber(stats.total)}</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-label">Per Day</span>
                  <span className="stat-value">{stats.perDay}</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-label">Per Officer</span>
                  <span className="stat-value">{stats.incidentsPerOfficer}</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-label">Peak Hour</span>
                  <span className="stat-value">{stats.peakHour?.label || '-'}</span>
                </div>
              </div>
            </section>

            <section className="section">
              <header className="section-header">
                <h2>When Calls Come In</h2>
                <p className="section-desc">
                  Incident volume by hour for {selectedStation} station.
                </p>
              </header>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={hourlyData} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3987e5" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3987e5" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#898781' }}
                      tickLine={false}
                      axisLine={{ stroke: '#383835' }}
                      interval={5}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a19',
                        border: '1px solid #2c2c2a',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#f0efec' }}
                      itemStyle={{ color: '#c3c2b7' }}
                      formatter={(value) => [Number(value).toLocaleString(), 'Incidents']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3987e5"
                      strokeWidth={2}
                      fill="url(#areaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="shift-comparison">
                {stats.shiftCounts.map(sc => {
                  const stationOfficersPerShift = Math.round((STAFFING.stations[selectedStation]?.officers || 0) * (sc.officers / STAFFING.assignments.patrol));
                  return (
                    <div key={sc.id} className="shift-stat">
                      <span className="shift-stat-label">{sc.label.split(' ')[0]}</span>
                      <span className="shift-stat-value">{formatNumber(sc.incidents)}</span>
                      <span className="shift-stat-ratio">
                        ~{stationOfficersPerShift} officers
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="section">
              <header className="section-header">
                <h2>Top Incident Types</h2>
                <p className="section-desc">
                  Most common incident categories at {selectedStation} station.
                </p>
              </header>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={topCategories}
                    layout="vertical"
                    margin={{ top: 0, right: 40, bottom: 0, left: 140 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tick={{ fontSize: 12, fill: '#c3c2b7' }}
                      tickLine={false}
                      axisLine={false}
                      width={135}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a19',
                        border: '1px solid #2c2c2a',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#f0efec' }}
                      formatter={(value) => [Number(value).toLocaleString(), 'Incidents']}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#3987e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="section">
              <header className="section-header">
                <h2>Compare to Other Stations</h2>
              </header>

              <div className="compare-grid">
                {districtData.map(({ district, count, officers }) => {
                  const isSelected = district === selectedStation;
                  const callsPerOfficer = officers > 0 ? Math.round(count / officers) : 0;
                  return (
                    <button
                      key={district}
                      className={`compare-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedStation(district)}
                    >
                      <span className="compare-name">{district}</span>
                      <span className="compare-value">{callsPerOfficer}</span>
                      <span className="compare-label">per officer</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
