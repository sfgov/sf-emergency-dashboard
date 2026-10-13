import { useState, useMemo } from 'react';
import type { Incident } from '../types/incidents';

interface StaffingSimulatorProps {
  incidents: Incident[];
}

type TimePeriod = 'day' | 'night';
type TeamType = 'police' | 'streetTeam' | 'ambassadors' | 'dpw';

interface StaffingEntry {
  day: number;
  night: number;
}

type DistrictStaffing = Record<TeamType, StaffingEntry>;
type StaffingData = Record<string, DistrictStaffing>;

interface Scenario {
  name: string;
  staffing: StaffingData;
}

const DISTRICTS = [
  'Bayview', 'Central', 'Ingleside', 'Mission', 'Northern',
  'Park', 'Richmond', 'Southern', 'Taraval', 'Tenderloin',
];

const TEAMS: { key: TeamType; label: string; color: string }[] = [
  { key: 'police', label: 'Police', color: 'var(--accent)' },
  { key: 'streetTeam', label: 'Street Teams', color: '#8b5cf6' },
  { key: 'ambassadors', label: 'Ambassadors', color: '#06b6d4' },
  { key: 'dpw', label: 'DPW', color: '#f59e0b' },
];

const TEMPLATES: Record<string, { label: string; description: string; getStaffing: () => StaffingData }> = {
  weekday: {
    label: 'Weekday',
    description: 'Standard weekday staffing',
    getStaffing: () => createStaffing({ police: { day: 10, night: 6 }, streetTeam: { day: 3, night: 1 }, ambassadors: { day: 4, night: 0 }, dpw: { day: 2, night: 0 } }),
  },
  weekend: {
    label: 'Weekend',
    description: 'Higher night coverage',
    getStaffing: () => createStaffing({ police: { day: 8, night: 10 }, streetTeam: { day: 2, night: 2 }, ambassadors: { day: 2, night: 0 }, dpw: { day: 1, night: 0 } }),
  },
  event: {
    label: 'Event Day',
    description: 'Major event in downtown',
    getStaffing: () => {
      const base = createStaffing({ police: { day: 8, night: 6 }, streetTeam: { day: 2, night: 1 }, ambassadors: { day: 3, night: 0 }, dpw: { day: 2, night: 0 } });
      base['Central'].police = { day: 18, night: 14 };
      base['Southern'].police = { day: 14, night: 10 };
      base['Northern'].police = { day: 12, night: 10 };
      return base;
    },
  },
  minimal: {
    label: 'Minimal',
    description: 'Skeleton crew',
    getStaffing: () => createStaffing({ police: { day: 6, night: 4 }, streetTeam: { day: 1, night: 0 }, ambassadors: { day: 2, night: 0 }, dpw: { day: 1, night: 0 } }),
  },
};

function createStaffing(defaults: Record<TeamType, StaffingEntry>): StaffingData {
  const data: StaffingData = {};
  DISTRICTS.forEach(d => {
    data[d] = {
      police: { ...defaults.police },
      streetTeam: { ...defaults.streetTeam },
      ambassadors: { ...defaults.ambassadors },
      dpw: { ...defaults.dpw },
    };
  });
  return data;
}

function cloneStaffing(s: StaffingData): StaffingData {
  return JSON.parse(JSON.stringify(s));
}

const OFFICER_INITIATED_PATTERNS = ['officer initiated', 'traffic stop', 'foot patrol', 'self-initiated', 'on-view'];

function isOfficerInitiated(incident: Incident): boolean {
  const text = `${incident.category || ''} ${incident.description || ''}`.toLowerCase();
  return OFFICER_INITIATED_PATTERNS.some(p => text.includes(p));
}

function getPriorityBucket(priority?: string): 'A' | 'B' | 'C' | null {
  if (!priority) return null;
  const p = priority.toUpperCase().charAt(0);
  if (p === 'A' || p === '1' || p === 'E' || p === '3') return 'A';
  if (p === 'B' || p === '2') return 'B';
  if (p === 'C') return 'C';
  return null;
}

