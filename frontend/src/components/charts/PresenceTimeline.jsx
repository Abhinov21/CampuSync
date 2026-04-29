import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function PresenceTimeline({ data = [] }) {
  const chartData = data && data.length > 0 ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Presence Timeline Heatmap</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <p>No timeline data available</p>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600">Absent</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-4 text-center">
          Visual timeline of student presence across session time periods (requires detailed session logs)
        </p>
      </div>
    );
  }

  // Extract unique students and time periods from data
  const uniqueStudents = [...new Set(chartData.map(d => d.student))].sort((a, b) => a - b);
  const uniqueTimes = [...new Set(chartData.map(d => d.time))].sort((a, b) => a - b);
  const timeSlots = uniqueTimes.map((t, i) => `Period ${i + 1}`);

  const getColor = (status) => {
    return status === 1 ? '#10b981' : '#ef4444'; // Green for present, red for absent
  };

  // Create mapping of student indices to labels
  const studentLabels = {};
  chartData.forEach(d => {
    if (d.studentLabel && !studentLabels[d.student]) {
      studentLabels[d.student] = d.studentLabel;
    }
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Presence Timeline Heatmap</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number"
            dataKey="time" 
            name="Time Period"
            domain={[0.5, uniqueTimes.length + 0.5]}
            ticks={uniqueTimes}
            tickFormatter={(value) => timeSlots[uniqueTimes.indexOf(value)] || `T${value}`}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            type="number"
            dataKey="student" 
            name="Session"
            domain={[0.5, uniqueStudents.length + 0.5]}
            ticks={uniqueStudents}
            tickFormatter={(value) => studentLabels[value] || `Session ${value}`}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            width={100}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => {
              if (name === 'status') {
                return [value === 1 ? 'Present' : 'Absent', 'Status'];
              }
              return value;
            }}
            labelFormatter={(value) => `${value}`}
          />
          <Scatter 
            name="Present" 
            data={chartData.filter(d => d.status === 1)}
            fill="#10b981"
            shape="circle"
            isAnimationActive={false}
            r={8}
          />
          <Scatter 
            name="Absent" 
            data={chartData.filter(d => d.status === 0)}
            fill="#ef4444"
            shape="circle"
            isAnimationActive={false}
            r={8}
          />
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-gray-600">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-gray-600">Absent</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4 text-center">
        Visual timeline of class attendance across recent sessions ({uniqueStudents.length} sessions tracked)
      </p>
    </div>
  );
}
