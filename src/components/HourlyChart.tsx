import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HourlyStats } from '../types/incidents';

interface HourlyChartProps {
  stats: HourlyStats[];
}

export function HourlyChart({ stats }: HourlyChartProps) {
  const peakHour = stats.reduce((max, s) => s.total > max.total ? s : max, stats[0]);
  const quietHour = stats.reduce((min, s) => s.total < min.total ? s : min, stats[0]);

  return (
    <div className="hourly-chart">
      <h3>Time of Day Trends</h3>
      <p className="chart-subtitle">
        Peak: {peakHour?.label} ({peakHour?.total} calls) | Quietest: {quietHour?.label} ({quietHour?.total} calls)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={stats} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval={2}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorTotal)"
          />
          <Area
            type="monotone"
            dataKey="priorityA"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorA)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
