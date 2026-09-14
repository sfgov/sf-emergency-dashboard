import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HourlyStats } from '../types/incidents';

interface HourlyChartProps {
  stats: HourlyStats[];
}

export function HourlyChart({ stats }: HourlyChartProps) {
  if (!stats || stats.length === 0) {
    return <div className="hourly-chart"><h3>Hourly</h3><p className="chart-subtitle">No data</p></div>;
  }

  const peakHour = stats.reduce((max, s) => s.total > max.total ? s : max, stats[0]);

  return (
    <div className="hourly-chart">
      <h3>Hourly</h3>
      <p className="chart-subtitle">
        Peak at {peakHour?.label} ({peakHour?.total})
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={stats} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fafafa" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="#fafafa" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff3b30" stopOpacity={0.6}/>
              <stop offset="100%" stopColor="#ff3b30" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#737373' }}
            interval={3}
            axisLine={{ stroke: '#262626' }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 9, fill: '#737373' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #262626',
              borderRadius: 0,
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#fafafa"
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#colorTotal)"
          />
          <Area
            type="monotone"
            dataKey="priorityA"
            stroke="#ff3b30"
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#colorA)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
