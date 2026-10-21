import { useState, useMemo } from 'react';
import { useIncidents } from './hooks/useIncidents';
import type { TimeRange } from './services/sfOpenData';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell,
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
};

const SF_DISTRICTS = [
  'Bayview', 'Central', 'Ingleside', 'Mission', 'Northern',
  'Park', 'Richmond', 'Southern', 'Taraval', 'Tenderloin'
];

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { incidents, loading, error } = useIncidents(timeRange);

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

    incidents.forEach(inc => {
      if (inc.hour >= 0 && inc.hour < 24) {
        hours[inc.hour].count++;
      }
    });

    return hours;
  }, [incidents]);

  const districtData = useMemo(() => {
    const counts = new Map<string, number>();
    incidents.forEach(inc => {
      counts.set(inc.district, (counts.get(inc.district) || 0) + 1);
    });

    return SF_DISTRICTS
      .map(d => ({ district: d, count: counts.get(d) || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  const stats = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === '3months' ? 90 : 365;
    const perDay = Math.round(incidents.length / days);

    const peakHour = hourlyData.reduce((max, h) => h.count > max.count ? h : max, hourlyData[0]);

    const shiftCounts = shiftData.map(shift => {
      const count = shift.hours.reduce((sum, h) => sum + hourlyData[h].count, 0);
      return { ...shift, incidents: count };
    });

    return { total: incidents.length, perDay, peakHour, shiftCounts };
  }, [incidents, timeRange, hourlyData, shiftData]);

  
  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-title">SFPD Staffing Analysis</span>
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
            <h2>Calls for Service</h2>
            <p className="section-desc">
              {loading ? 'Loading...' : error ? error : `${formatNumber(stats.total)} incidents in the selected period — ${stats.perDay} per day average.`}
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
              <span className="stat-label">Peak Hour</span>
              <span className="stat-value">{stats.peakHour?.label || '-'}</span>
            </div>
          </div>
        </section>

        <section className="section">
          <header className="section-header">
            <h2>When Calls Come In</h2>
            <p className="section-desc">
              Incident volume by hour of day. Peak demand often misaligns with staffing.
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
            {stats.shiftCounts.map(sc => (
              <div key={sc.id} className="shift-stat">
                <span className="shift-stat-label">{sc.label.split(' ')[0]}</span>
                <span className="shift-stat-value">{formatNumber(sc.incidents)}</span>
                <span className="shift-stat-ratio">
                  {Math.round(sc.incidents / sc.officers)} calls/officer
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <header className="section-header">
            <h2>District Workload</h2>
            <p className="section-desc">
              Incident volume by police district.
            </p>
          </header>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={districtData}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 80 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="district"
                  tick={{ fontSize: 13, fill: '#c3c2b7' }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
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
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {districtData.map((entry, index) => (
                    <Cell
                      key={entry.district}
                      fill={index === 0 ? '#3987e5' : '#256abf'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="section closing">
          <header className="section-header">
            <h2>The Gap</h2>
            <p className="section-desc">
              With {STAFFING.assignments.patrol.toLocaleString()} patrol officers across 10 districts and 3 shifts,
              each officer handles roughly {Math.round(stats.total / STAFFING.assignments.patrol)} incidents per {timeRange === 'week' ? 'week' : timeRange === 'month' ? 'month' : timeRange === '3months' ? 'quarter' : 'year'}.
            </p>
          </header>
        </section>
      </main>
    </div>
  );
}

export default App;
