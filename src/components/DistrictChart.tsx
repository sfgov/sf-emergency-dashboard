import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DistrictStats } from '../types/incidents';

interface DistrictChartProps {
  stats: DistrictStats[];
}

export function DistrictChart({ stats }: DistrictChartProps) {
  const chartData = stats.slice(0, 10).map(s => ({
    name: s.district.length > 12 ? s.district.slice(0, 12) + '...' : s.district,
    Police: s.policeIncidents,
    Fire: s.fireCalls,
    '311': s.calls311,
    CAD: s.cadCalls,
  }));

  return (
    <div className="district-chart">
      <h3>Incidents by District</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Police" stackId="a" fill="#ef4444" />
          <Bar dataKey="Fire" stackId="a" fill="#f97316" />
          <Bar dataKey="311" stackId="a" fill="#3b82f6" />
          <Bar dataKey="CAD" stackId="a" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
