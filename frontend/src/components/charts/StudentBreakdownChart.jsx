import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StudentBreakdownChart({ data = [] }) {
  // Default mock data - top students by attendance count
  const chartData = data.length > 0 ? data : [
    { student: 'Raj Kumar', sessions: 12, present: 11, absent: 1 },
    { student: 'Priya Singh', sessions: 12, present: 12, absent: 0 },
    { student: 'Amit Patel', sessions: 12, present: 9, absent: 3 },
    { student: 'Neha Sharma', sessions: 12, present: 10, absent: 2 },
    { student: 'Rohit Gupta', sessions: 12, present: 8, absent: 4 },
    { student: 'Anjali Verma', sessions: 12, present: 11, absent: 1 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Attendance Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="student" 
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
            dataKey="present" 
            fill="#10b981" 
            name="Present"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="absent" 
            fill="#ef4444" 
            name="Absent"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 mt-4 text-center">
        Individual student attendance across all sessions
      </p>
    </div>
  );
}
