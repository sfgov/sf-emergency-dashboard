import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Incident, DistrictPriorityMonthlyStats } from '../types/incidents';

interface DistrictPriorityTableProps {
  incidents: Incident[];
}

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
  const { monthlyStats, months, districts } = useMemo(() => {
    const statsMap = new Map<string, DistrictPriorityMonthlyStats>();
    const monthSet = new Set<string>();
    const districtSet = new Set<string>();

    incidents.forEach(incident => {
      const district = getPoliceDistrict(incident);
      if (!district || district === 'Unknown') return;

      const priorityBucket = getPriorityBucket(incident.priority);
      if (!priorityBucket) return;

      const month = format(incident.timestamp, 'yyyy-MM');
      const key = `${district}|${month}`;

      monthSet.add(month);
      districtSet.add(district);

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
      const oi = isOfficerInitiated(incident);

      if (priorityBucket === 'A') {
        existing.priorityA++;
        if (oi) existing.officerInitiatedA++;
      } else if (priorityBucket === 'B') {
        existing.priorityB++;
        if (oi) existing.officerInitiatedB++;
      } else {
        existing.priorityC++;
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
    };
  }, [incidents]);

  if (months.length === 0 || districts.length === 0) {
    return (
      <div className="district-priority-table">
        <h3>District Priority Breakdown</h3>
        <p className="no-data">No priority data available</p>
      </div>
    );
  }

  return (
    <div className="district-priority-table">
      <h3>Priority Calls by District (Month over Month)</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>District</th>
              {months.map(month => (
                <th key={month} colSpan={6}>
                  {format(new Date(month + '-01'), 'MMM yyyy')}
                </th>
              ))}
            </tr>
            <tr>
              {months.map(month => (
                <Fragment key={month}>
                  <th className="priority-a">A</th>
                  <th className="priority-a-oi">OI</th>
                  <th className="priority-b">B</th>
                  <th className="priority-b-oi">OI</th>
                  <th className="priority-c">C</th>
                  <th className="priority-c-oi">OI</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {districts.map(district => (
              <tr key={district}>
                <td className="district-name">{district}</td>
                {months.map(month => {
                  const stats = monthlyStats.get(`${district}|${month}`);
                  return (
                    <Fragment key={month}>
                      <td className="priority-a">{stats?.priorityA || 0}</td>
                      <td className="priority-a-oi">{stats?.officerInitiatedA || 0}</td>
                      <td className="priority-b">{stats?.priorityB || 0}</td>
                      <td className="priority-b-oi">{stats?.officerInitiatedB || 0}</td>
                      <td className="priority-c">{stats?.priorityC || 0}</td>
                      <td className="priority-c-oi">{stats?.officerInitiatedC || 0}</td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-legend">
        <span><strong>A</strong> = Priority A (Critical)</span>
        <span><strong>B</strong> = Priority B (Urgent)</span>
        <span><strong>C</strong> = Priority C (Non-urgent)</span>
        <span><strong>OI</strong> = Officer Initiated</span>
      </div>
    </div>
  );
}

const Fragment = ({ children }: { children: React.ReactNode }) => <>{children}</>;
