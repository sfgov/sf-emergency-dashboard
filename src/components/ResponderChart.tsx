import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ResponderStats } from '../types/incidents';

interface ResponderChartProps {
  stats: ResponderStats[];
}

const RESPONDER_COLORS: Record<string, string> = {
  'PD': '#3b82f6',
  'Fire': '#f97316',
  'EMS': '#ef4444',
  'Other': '#64748b',
};

export function ResponderChart({ stats }: ResponderChartProps) {
  return (
    <div className="responder-chart">
      <h3>Who's Responding?</h3>
      <p className="chart-subtitle">Calls by response unit type</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={stats} layout="horizontal" margin={{ left: 0, right: 20 }}>
          <XAxis type="category" dataKey="responder" tick={{ fontSize: 12 }} />
          <YAxis type="number" tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name="Calls">
            {stats.map((entry) => (
              <Cell key={entry.responder} fill={RESPONDER_COLORS[entry.responder] || '#64748b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="responder-response-times">
        {stats.filter(s => s.avgResponseTime > 0).map(s => (
          <div key={s.responder} className="response-time-item">
            <span style={{ color: RESPONDER_COLORS[s.responder] }}>{s.responder}</span>
            <span className="response-time-value">avg {s.avgResponseTime} min</span>
          </div>
        ))}
      </div>
    </div>
  );
}
