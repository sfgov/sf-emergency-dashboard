import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { StationStats } from '../types/incidents';

interface StationChartProps {
  stats: StationStats[];
}

const COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7'];

export function StationChart({ stats }: StationChartProps) {
  const chartData = stats.slice(0, 15).map(s => ({
    name: s.station,
    Medical: s.medicalCalls,
    Fire: s.fireCalls,
    CAD: s.cadCalls,
    Other: s.otherCalls,
    total: s.totalCalls,
  }));

  return (
    <div className="station-chart">
      <h3>Calls by Station</h3>
      <p className="chart-subtitle">Fire & EMS stations ranked by call volume</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            labelFormatter={(label) => label}
          />
          <Legend />
          <Bar dataKey="Medical" stackId="a" fill="#ef4444" name="Medical" />
          <Bar dataKey="Fire" stackId="a" fill="#f97316" name="Fire" />
          <Bar dataKey="Other" stackId="a" fill="#3b82f6" name="Other" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
