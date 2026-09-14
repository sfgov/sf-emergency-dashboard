import type { IncidentFilter } from '../types/incidents';

interface FilterPanelProps {
  filter: IncidentFilter;
  onFilterChange: (filter: IncidentFilter) => void;
  districts: string[];
}

export function FilterPanel({ filter, onFilterChange, districts }: FilterPanelProps) {
  const toggleType = (type: 'police' | 'fire' | '311' | 'cad') => {
    const types = filter.types.includes(type)
      ? filter.types.filter(t => t !== type)
      : [...filter.types, type];
    onFilterChange({ ...filter, types });
  };

  const toggleDistrict = (district: string) => {
    const newDistricts = filter.districts.includes(district)
      ? filter.districts.filter(d => d !== district)
      : [...filter.districts, district];
    onFilterChange({ ...filter, districts: newDistricts });
  };

  return (
    <div className="filter-panel">
      <h3>Filters</h3>

      <div className="filter-section">
        <h4>Time Range</h4>
        <div className="filter-buttons">
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              className={filter.timeRange === range ? 'active' : ''}
              onClick={() => onFilterChange({ ...filter, timeRange: range })}
            >
              {range === 'today' ? '24H' : range === 'week' ? '7D' : '30D'}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Incident Type</h4>
        <div className="filter-checkboxes">
          <label className="filter-checkbox police">
            <input
              type="checkbox"
              checked={filter.types.length === 0 || filter.types.includes('police')}
              onChange={() => toggleType('police')}
            />
            <span className="checkbox-label">Police</span>
          </label>
          <label className="filter-checkbox fire">
            <input
              type="checkbox"
              checked={filter.types.length === 0 || filter.types.includes('fire')}
              onChange={() => toggleType('fire')}
            />
            <span className="checkbox-label">Fire</span>
          </label>
          <label className="filter-checkbox calls311">
            <input
              type="checkbox"
              checked={filter.types.length === 0 || filter.types.includes('311')}
              onChange={() => toggleType('311')}
            />
            <span className="checkbox-label">311</span>
          </label>
          <label className="filter-checkbox cad">
            <input
              type="checkbox"
              checked={filter.types.length === 0 || filter.types.includes('cad')}
              onChange={() => toggleType('cad')}
            />
            <span className="checkbox-label">CAD (Live)</span>
          </label>
        </div>
      </div>

      {districts.length > 0 && (
        <div className="filter-section">
          <h4>Districts</h4>
          <div className="district-list">
            {districts.slice(0, 10).map(district => (
              <label key={district} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filter.districts.length === 0 || filter.districts.includes(district)}
                  onChange={() => toggleDistrict(district)}
                />
                <span className="checkbox-label">{district}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
