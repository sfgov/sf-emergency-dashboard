import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ResponderStats } from '../types/incidents';

interface ResponderChartProps {
  stats: ResponderStats[];
}

const RESPONDER_COLORS: Record<string, string> = {
  'PD': '#2563eb',
  'Fire': '#ff9f0a',
  'EMS': '#ff3b30',
  'Other': '#737373',
};

export function ResponderChart({ stats }: ResponderChartProps) {
  if (!stats || stats.length === 0) {
    return <div className="responder-chart"><h3>Responders</h3><p className="chart-subtitle">No data</p></div>;
  }

  return (
    <div className="responder-chart">
      <h3>Responders</h3>
      <p className="chart-subtitle">By unit type</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={stats} layout="horizontal" margin={{ left: 0, right: 20 }}>
          <XAxis type="category" dataKey="responder" tick={{ fontSize: 10, fill: '#737373' }} axisLine={{ stroke: '#262626' }} tickLine={false} />
          <YAxis type="number" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
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
