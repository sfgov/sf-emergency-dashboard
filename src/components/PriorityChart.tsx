import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PriorityStats } from '../types/incidents';

interface PriorityChartProps {
  stats: PriorityStats[];
}

const PRIORITY_COLORS: Record<string, string> = {
  'E (Emergency)': '#ff3b30',
  'A (Critical)': '#ff3b30',
  'B (Urgent)': '#ff9f0a',
  'C (Non-urgent)': '#30d158',
};

export function PriorityChart({ stats }: PriorityChartProps) {
  const total = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="priority-chart">
      <h3>Priority</h3>
      <p className="chart-subtitle">By urgency level</p>
      <div className="priority-content">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie
              data={stats}
              dataKey="count"
              nameKey="priority"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
            >
              {stats.map((entry) => (
                <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || '#64748b'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="priority-legend">
          {stats.map(s => (
            <div key={s.priority} className="priority-item">
              <div className="priority-row">
                <span className="priority-dot" style={{ background: PRIORITY_COLORS[s.priority] }} />
                <span className="priority-label">{s.priority}</span>
              </div>
              <div className="priority-stats">
                <span className="priority-count">{s.count}</span>
                <span className="priority-pct">({Math.round((s.count / total) * 100)}%)</span>
                {s.avgResponseTime > 0 && (
                  <span className="priority-response">~{s.avgResponseTime}min</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
