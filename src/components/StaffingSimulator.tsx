import { useState, useMemo } from 'react';
import type { Incident } from '../types/incidents';

interface StaffingSimulatorProps {
  incidents: Incident[];
}

type Shift = 'day' | 'night';

interface TeamStaffing {
  day: number;
  night: number;
}

interface DistrictStaffing {
  police: TeamStaffing;
  streetTeam: TeamStaffing;
  ambassadors: TeamStaffing;
  dpw: TeamStaffing;
}

type StaffingData = Record<string, DistrictStaffing>;

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

const TEAM_LABELS: Record<string, string> = {
  police: 'Police Officers',
  streetTeam: 'Street Teams',
  ambassadors: 'Ambassadors',
  dpw: 'DPW Crews',
};

const TEAM_COLORS: Record<string, string> = {
  police: 'var(--accent)',
  streetTeam: '#8b5cf6',
  ambassadors: '#06b6d4',
  dpw: '#f59e0b',
};

const DEFAULT_STAFFING: DistrictStaffing = {
  police: { day: 12, night: 8 },
  streetTeam: { day: 2, night: 1 },
  ambassadors: { day: 4, night: 0 },
  dpw: { day: 2, night: 0 },
};

function createInitialStaffing(): StaffingData {
  const data: StaffingData = {};
  DISTRICTS.forEach(district => {
    data[district] = JSON.parse(JSON.stringify(DEFAULT_STAFFING));
  });
  return data;
}

function getCallsByDistrict(incidents: Incident[], shift: Shift): Record<string, number> {
  const counts: Record<string, number> = {};
  DISTRICTS.forEach(d => counts[d] = 0);

  incidents.forEach(incident => {
    const hour = incident.timestamp?.getHours();
    if (hour === undefined) return;

    const isDay = hour >= 6 && hour < 18;
    if ((shift === 'day' && !isDay) || (shift === 'night' && isDay)) return;

    const district = DISTRICTS.find(d =>
      incident.district?.toLowerCase().includes(d.toLowerCase())
    );
    if (district) {
      counts[district]++;
    }
  });

  return counts;
}

