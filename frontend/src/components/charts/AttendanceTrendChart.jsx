import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AttendanceTrendChart({ data = [] }) {
  // Default mock data
  const chartData = data.length > 0 ? data : [
    { date: '2026-04-01', attendance: 92, students: 45 },
    { date: '2026-04-02', attendance: 88, students: 43 },
    { date: '2026-04-03', attendance: 95, students: 47 },
    { date: '2026-04-04', attendance: 85, students: 42 },
    { date: '2026-04-05', attendance: 91, students: 45 },
    { date: '2026-04-08', attendance: 89, students: 44 },
    { date: '2026-04-09', attendance: 94, students: 47 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value) => [`${value}%`, '']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: '14px', marginTop: '1rem' }} />
          <Line 
            type="monotone" 
            dataKey="attendance" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Attendance %"
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 mt-4 text-center">
        Track class attendance percentage over multiple sessions
      </p>
    </div>
  );
}
