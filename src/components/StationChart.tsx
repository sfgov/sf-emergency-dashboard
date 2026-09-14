import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { StationStats } from '../types/incidents';

interface StationChartProps {
  stats: StationStats[];
}

export function StationChart({ stats }: StationChartProps) {
  if (!stats || stats.length === 0) {
    return <div className="station-chart"><h3>Stations</h3><p className="chart-subtitle">No data</p></div>;
  }

  const chartData = stats.slice(0, 12).map(s => ({
    name: s.station,
    Medical: s.medicalCalls,
    Fire: s.fireCalls,
    Other: s.otherCalls,
    total: s.totalCalls,
  }));

  return (
    <div className="station-chart">
      <h3>Stations</h3>
      <p className="chart-subtitle">By call volume</p>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: '#737373' }}
            axisLine={{ stroke: '#262626' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={72}
            tick={{ fontSize: 10, fill: '#737373' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #262626',
              borderRadius: 0,
              fontSize: 11,
            }}
          />
          <Bar dataKey="Medical" stackId="a" fill="#ff3b30" name="Medical" />
          <Bar dataKey="Fire" stackId="a" fill="#ff9f0a" name="Fire" />
          <Bar dataKey="Other" stackId="a" fill="#fafafa" name="Other" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
