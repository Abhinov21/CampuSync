import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DurationDistributionChart({ data = [] }) {
  // Default mock data - distribution of session durations
  const chartData = data.length > 0 ? data : [
    { duration: '0-10 min', sessions: 3, percentage: 8 },
    { duration: '10-20 min', sessions: 5, percentage: 13 },
    { duration: '20-30 min', sessions: 8, percentage: 21 },
    { duration: '30-40 min', sessions: 12, percentage: 32 },
    { duration: '40-50 min', sessions: 7, percentage: 18 },
    { duration: '50-60 min', sessions: 2, percentage: 5 },
    { duration: '60+ min', sessions: 1, percentage: 3 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Duration Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
            label={{ value: 'Number of Sessions', angle: -90, position: 'insideLeft' }}
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
            formatter={(value) => value}
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
        How long do sessions typically last? Distribution of session durations
      </p>
    </div>
  );
}
