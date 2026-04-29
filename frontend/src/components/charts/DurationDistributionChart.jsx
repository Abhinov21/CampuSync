import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DurationDistributionChart({ data = [] }) {
  const chartData = data && data.length > 0 ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Duration Distribution</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <p>No session duration data available</p>
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center">
          Distribution of session durations (data will appear after sessions complete)
        </p>
      </div>
    );
  }

  // Calculate total sessions for percentage
  const totalSessions = chartData.reduce((sum, item) => sum + (item.sessions || item.sessionCount || 0), 0);

  // Transform data to include percentages
  const dataWithPercentages = chartData.map(item => ({
    ...item,
    percentage: totalSessions > 0 ? Math.round(((item.sessions || item.sessionCount || 0) / totalSessions) * 100) : 0,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Duration Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dataWithPercentages}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="duration" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }}
            yAxisId="left"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Percentage %', angle: 90, position: 'insideRight' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value, name) => {
              if (name === 'Percentage %') {
                return [`${value}%`, name];
              }
              return [value, 'Sessions'];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '14px', marginTop: '1rem' }} />
          <Bar 
            yAxisId="left"
            dataKey="sessions" 
            fill="#8b5cf6" 
            name="Sessions"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="percentage" 
            fill="#ec4899" 
            name="Percentage %"
            radius={[8, 8, 0, 0]}
            opacity={0.7}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 mt-4 text-center">
        How long do sessions typically last? Distribution of session durations (Total: {totalSessions} sessions)
      </p>
    </div>
  );
}
