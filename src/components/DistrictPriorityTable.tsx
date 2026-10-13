import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { Incident, DistrictPriorityMonthlyStats } from '../types/incidents';

interface DistrictPriorityTableProps {
  incidents: Incident[];
}

type PriorityFilter = 'all' | 'A' | 'B' | 'C';
type ViewMode = 'total' | 'officer-initiated';

const PRIORITY_LABELS: Record<string, string> = {
  A: 'A · immediate danger',
  B: 'B · recent crime',
  C: 'C · no present danger',
};

const OFFICER_INITIATED_PATTERNS = [
  'officer initiated',
  'oi ',
  'traffic stop',
  'foot patrol',
  'self-initiated',
  'on-view',
  'flag down',
];

function isOfficerInitiated(incident: Incident): boolean {
  const text = `${incident.category || ''} ${incident.description || ''}`.toLowerCase();
  return OFFICER_INITIATED_PATTERNS.some(pattern => text.includes(pattern));
}

function getPriorityBucket(priority?: string): 'A' | 'B' | 'C' | null {
  if (!priority) return null;
  const p = priority.toUpperCase().charAt(0);
  if (p === 'A' || p === '1' || p === 'E' || p === '3') return 'A';
  if (p === 'B' || p === '2') return 'B';
  if (p === 'C') return 'C';
  return null;
}

function getPoliceDistrict(incident: Incident): string | null {
  if (incident.type === 'police') return incident.district;
  if (incident.responder === 'PD') return incident.district;
  return null;
}

