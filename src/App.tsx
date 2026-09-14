import { useState, useMemo } from 'react';
import {
  IncidentMap,
  FilterPanel,
  PriorityChart,
  ResponderChart,
  HourlyChart,
  EncampmentTracker,
  StationChart,
  IncidentList
} from './components';
import {
  useIncidents,
  useFilteredIncidents,
  usePriorityStats,
  useResponderStats,
  useHourlyStats,
  useEncampmentStats,
  useStationStats
} from './hooks/useIncidents';
import type { IncidentFilter } from './types/incidents';
import './App.css';

function App() {
  const [filter, setFilter] = useState<IncidentFilter>({
    types: [],
    districts: [],
    timeRange: 'week',
  });

  const { incidents, loading, error, refetch } = useIncidents(filter.timeRange);
  const filteredIncidents = useFilteredIncidents(incidents, filter);

  const priorityStats = usePriorityStats(filteredIncidents);
  const responderStats = useResponderStats(filteredIncidents);
  const hourlyStats = useHourlyStats(filteredIncidents);
  const encampmentStats = useEncampmentStats(filteredIncidents);
  const stationStats = useStationStats(filteredIncidents);

  const uniqueDistricts = useMemo(() => {
    return [...new Set(incidents.map(i => i.district))].sort();
  }, [incidents]);

  const encampmentCount = filteredIncidents.filter(i => i.isEncampment).length;
  const avgResponseTime = filteredIncidents
    .filter(i => i.responseTimeMinutes !== undefined)
    .reduce((sum, i, _, arr) => sum + (i.responseTimeMinutes || 0) / arr.length, 0);

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading data</h2>
        <p>{error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>SF Emergency Response Dashboard</h1>
            <p>Real-time 911/311 calls, response analysis, and encampment tracking</p>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-value">{filteredIncidents.length}</span>
              <span className="header-stat-label">Total Calls</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">{encampmentCount}</span>
              <span className="header-stat-label">Encampment</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">{Math.round(avgResponseTime)}m</span>
              <span className="header-stat-label">Avg Response</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <FilterPanel
            filter={filter}
            onFilterChange={setFilter}
            districts={uniqueDistricts}
          />
        </aside>

        <section className="content">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading incidents...</p>
            </div>
          ) : (
            <>
              {/* Row 1: Priority & Responder Analysis */}
              <div className="section-header">
                <h2>What's Coming In?</h2>
                <span className="section-subtitle">Call priority breakdown and responder allocation</span>
              </div>
              <div className="charts-row three-col">
                <PriorityChart stats={priorityStats} />
                <ResponderChart stats={responderStats} />
                <HourlyChart stats={hourlyStats} />
              </div>

              {/* Row 2: Encampment Tracking */}
              <div className="section-header">
                <h2>Encampment Tickets</h2>
                <span className="section-subtitle">311 encampment-related requests by district</span>
              </div>
              <div className="charts-row">
                <EncampmentTracker stats={encampmentStats} incidents={filteredIncidents} />
              </div>

              {/* Row 3: Map */}
              <div className="section-header">
                <h2>Live Map</h2>
                <span className="section-subtitle">All incidents plotted by location</span>
              </div>
              <div className="map-container">
                <IncidentMap incidents={filteredIncidents} />
              </div>

              {/* Row 4: Station Breakdown & Recent Incidents */}
              <div className="section-header">
                <h2>Station Activity</h2>
                <span className="section-subtitle">Fire/EMS stations by call volume</span>
              </div>
              <div className="charts-row">
                <StationChart stats={stationStats} />
                <IncidentList incidents={filteredIncidents} />
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Data from <a href="https://datasf.org" target="_blank" rel="noopener noreferrer">SF OpenData</a>
          {' | '}
          Last updated: {new Date().toLocaleString()}
          {' | '}
          <button onClick={refetch} className="refresh-btn">Refresh</button>
        </p>
      </footer>
    </div>
  );
}

export default App;