export function StaffingSimulator({ incidents }: StaffingSimulatorProps) {
  const [staffing, setStaffing] = useState<StaffingData>(createInitialStaffing);
  const [activeShift, setActiveShift] = useState<Shift>('day');
  const [activeTeam, setActiveTeam] = useState<keyof DistrictStaffing>('police');
  const [expanded, setExpanded] = useState(true);

  const callsByDistrict = useMemo(() => ({
    day: getCallsByDistrict(incidents, 'day'),
    night: getCallsByDistrict(incidents, 'night'),
  }), [incidents]);

  const totals = useMemo(() => {
    const result: Record<string, { day: number; night: number }> = {
      police: { day: 0, night: 0 },
      streetTeam: { day: 0, night: 0 },
      ambassadors: { day: 0, night: 0 },
      dpw: { day: 0, night: 0 },
    };

    DISTRICTS.forEach(district => {
      const ds = staffing[district];
      (Object.keys(result) as (keyof DistrictStaffing)[]).forEach(team => {
        result[team].day += ds[team].day;
        result[team].night += ds[team].night;
      });
    });

    return result;
  }, [staffing]);

  const updateStaffing = (
    district: string,
    team: keyof DistrictStaffing,
    shift: Shift,
    value: number
  ) => {
    setStaffing(prev => ({
      ...prev,
      [district]: {
        ...prev[district],
        [team]: {
          ...prev[district][team],
          [shift]: Math.max(0, value),
        },
      },
    }));
  };

  const applyPreset = (preset: 'reset' | 'equal' | 'call-weighted') => {
    if (preset === 'reset') {
      setStaffing(createInitialStaffing());
      return;
    }

    const totalCalls = {
      day: Object.values(callsByDistrict.day).reduce((a, b) => a + b, 0),
      night: Object.values(callsByDistrict.night).reduce((a, b) => a + b, 0),
    };

    const newStaffing = createInitialStaffing();

    if (preset === 'equal') {
      const perDistrict = {
        police: { day: Math.round(totals.police.day / 10), night: Math.round(totals.police.night / 10) },
        streetTeam: { day: Math.round(totals.streetTeam.day / 10), night: Math.round(totals.streetTeam.night / 10) },
        ambassadors: { day: Math.round(totals.ambassadors.day / 10), night: Math.round(totals.ambassadors.night / 10) },
        dpw: { day: Math.round(totals.dpw.day / 10), night: Math.round(totals.dpw.night / 10) },
      };
      DISTRICTS.forEach(district => {
        newStaffing[district] = JSON.parse(JSON.stringify(perDistrict));
      });
    } else if (preset === 'call-weighted') {
      DISTRICTS.forEach(district => {
        const dayRatio = totalCalls.day > 0 ? callsByDistrict.day[district] / totalCalls.day : 0.1;
        const nightRatio = totalCalls.night > 0 ? callsByDistrict.night[district] / totalCalls.night : 0.1;

        newStaffing[district] = {
          police: {
            day: Math.max(4, Math.round(totals.police.day * dayRatio)),
            night: Math.max(2, Math.round(totals.police.night * nightRatio)),
          },
          streetTeam: {
            day: Math.max(0, Math.round(totals.streetTeam.day * dayRatio)),
            night: Math.max(0, Math.round(totals.streetTeam.night * nightRatio)),
          },
          ambassadors: {
            day: Math.max(0, Math.round(totals.ambassadors.day * dayRatio)),
            night: 0,
          },
          dpw: {
            day: Math.max(0, Math.round(totals.dpw.day * dayRatio)),
            night: 0,
          },
        };
      });
    }

    setStaffing(newStaffing);
  };

  const getWorkloadIndex = (district: string, shift: Shift): number => {
    const calls = callsByDistrict[shift][district] || 0;
    const officers = staffing[district].police[shift] || 1;
    return calls / officers;
  };

  const cityAvgWorkload = useMemo(() => {
    const totalCalls = Object.values(callsByDistrict[activeShift]).reduce((a, b) => a + b, 0);
    const totalOfficers = DISTRICTS.reduce((sum, d) => sum + staffing[d].police[activeShift], 0);
    return totalOfficers > 0 ? totalCalls / totalOfficers : 0;
  }, [callsByDistrict, staffing, activeShift]);

  return (
    <div className="staffing-simulator">
      <header className="section-header" onClick={() => setExpanded(!expanded)}>
        <div>
          <h2>Staffing Simulator</h2>
          <p className="section-subtitle">
            Model deployment scenarios across police, street teams, ambassadors, and DPW.
            {!expanded && ` ${totals.police.day} officers day / ${totals.police.night} night.`}
          </p>
        </div>
        <button className="expand-toggle">{expanded ? '−' : '+'}</button>
      </header>

      {expanded && (
        <>
          <div className="simulator-controls">
            <div className="control-group">
              <span className="control-label">Shift</span>
              <div className="toggle-group">
                <button
                  className={activeShift === 'day' ? 'active' : ''}
                  onClick={() => setActiveShift('day')}
                >
                  Day (6a-6p)
                </button>
                <button
                  className={activeShift === 'night' ? 'active' : ''}
                  onClick={() => setActiveShift('night')}
                >
                  Night (6p-6a)
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Team</span>
              <div className="toggle-group">
                {(Object.keys(TEAM_LABELS) as (keyof DistrictStaffing)[]).map(team => (
                  <button
                    key={team}
                    className={activeTeam === team ? 'active' : ''}
                    onClick={() => setActiveTeam(team)}
                    style={activeTeam === team ? { borderColor: TEAM_COLORS[team], color: TEAM_COLORS[team] } : {}}
                  >
                    {TEAM_LABELS[team]}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Presets</span>
              <div className="toggle-group">
                <button onClick={() => applyPreset('reset')}>Reset</button>
                <button onClick={() => applyPreset('equal')}>Equal</button>
                <button onClick={() => applyPreset('call-weighted')}>Call-weighted</button>
              </div>
            </div>
          </div>

          <div className="totals-bar">
            {(Object.keys(TEAM_LABELS) as (keyof DistrictStaffing)[]).map(team => (
              <div key={team} className="total-item">
                <span className="total-label" style={{ color: TEAM_COLORS[team] }}>
                  {TEAM_LABELS[team]}
                </span>
                <span className="total-value">
                  {totals[team][activeShift]}
                </span>
              </div>
            ))}
          </div>

          <div className="staffing-grid">
            <div className="grid-header">
              <div className="col-district">District</div>
              <div className="col-staff">Staff</div>
              <div className="col-calls">Calls</div>
              <div className="col-workload">Calls/Officer</div>
              <div className="col-deviation">vs. Avg</div>
            </div>

            {DISTRICTS.map(district => {
              const workload = getWorkloadIndex(district, activeShift);
              const deviation = cityAvgWorkload > 0 ? ((workload - cityAvgWorkload) / cityAvgWorkload) * 100 : 0;
              const deviationStr = Math.abs(deviation) < 1 ? '0%' :
                (deviation > 0 ? `+${Math.round(deviation)}%` : `${Math.round(deviation)}%`);

              return (
                <div key={district} className="grid-row">
                  <div className="col-district">{district}</div>
                  <div className="col-staff">
                    <button
                      className="adj-btn"
                      onClick={() => updateStaffing(district, activeTeam, activeShift, staffing[district][activeTeam][activeShift] - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={staffing[district][activeTeam][activeShift]}
                      onChange={(e) => updateStaffing(district, activeTeam, activeShift, parseInt(e.target.value) || 0)}
                    />
                    <button
                      className="adj-btn"
                      onClick={() => updateStaffing(district, activeTeam, activeShift, staffing[district][activeTeam][activeShift] + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="col-calls">{callsByDistrict[activeShift][district]?.toLocaleString() || 0}</div>
                  <div className="col-workload">{workload.toFixed(1)}</div>
                  <div className={`col-deviation ${deviation > 10 ? 'high' : deviation < -10 ? 'low' : ''}`}>
                    {deviationStr}
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="section-footer">
            <p>
              <strong>Note:</strong> DMACC station excluded (does not respond to calls for service).
              Workload = calls ÷ officers. Adjust staffing to see impact on per-officer call volume.
              Street teams, ambassadors, and DPW handle specific call types and reduce police workload.
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
