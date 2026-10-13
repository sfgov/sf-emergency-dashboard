import { useState, useMemo } from 'react';
import type { Incident } from '../types/incidents';

interface StaffingSimulatorProps {
  incidents: Incident[];
}

type TimePeriod = 'overnight' | 'morning' | 'afternoon' | 'evening';

interface TeamStaffing {
  overnight: number;
  morning: number;
  afternoon: number;
  evening: number;
}

interface DistrictStaffing {
  police: TeamStaffing;
  streetTeam: TeamStaffing;
  ambassadors: TeamStaffing;
  dpw: TeamStaffing;
}

type StaffingData = Record<string, DistrictStaffing>;
type TeamType = keyof DistrictStaffing;

const TIME_PERIODS: { key: TimePeriod; label: string; hours: number[]; short: string }[] = [
  { key: 'overnight', label: 'Overnight (10p-6a)', hours: [22, 23, 0, 1, 2, 3, 4, 5], short: '10p-6a' },
  { key: 'morning', label: 'Morning (6a-12p)', hours: [6, 7, 8, 9, 10, 11], short: '6a-12p' },
  { key: 'afternoon', label: 'Afternoon (12p-6p)', hours: [12, 13, 14, 15, 16, 17], short: '12p-6p' },
  { key: 'evening', label: 'Evening (6p-10p)', hours: [18, 19, 20, 21], short: '6p-10p' },
];

const DISTRICTS = [
  'Bayview',
  'Central',
  'Ingleside',
  'Mission',
  'Northern',
  'Park',
  'Richmond',
  'Southern',
  'Taraval',
  'Tenderloin',
];

const TEAM_CONFIG: Record<TeamType, { label: string; color: string; canDivert: string[] }> = {
  police: { label: 'Police', color: 'var(--accent)', canDivert: [] },
  streetTeam: { label: 'Street Teams', color: '#8b5cf6', canDivert: ['homeless', 'encampment', 'mental health', 'welfare'] },
  ambassadors: { label: 'Ambassadors', color: '#06b6d4', canDivert: ['quality of life', 'noise', 'trespass'] },
  dpw: { label: 'DPW', color: '#f59e0b', canDivert: ['debris', 'illegal dumping', 'graffiti', 'sidewalk'] },
};

const DEFAULT_STAFFING: TeamStaffing = {
  overnight: 6,
  morning: 10,
  afternoon: 10,
  evening: 8,
};

const TARGET_RATIO = 8; // target calls per officer

function createInitialStaffing(): StaffingData {
  const data: StaffingData = {};
  DISTRICTS.forEach(district => {
    data[district] = {
      police: { ...DEFAULT_STAFFING },
      streetTeam: { overnight: 1, morning: 3, afternoon: 3, evening: 2 },
      ambassadors: { overnight: 0, morning: 4, afternoon: 4, evening: 2 },
      dpw: { overnight: 0, morning: 2, afternoon: 2, evening: 0 },
    };
  });
  return data;
}

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'overnight';
}

function getCallsByDistrictAndTime(incidents: Incident[]): Record<string, Record<TimePeriod, { total: number; divertible: Record<TeamType, number> }>> {
  const result: Record<string, Record<TimePeriod, { total: number; divertible: Record<TeamType, number> }>> = {};

  DISTRICTS.forEach(d => {
    result[d] = {
      overnight: { total: 0, divertible: { police: 0, streetTeam: 0, ambassadors: 0, dpw: 0 } },
      morning: { total: 0, divertible: { police: 0, streetTeam: 0, ambassadors: 0, dpw: 0 } },
      afternoon: { total: 0, divertible: { police: 0, streetTeam: 0, ambassadors: 0, dpw: 0 } },
      evening: { total: 0, divertible: { police: 0, streetTeam: 0, ambassadors: 0, dpw: 0 } },
    };
  });

  incidents.forEach(incident => {
    const hour = incident.timestamp?.getHours();
    if (hour === undefined) return;

    const period = getTimePeriod(hour);
    const district = DISTRICTS.find(d =>
      incident.district?.toLowerCase().includes(d.toLowerCase())
    );

    if (!district) return;

    result[district][period].total++;

    const text = `${incident.category || ''} ${incident.description || ''}`.toLowerCase();
    (Object.keys(TEAM_CONFIG) as TeamType[]).forEach(team => {
      if (TEAM_CONFIG[team].canDivert.some(keyword => text.includes(keyword))) {
        result[district][period].divertible[team]++;
      }
    });
  });

  return result;
}

