import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AttendanceDonutChart({ data = [] }) {
  // Use real data if provided
  const chartData = data && data.length > 0 ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Attendance Summary</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <p>No attendance data available yet</p>
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center">
          Class-wide attendance rate across all sessions
        </p>
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444'];
  
  // Calculate percentages from real data
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const presentData = chartData.find(item => item.name === 'Present');
  const absentData = chartData.find(item => item.name === 'Absent');
  const presentValue = presentData?.value || 0;
  const absentValue = absentData?.value || 0;
  const presentPercentage = total > 0 ? Math.round((presentValue / total) * 100) : 0;
  const absentPercentage = total > 0 ? Math.round((absentValue / total) * 100) : 0;

  const renderCustomLabel = (entry) => {
    const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
    return `${percentage}%`;
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
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value) => {
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${value} (${percentage}%)`;
            }}
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
          <p className="text-3xl font-bold text-green-600">{presentPercentage}%</p>
          <p className="text-xs text-gray-500 mt-1">{presentValue} students</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-3xl font-bold text-red-600">{absentPercentage}%</p>
          <p className="text-xs text-gray-500 mt-1">{absentValue} students</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4 text-center">
        Class-wide attendance across all sessions (Total: {total})
      </p>
    </div>
  );
}