interface CallStats {
  total: number;
  officerInitiated: number;
  priorityA: number;
  priorityB: number;
  priorityC: number;
  byDistrict: Record<string, { day: number; night: number }>;
}

function computeCallStats(incidents: Incident[]): CallStats {
  const stats: CallStats = {
    total: 0,
    officerInitiated: 0,
    priorityA: 0,
    priorityB: 0,
    priorityC: 0,
    byDistrict: {},
  };

  DISTRICTS.forEach(d => stats.byDistrict[d] = { day: 0, night: 0 });

  incidents.forEach(incident => {
    stats.total++;
    if (isOfficerInitiated(incident)) stats.officerInitiated++;

    const priority = getPriorityBucket(incident.priority);
    if (priority === 'A') stats.priorityA++;
    else if (priority === 'B') stats.priorityB++;
    else if (priority === 'C') stats.priorityC++;

    const hour = incident.timestamp?.getHours();
    const isDay = hour !== undefined && hour >= 6 && hour < 18;

    const district = DISTRICTS.find(d => incident.district?.toLowerCase().includes(d.toLowerCase()));
    if (district) {
      if (isDay) stats.byDistrict[district].day++;
      else stats.byDistrict[district].night++;
    }
  });

  return stats;
}

function getTotals(staffing: StaffingData): Record<TeamType, { day: number; night: number }> {
  const totals: Record<TeamType, { day: number; night: number }> = {
    police: { day: 0, night: 0 },
    streetTeam: { day: 0, night: 0 },
    ambassadors: { day: 0, night: 0 },
    dpw: { day: 0, night: 0 },
  };

  DISTRICTS.forEach(d => {
    TEAMS.forEach(({ key }) => {
      totals[key].day += staffing[d][key].day;
      totals[key].night += staffing[d][key].night;
    });
  });

  return totals;
}

