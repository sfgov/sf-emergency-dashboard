import { useState, useMemo } from 'react';
import { IncidentMap, FilterPanel, DistrictChart, StationChart, IncidentList, StatsSummary } from './components';
import { useIncidents, useFilteredIncidents, useDistrictStats, useStationStats } from './hooks/useIncidents';
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
  const districtStats = useDistrictStats(filteredIncidents);
  const stationStats = useStationStats(filteredIncidents);

  const uniqueDistricts = useMemo(() => {
    return [...new Set(incidents.map(i => i.district))].sort();
  }, [incidents]);

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
        <h1>SF Emergency Response Dashboard</h1>
        <p>Real-time emergency calls, police incidents, and 311 requests</p>
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
              <StatsSummary incidents={filteredIncidents} />

              <div className="map-container">
                <IncidentMap incidents={filteredIncidents} />
              </div>

              <div className="charts-row">
                <DistrictChart stats={districtStats} />
                <StationChart stats={stationStats} />
              </div>

              <div className="charts-row">
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