interface GapInfo {
  district: string;
  period: TimePeriod;
  calls: number;
  officers: number;
  ratio: number;
  gap: number;
  severity: 'critical' | 'warning' | 'ok';
}

export function StaffingSimulator({ incidents }: StaffingSimulatorProps) {
  const [staffing, setStaffing] = useState<StaffingData>(createInitialStaffing);
  const [targetRatio, setTargetRatio] = useState(TARGET_RATIO);
  const [activeTeam, setActiveTeam] = useState<TeamType>('police');
  const [showDivertible, setShowDivertible] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const callData = useMemo(() => getCallsByDistrictAndTime(incidents), [incidents]);

  const gaps = useMemo((): GapInfo[] => {
    const result: GapInfo[] = [];

    DISTRICTS.forEach(district => {
      TIME_PERIODS.forEach(({ key: period }) => {
        const calls = callData[district][period].total;
        const officers = staffing[district].police[period];
        const ratio = officers > 0 ? calls / officers : calls;
        const gap = ratio - targetRatio;

        let severity: 'critical' | 'warning' | 'ok' = 'ok';
        if (gap > targetRatio * 0.5) severity = 'critical';
        else if (gap > 0) severity = 'warning';

        result.push({ district, period, calls, officers, ratio, gap, severity });
      });
    });

    return result.sort((a, b) => b.gap - a.gap);
  }, [callData, staffing, targetRatio]);

  const criticalGaps = gaps.filter(g => g.severity === 'critical');
  const warningGaps = gaps.filter(g => g.severity === 'warning');

  const totals = useMemo(() => {
    const result: Record<TeamType, Record<TimePeriod, number>> = {
      police: { overnight: 0, morning: 0, afternoon: 0, evening: 0 },
      streetTeam: { overnight: 0, morning: 0, afternoon: 0, evening: 0 },
      ambassadors: { overnight: 0, morning: 0, afternoon: 0, evening: 0 },
      dpw: { overnight: 0, morning: 0, afternoon: 0, evening: 0 },
    };

    DISTRICTS.forEach(district => {
      (Object.keys(result) as TeamType[]).forEach(team => {
        TIME_PERIODS.forEach(({ key: period }) => {
          result[team][period] += staffing[district][team][period];
        });
      });
    });

    return result;
  }, [staffing]);

  const divertibleTotals = useMemo(() => {
    const result: Record<TeamType, number> = { police: 0, streetTeam: 0, ambassadors: 0, dpw: 0 };

    DISTRICTS.forEach(district => {
      TIME_PERIODS.forEach(({ key: period }) => {
        (Object.keys(result) as TeamType[]).forEach(team => {
          result[team] += callData[district][period].divertible[team];
        });
      });
    });

    return result;
  }, [callData]);

  const updateStaffing = (district: string, team: TeamType, period: TimePeriod, value: number) => {
    setStaffing(prev => ({
      ...prev,
      [district]: {
        ...prev[district],
        [team]: {
          ...prev[district][team],
          [period]: Math.max(0, value),
        },
      },
    }));
  };

  const getCellClass = (district: string, period: TimePeriod): string => {
    const gap = gaps.find(g => g.district === district && g.period === period);
    if (!gap) return '';
    return `severity-${gap.severity}`;
  };

  return (
    <div className="staffing-simulator">
      <header className="section-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <h2>Staffing Planner</h2>
          <p className="section-subtitle">
            Model staffing scenarios. Identify where and when you need more support.
          </p>
        </div>
        <button className="expand-toggle">{expanded ? '−' : '+'}</button>
      </header>

      {expanded && (
        <>
          {/* Gap Summary */}
          <div className="gap-summary">
            <div className="gap-header">
              <h3>Coverage Gaps</h3>
              <div className="target-control">
                <label>
                  Target ratio:
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={targetRatio}
                    onChange={(e) => setTargetRatio(Math.max(1, parseInt(e.target.value) || 8))}
                  />
                  calls/officer
                </label>
              </div>
            </div>

            {criticalGaps.length === 0 && warningGaps.length === 0 ? (
              <div className="gap-ok">
                All districts within target ratio. Staffing looks adequate.
              </div>
            ) : (
              <div className="gap-alerts">
                {criticalGaps.length > 0 && (
                  <div className="gap-alert critical">
                    <strong>{criticalGaps.length} critical</strong>
                    <span className="gap-list">
                      {criticalGaps.slice(0, 5).map(g => (
                        <span key={`${g.district}-${g.period}`} className="gap-tag">
                          {g.district} {TIME_PERIODS.find(t => t.key === g.period)?.short} ({g.ratio.toFixed(1)})
                        </span>
                      ))}
                      {criticalGaps.length > 5 && <span className="gap-more">+{criticalGaps.length - 5} more</span>}
                    </span>
                  </div>
                )}
                {warningGaps.length > 0 && (
                  <div className="gap-alert warning">
                    <strong>{warningGaps.length} over target</strong>
                    <span className="gap-list">
                      {warningGaps.slice(0, 4).map(g => (
                        <span key={`${g.district}-${g.period}`} className="gap-tag">
                          {g.district} {TIME_PERIODS.find(t => t.key === g.period)?.short}
                        </span>
                      ))}
                      {warningGaps.length > 4 && <span className="gap-more">+{warningGaps.length - 4} more</span>}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Diversion Opportunity */}
          {showDivertible && (
            <div className="diversion-summary">
              <h3>Diversion Opportunity</h3>
              <p className="diversion-note">Calls that could be handled by alternative responders:</p>
              <div className="diversion-stats">
                {(Object.keys(TEAM_CONFIG) as TeamType[]).filter(t => t !== 'police').map(team => (
                  <div key={team} className="diversion-stat">
                    <span className="diversion-label" style={{ color: TEAM_CONFIG[team].color }}>
                      {TEAM_CONFIG[team].label}
                    </span>
                    <span className="diversion-value">{divertibleTotals[team].toLocaleString()}</span>
                    <span className="diversion-keywords">
                      {TEAM_CONFIG[team].canDivert.slice(0, 3).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Totals */}
          <div className="team-totals">
            <div className="team-selector">
              {(Object.keys(TEAM_CONFIG) as TeamType[]).map(team => (
                <button
                  key={team}
                  className={activeTeam === team ? 'active' : ''}
                  onClick={() => setActiveTeam(team)}
                  style={activeTeam === team ? { borderColor: TEAM_CONFIG[team].color, color: TEAM_CONFIG[team].color } : {}}
                >
                  {TEAM_CONFIG[team].label}
                </button>
              ))}
            </div>
            <div className="period-totals">
              {TIME_PERIODS.map(({ key, short }) => (
                <div key={key} className="period-total">
                  <span className="period-label">{short}</span>
                  <span className="period-value">{totals[activeTeam][key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Staffing Matrix */}
          <div className="staffing-matrix">
            <div className="matrix-header">
              <div className="col-district">District</div>
              {TIME_PERIODS.map(({ key, short }) => (
                <div key={key} className="col-period">
                  <span className="period-name">{short}</span>
                </div>
              ))}
            </div>

            {DISTRICTS.map(district => (
              <div key={district} className="matrix-row">
                <div className="col-district">{district}</div>
                {TIME_PERIODS.map(({ key: period }) => {
                  const calls = callData[district][period].total;
                  const staff = staffing[district][activeTeam][period];
                  const ratio = staff > 0 ? (calls / staff).toFixed(1) : '—';

                  return (
                    <div key={period} className={`col-period ${activeTeam === 'police' ? getCellClass(district, period) : ''}`}>
                      <div className="cell-staff">
                        <button onClick={() => updateStaffing(district, activeTeam, period, staff - 1)}>−</button>
                        <input
                          type="number"
                          min="0"
                          value={staff}
                          onChange={(e) => updateStaffing(district, activeTeam, period, parseInt(e.target.value) || 0)}
                        />
                        <button onClick={() => updateStaffing(district, activeTeam, period, staff + 1)}>+</button>
                      </div>
                      {activeTeam === 'police' && (
                        <div className="cell-meta">
                          <span className="calls">{calls}</span>
                          <span className="ratio">{ratio}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <footer className="section-footer">
            <p>
              <strong>How to use:</strong> Adjust staff counts per district and time period.
              Red cells = critical gaps (ratio {'>'} {Math.round(targetRatio * 1.5)}).
              Yellow = over target ({targetRatio}).
              Use alternative responders to reduce police call load for divertible calls.
            </p>
            <label className="footer-toggle">
              <input
                type="checkbox"
                checked={showDivertible}
                onChange={(e) => setShowDivertible(e.target.checked)}
              />
              Show diversion opportunities
            </label>
          </footer>
        </>
      )}
    </div>
  );
}
