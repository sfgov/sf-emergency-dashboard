import { Incident } from '../types/incidents';

interface StatsSummaryProps {
  incidents: Incident[];
}

export function StatsSummary({ incidents }: StatsSummaryProps) {
  const policeCalls = incidents.filter(i => i.type === 'police').length;
  const fireCalls = incidents.filter(i => i.type === 'fire').length;
  const calls311 = incidents.filter(i => i.type === '311').length;

  return (
    <div className="stats-summary">
      <div className="stat-card total">
        <div className="stat-value">{incidents.length}</div>
        <div className="stat-label">Total Incidents</div>
      </div>
      <div className="stat-card police">
        <div className="stat-value">{policeCalls}</div>
        <div className="stat-label">Police</div>
      </div>
      <div className="stat-card fire">
        <div className="stat-value">{fireCalls}</div>
        <div className="stat-label">Fire</div>
      </div>
      <div className="stat-card calls311">
        <div className="stat-value">{calls311}</div>
        <div className="stat-label">311 Calls</div>
      </div>
    </div>
  );
}