export function StaffingSimulator({ incidents }: StaffingSimulatorProps) {
  const [baseline, setBaseline] = useState<StaffingData>(() => TEMPLATES.weekday.getStaffing());
  const [proposed, setProposed] = useState<StaffingData>(() => TEMPLATES.weekday.getStaffing());
  const [activeTeam, setActiveTeam] = useState<TeamType>('police');
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('day');
  const [moveFrom, setMoveFrom] = useState(DISTRICTS[0]);
  const [moveTo, setMoveTo] = useState(DISTRICTS[1]);
  const [moveCount, setMoveCount] = useState(2);
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [expanded, setExpanded] = useState(true);

  const callStats = useMemo(() => computeCallStats(incidents), [incidents]);
  const baselineTotals = useMemo(() => getTotals(baseline), [baseline]);
  const proposedTotals = useMemo(() => getTotals(proposed), [proposed]);

  const applyTemplate = (key: string) => {
    const newStaffing = TEMPLATES[key].getStaffing();
    setBaseline(newStaffing);
    setProposed(cloneStaffing(newStaffing));
  };

  const updateProposed = (district: string, team: TeamType, period: TimePeriod, value: number) => {
    setProposed(prev => ({
      ...prev,
      [district]: {
        ...prev[district],
        [team]: { ...prev[district][team], [period]: Math.max(0, value) },
      },
    }));
  };

  const executeMove = () => {
    if (moveFrom === moveTo) return;
    setProposed(prev => {
      const next = cloneStaffing(prev);
      const available = next[moveFrom][activeTeam][activePeriod];
      const actual = Math.min(moveCount, available);
      next[moveFrom][activeTeam][activePeriod] -= actual;
      next[moveTo][activeTeam][activePeriod] += actual;
      return next;
    });
  };

  const resetToBaseline = () => setProposed(cloneStaffing(baseline));
  const saveAsBaseline = () => setBaseline(cloneStaffing(proposed));

  const saveScenario = () => {
    const name = `Scenario ${savedScenarios.length + 1}`;
    setSavedScenarios(prev => [...prev, { name, staffing: cloneStaffing(proposed) }]);
  };

  const loadScenario = (scenario: Scenario) => {
    setProposed(cloneStaffing(scenario.staffing));
  };

  const copyToClipboard = () => {
    const totals = proposedTotals;
    let text = `STAFFING PLAN - ${new Date().toLocaleDateString()}\n\n`;
    text += `TOTALS\n`;
    TEAMS.forEach(({ key, label }) => {
      text += `  ${label}: ${totals[key].day} day / ${totals[key].night} night\n`;
    });
    text += `\nBY DISTRICT (${TEAMS.find(t => t.key === activeTeam)?.label})\n`;
    DISTRICTS.forEach(d => {
      text += `  ${d.padEnd(12)} ${proposed[d][activeTeam].day.toString().padStart(3)} day / ${proposed[d][activeTeam].night.toString().padStart(3)} night\n`;
    });
    navigator.clipboard.writeText(text);
  };

  const getDiff = (district: string, team: TeamType, period: TimePeriod): number => {
    return proposed[district][team][period] - baseline[district][team][period];
  };

  const getWorkload = (staffing: StaffingData, district: string, period: TimePeriod): number => {
    const calls = callStats.byDistrict[district][period];
    const officers = staffing[district].police[period];
    return officers > 0 ? calls / officers : calls;
  };

  return (
    <div className="staffing-simulator">
      <header className="section-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <h2>Staffing Planner</h2>
          <p className="section-subtitle">Compare scenarios. Move resources. Export plans.</p>
        </div>
        <button className="expand-toggle">{expanded ? '−' : '+'}</button>
      </header>

      {expanded && (
        <>
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-value">{callStats.total.toLocaleString()}</span>
              <span className="stat-label">Total Calls</span>
            </div>
            <div className="stat">
              <span className="stat-value">{callStats.officerInitiated.toLocaleString()}</span>
              <span className="stat-label">Officer Initiated</span>
              <span className="stat-pct">{callStats.total > 0 ? Math.round(callStats.officerInitiated / callStats.total * 100) : 0}%</span>
            </div>
            <div className="stat priority-a">
              <span className="stat-value">{callStats.priorityA.toLocaleString()}</span>
              <span className="stat-label">Priority A</span>
            </div>
            <div className="stat priority-b">
              <span className="stat-value">{callStats.priorityB.toLocaleString()}</span>
              <span className="stat-label">Priority B</span>
            </div>
            <div className="stat priority-c">
              <span className="stat-value">{callStats.priorityC.toLocaleString()}</span>
              <span className="stat-label">Priority C</span>
            </div>
          </div>

          {/* Templates */}
          <div className="templates-row">
            <span className="row-label">Templates</span>
            {Object.entries(TEMPLATES).map(([key, { label }]) => (
              <button key={key} onClick={() => applyTemplate(key)}>{label}</button>
            ))}
            {savedScenarios.length > 0 && (
              <>
                <span className="divider">|</span>
                {savedScenarios.map((s, i) => (
                  <button key={i} onClick={() => loadScenario(s)}>{s.name}</button>
                ))}
              </>
            )}
          </div>

          {/* Controls Row */}
          <div className="controls-row">
            <div className="control-group">
              <span className="control-label">Team</span>
              <div className="btn-group">
                {TEAMS.map(({ key, label, color }) => (
                  <button
                    key={key}
                    className={activeTeam === key ? 'active' : ''}
                    onClick={() => setActiveTeam(key)}
                    style={activeTeam === key ? { borderColor: color, color } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-group">
              <span className="control-label">Shift</span>
              <div className="btn-group">
                <button className={activePeriod === 'day' ? 'active' : ''} onClick={() => setActivePeriod('day')}>Day (6a-6p)</button>
                <button className={activePeriod === 'night' ? 'active' : ''} onClick={() => setActivePeriod('night')}>Night (6p-6a)</button>
              </div>
            </div>
          </div>

          {/* What-If Move */}
          <div className="move-row">
            <span className="row-label">Move</span>
            <input type="number" min="1" max="20" value={moveCount} onChange={e => setMoveCount(parseInt(e.target.value) || 1)} />
            <span>from</span>
            <select value={moveFrom} onChange={e => setMoveFrom(e.target.value)}>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span>to</span>
            <select value={moveTo} onChange={e => setMoveTo(e.target.value)}>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button className="action-btn" onClick={executeMove}>Apply</button>
          </div>

          {/* Comparison Table */}
          <div className="comparison-table">
            <div className="table-header">
              <div className="col col-district">District</div>
              <div className="col col-calls">Calls</div>
              <div className="col col-baseline">Baseline</div>
              <div className="col col-proposed">Proposed</div>
              <div className="col col-diff">+/-</div>
              <div className="col col-workload">Calls/Ofc</div>
            </div>
            {DISTRICTS.map(district => {
              const calls = callStats.byDistrict[district][activePeriod];
              const baseVal = baseline[district][activeTeam][activePeriod];
              const propVal = proposed[district][activeTeam][activePeriod];
              const diff = getDiff(district, activeTeam, activePeriod);
              const workloadBase = getWorkload(baseline, district, activePeriod);
              const workloadProp = getWorkload(proposed, district, activePeriod);
              const workloadChange = workloadProp - workloadBase;

              return (
                <div key={district} className="table-row">
                  <div className="col col-district">{district}</div>
                  <div className="col col-calls">{calls}</div>
                  <div className="col col-baseline">{baseVal}</div>
                  <div className="col col-proposed">
                    <button onClick={() => updateProposed(district, activeTeam, activePeriod, propVal - 1)}>−</button>
                    <input
                      type="number"
                      min="0"
                      value={propVal}
                      onChange={e => updateProposed(district, activeTeam, activePeriod, parseInt(e.target.value) || 0)}
                    />
                    <button onClick={() => updateProposed(district, activeTeam, activePeriod, propVal + 1)}>+</button>
                  </div>
                  <div className={`col col-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </div>
                  <div className={`col col-workload ${workloadChange < -1 ? 'improved' : workloadChange > 1 ? 'worse' : ''}`}>
                    {activeTeam === 'police' ? workloadProp.toFixed(1) : '—'}
                  </div>
                </div>
              );
            })}
            <div className="table-footer">
              <div className="col col-district">Total</div>
              <div className="col col-calls">{Object.values(callStats.byDistrict).reduce((sum, d) => sum + d[activePeriod], 0)}</div>
              <div className="col col-baseline">{baselineTotals[activeTeam][activePeriod]}</div>
              <div className="col col-proposed">{proposedTotals[activeTeam][activePeriod]}</div>
              <div className={`col col-diff ${proposedTotals[activeTeam][activePeriod] - baselineTotals[activeTeam][activePeriod] > 0 ? 'positive' : proposedTotals[activeTeam][activePeriod] - baselineTotals[activeTeam][activePeriod] < 0 ? 'negative' : ''}`}>
                {proposedTotals[activeTeam][activePeriod] - baselineTotals[activeTeam][activePeriod] > 0 ? '+' : ''}{proposedTotals[activeTeam][activePeriod] - baselineTotals[activeTeam][activePeriod]}
              </div>
              <div className="col col-workload"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="actions-row">
            <button onClick={resetToBaseline}>Reset to Baseline</button>
            <button onClick={saveAsBaseline}>Set as Baseline</button>
            <button onClick={saveScenario}>Save Scenario</button>
            <button onClick={copyToClipboard}>Copy Plan</button>
          </div>
        </>
      )}
    </div>
  );
}
