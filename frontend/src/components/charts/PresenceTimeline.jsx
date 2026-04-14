import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function PresenceTimeline({ data = [] }) {
  // Default mock data - students x time slots
  const chartData = data.length > 0 ? data : [
    { time: 1, student: 'Raj Kumar', status: 1, studentName: 'Raj Kumar' },
    { time: 2, student: 'Raj Kumar', status: 1, studentName: 'Raj Kumar' },
    { time: 3, student: 'Raj Kumar', status: 1, studentName: 'Raj Kumar' },
    { time: 1, student: 'Priya Singh', status: 1, studentName: 'Priya Singh' },
    { time: 2, student: 'Priya Singh', status: 1, studentName: 'Priya Singh' },
    { time: 3, student: 'Priya Singh', status: 1, studentName: 'Priya Singh' },
    { time: 1, student: 'Amit Patel', status: 0, studentName: 'Amit Patel' },
    { time: 2, student: 'Amit Patel', status: 1, studentName: 'Amit Patel' },
    { time: 3, student: 'Amit Patel', status: 1, studentName: 'Amit Patel' },
    { time: 1, student: 'Neha Sharma', status: 1, studentName: 'Neha Sharma' },
    { time: 2, student: 'Neha Sharma', status: 1, studentName: 'Neha Sharma' },
    { time: 3, student: 'Neha Sharma', status: 1, studentName: 'Neha Sharma' },
    { time: 1, student: 'Rohit Gupta', status: 0, studentName: 'Rohit Gupta' },
    { time: 2, student: 'Rohit Gupta', status: 0, studentName: 'Rohit Gupta' },
    { time: 3, student: 'Rohit Gupta', status: 1, studentName: 'Rohit Gupta' },
    { time: 1, student: 'Anjali Verma', status: 1, studentName: 'Anjali Verma' },
    { time: 2, student: 'Anjali Verma', status: 1, studentName: 'Anjali Verma' },
    { time: 3, student: 'Anjali Verma', status: 1, studentName: 'Anjali Verma' },
  ];

  const getColor = (status) => {
    return status === 1 ? '#10b981' : '#ef4444'; // Green for present, red for absent
  };

  const studentList = ['Raj Kumar', 'Priya Singh', 'Amit Patel', 'Neha Sharma', 'Rohit Gupta', 'Anjali Verma'];
  const timeSlots = ['0:00-10:00', '10:00-20:00', '20:00-30:00'];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Presence Timeline Heatmap</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number"
            dataKey="time" 
            name="Time Slot"
            domain={[0.5, 3.5]}
            ticks={[1, 2, 3]}
            tickFormatter={(value) => timeSlots[value - 1]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            type="number"
            dataKey="student" 
            name="Student"
            domain={[0.5, 6.5]}
            ticks={studentList.map((_, i) => i + 1)}
            tickFormatter={(value) => studentList[value - 1]}
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
          <Scatter name="Presence" data={chartData}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
            ))}
          </Scatter>
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
        Visual timeline of student presence across session time periods
      </p>
    </div>
  );
}
