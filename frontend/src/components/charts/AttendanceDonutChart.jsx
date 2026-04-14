import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AttendanceDonutChart({ data = [] }) {
  // Default mock data - overall attendance percentage
  const chartData = data.length > 0 ? data : [
    { name: 'Present', value: 87, percentage: '87%' },
    { name: 'Absent', value: 13, percentage: '13%' },
  ];

  const COLORS = ['#10b981', '#ef4444'];

  const renderCustomLabel = (entry) => {
    return `${entry.percentage}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Attendance Summary</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value) => `${value}%`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '14px', paddingTop: '1rem' }}
            verticalAlign="bottom"
            height={36}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Present</p>
          <p className="text-3xl font-bold text-green-600">87%</p>
          <p className="text-xs text-gray-500 mt-1">~287 out of 330</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-3xl font-bold text-red-600">13%</p>
          <p className="text-xs text-gray-500 mt-1">~43 out of 330</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4 text-center">
        Class-wide attendance rate across all sessions
      </p>
    </div>
  );
}