export function DistrictPriorityTable({ incidents }: DistrictPriorityTableProps) {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('total');

  const { monthlyStats, months, districts, citywideTotals } = useMemo(() => {
    const statsMap = new Map<string, DistrictPriorityMonthlyStats>();
    const monthSet = new Set<string>();
    const districtSet = new Set<string>();
    const citywide: Record<string, { total: number; oi: number; priorityA: number; priorityB: number; priorityC: number }> = {};

    incidents.forEach(incident => {
      const district = getPoliceDistrict(incident);
      if (!district || district === 'Unknown') return;

      const priorityBucket = getPriorityBucket(incident.priority);
      if (!priorityBucket) return;

      const month = format(incident.timestamp, 'yyyy-MM');
      const key = `${district}|${month}`;

      monthSet.add(month);
      districtSet.add(district);

      if (!citywide[month]) {
        citywide[month] = { total: 0, oi: 0, priorityA: 0, priorityB: 0, priorityC: 0 };
      }

      const existing = statsMap.get(key) || {
        district,
        month,
        priorityA: 0,
        priorityB: 0,
        priorityC: 0,
        officerInitiatedA: 0,
        officerInitiatedB: 0,
        officerInitiatedC: 0,
        total: 0,
      };

      existing.total++;
      citywide[month].total++;
      const oi = isOfficerInitiated(incident);
      if (oi) citywide[month].oi++;

      if (priorityBucket === 'A') {
        existing.priorityA++;
        citywide[month].priorityA++;
        if (oi) existing.officerInitiatedA++;
      } else if (priorityBucket === 'B') {
        existing.priorityB++;
        citywide[month].priorityB++;
        if (oi) existing.officerInitiatedB++;
      } else {
        existing.priorityC++;
        citywide[month].priorityC++;
        if (oi) existing.officerInitiatedC++;
      }

      statsMap.set(key, existing);
    });

    const sortedMonths = Array.from(monthSet).sort().reverse();
    const sortedDistricts = Array.from(districtSet).sort();

    return {
      monthlyStats: statsMap,
      months: sortedMonths,
      districts: sortedDistricts,
      citywideTotals: citywide,
    };
  }, [incidents]);

  const getCellValue = (stats: DistrictPriorityMonthlyStats | undefined, priority: PriorityFilter): number => {
    if (!stats) return 0;
    if (viewMode === 'officer-initiated') {
      if (priority === 'A') return stats.officerInitiatedA;
      if (priority === 'B') return stats.officerInitiatedB;
      if (priority === 'C') return stats.officerInitiatedC;
      return stats.officerInitiatedA + stats.officerInitiatedB + stats.officerInitiatedC;
    }
    if (priority === 'A') return stats.priorityA;
    if (priority === 'B') return stats.priorityB;
    if (priority === 'C') return stats.priorityC;
    return stats.total;
  };

  const getCitywideValue = (month: string, priority: PriorityFilter): number => {
    const cw = citywideTotals[month];
    if (!cw) return 0;
    if (priority === 'A') return cw.priorityA;
    if (priority === 'B') return cw.priorityB;
    if (priority === 'C') return cw.priorityC;
    return cw.total;
  };

  const getDeviation = (districtVal: number, citywideVal: number, districtCount: number): string => {
    if (districtCount === 0 || citywideVal === 0) return '-';
    const avgPerDistrict = citywideVal / districts.length;
    const diff = ((districtVal - avgPerDistrict) / avgPerDistrict) * 100;
    if (Math.abs(diff) < 1) return '0%';
    return diff > 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`;
  };

  if (months.length === 0 || districts.length === 0) {
    return (
      <div className="district-priority-section">
        <h2>Priority calls by district</h2>
        <p className="section-subtitle">No priority data available for the selected time range</p>
      </div>
    );
  }

  return (
    <div className="district-priority-section">
      <header className="section-header">
        <div>
          <h2>Priority calls by district</h2>
          <p className="section-subtitle">
            Month-over-month breakdown of calls by police district.
            Officer-initiated calls include traffic stops, foot patrols, and proactive enforcement.
          </p>
        </div>
      </header>

      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Priority</span>
          <div className="filter-options">
            <label className={priorityFilter === 'all' ? 'active' : ''}>
              <input
                type="radio"
                name="priority"
                checked={priorityFilter === 'all'}
                onChange={() => setPriorityFilter('all')}
              />
              All
            </label>
            <label className={priorityFilter === 'A' ? 'active priority-a' : ''}>
              <input
                type="radio"
                name="priority"
                checked={priorityFilter === 'A'}
                onChange={() => setPriorityFilter('A')}
              />
              {PRIORITY_LABELS.A}
            </label>
            <label className={priorityFilter === 'B' ? 'active priority-b' : ''}>
              <input
                type="radio"
                name="priority"
                checked={priorityFilter === 'B'}
                onChange={() => setPriorityFilter('B')}
              />
              {PRIORITY_LABELS.B}
            </label>
            <label className={priorityFilter === 'C' ? 'active priority-c' : ''}>
              <input
                type="radio"
                name="priority"
                checked={priorityFilter === 'C'}
                onChange={() => setPriorityFilter('C')}
              />
              {PRIORITY_LABELS.C}
            </label>
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">View</span>
          <div className="filter-options">
            <label className={viewMode === 'total' ? 'active' : ''}>
              <input
                type="radio"
                name="view"
                checked={viewMode === 'total'}
                onChange={() => setViewMode('total')}
              />
              All calls
            </label>
            <label className={viewMode === 'officer-initiated' ? 'active' : ''}>
              <input
                type="radio"
                name="view"
                checked={viewMode === 'officer-initiated'}
                onChange={() => setViewMode('officer-initiated')}
              />
              Officer-initiated only
            </label>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-district">District</th>
              {months.map(month => (
                <th key={month} className="col-month">
                  {format(new Date(month + '-01'), 'MMM yyyy')}
                </th>
              ))}
              <th className="col-deviation">vs. Citywide</th>
            </tr>
          </thead>
          <tbody>
            {districts.map(district => {
              const latestMonth = months[0];
              const latestStats = monthlyStats.get(`${district}|${latestMonth}`);
              const districtVal = getCellValue(latestStats, priorityFilter);
              const citywideVal = getCitywideValue(latestMonth, priorityFilter);
              const deviation = getDeviation(districtVal, citywideVal, districts.length);

              return (
                <tr key={district}>
                  <td className="col-district">{district}</td>
                  {months.map(month => {
                    const stats = monthlyStats.get(`${district}|${month}`);
                    const value = getCellValue(stats, priorityFilter);
                    return (
                      <td key={month} className="col-month">
                        {value > 0 ? value.toLocaleString() : '-'}
                      </td>
                    );
                  })}
                  <td className={`col-deviation ${deviation.startsWith('+') ? 'above' : deviation.startsWith('-') ? 'below' : ''}`}>
                    {deviation}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="col-district">Citywide</td>
              {months.map(month => {
                const cw = citywideTotals[month];
                let value = 0;
                if (cw) {
                  if (priorityFilter === 'A') value = cw.priorityA;
                  else if (priorityFilter === 'B') value = cw.priorityB;
                  else if (priorityFilter === 'C') value = cw.priorityC;
                  else value = cw.total;
                }
                return (
                  <td key={month} className="col-month">
                    {value > 0 ? value.toLocaleString() : '-'}
                  </td>
                );
              })}
              <td className="col-deviation">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <footer className="section-footer">
        <p>
          <strong>Method:</strong> Calls are categorized by priority at dispatch.
          Officer-initiated calls are identified by call type descriptions containing
          patterns like "officer initiated," "traffic stop," or "foot patrol."
          Deviation compares each district's call volume to the citywide average per district.
        </p>
      </footer>
    </div>
  );
}
