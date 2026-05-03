import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import StudentBreakdownChart from '../../components/charts/StudentBreakdownChart';
import DurationDistributionChart from '../../components/charts/DurationDistributionChart';
import PresenceTimeline from '../../components/charts/PresenceTimeline';
import AttendanceDonutChart from '../../components/charts/AttendanceDonutChart';
import SessionDetailsModal from '../../components/SessionDetailsModal';

export default function ProfessorAnalytics() {
  const { user, logout } = useAuth();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // 'all', 'week', 'month'
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgAttendance: 0,
    totalStudents: 0,
    avgDuration: 0,
  });
  const [chartData, setChartData] = useState({
    trendData: [],
    studentBreakdownData: [],
    durationData: [],
    presenceTimelineData: [],
    donutData: [],
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [courseId, user, dateRange]);

  const fetchData = async () => {
    if (!user || !courseId) return;

    try {
      setLoading(true);

      // Fetch course details
      const courseResponse = await api.get(`/api/courses/${courseId}`);
      if (courseResponse.data?.data) {
        setCourse(courseResponse.data.data);
      }

      // Build query params based on date range
      let queryParams = '';
      if (dateRange === 'week') {
        queryParams = '?days=7';
      } else if (dateRange === 'month') {
        queryParams = '?days=30';
      }

      // Fetch attendance report
      const reportResponse = await api.get(`/api/attendance/course/${courseId}/report${queryParams}`);
      
      if (reportResponse.data?.data) {
        const data = reportResponse.data.data;
        // Normalize sessions array and ensure duration field exists
        const sessionData = Array.isArray(data.sessions)
          ? data.sessions
          : (data.sessions ? [data.sessions] : []);

        // Debug: log backend report to inspect fields
        // eslint-disable-next-line no-console
        console.debug('Attendance report response:', data);

        // Ensure each session has a sessionDurationSeconds field (fallback to avgDuration)
        const normalizedSessions = sessionData.map(s => ({
          ...s,
          sessionDurationSeconds: s.sessionDurationSeconds ?? s.avgDuration ?? 0,
          totalEnrolled: s.totalEnrolled ?? data.totalStudents ?? 0,
        }));

        setSessions(normalizedSessions);
        
        // Calculate statistics - CORRECTED
        const totalSessions = data.totalSessions || 0;
        const totalAttendance = sessionData.reduce(
          (sum, s) => sum + (s.attendanceCount || 0),
          0
        );
        const avgAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;
        const totalStudents = data.totalStudents || 0;
        
        // FIXED: avgDuration is already in seconds, don't multiply by 60
        const totalDuration = sessionData.reduce(
          (sum, s) => sum + (s.avgDuration || 0),
          0
        );
        const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

        setStats({
          totalSessions,
          avgAttendance,
          totalStudents,
          avgDuration, // Now in seconds
        });

        // Prepare chart data from real data
        prepareChartData(sessionData, totalStudents);
      }
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError('Failed to load analytics');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for all charts
  const prepareChartData = (sessions, totalStudents) => {
    // Attendance Trend Chart data
    const trendData = sessions
      .filter(s => s.scheduledStartTime)
      .map((s) => ({
        date: new Date(s.scheduledStartTime).toLocaleDateString(),
        attendance: s.attendanceCount ? Math.round((s.attendanceCount / totalStudents) * 100) : 0,
        students: s.attendanceCount || 0,
        shortDate: new Date(s.scheduledStartTime).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
      }))
      .slice(-30); // Last 30 sessions

    // Duration Distribution Chart data - bin durations into ranges
    const durationBuckets = {};
    sessions.forEach((s) => {
      if (s.avgDuration > 0) {
        const minutes = Math.round(s.avgDuration / 60);
        const bucketKey = minutes <= 15 ? '0-15m' : 
                         minutes <= 30 ? '15-30m' : 
                         minutes <= 45 ? '30-45m' : 
                         minutes <= 60 ? '45-60m' : '60m+';
        
        if (!durationBuckets[bucketKey]) {
          durationBuckets[bucketKey] = { duration: bucketKey, sessions: 0, sessionCount: 0 };
        }
        durationBuckets[bucketKey].sessions += 1;
        durationBuckets[bucketKey].sessionCount += 1;
      }
    });

    const durationData = Object.values(durationBuckets);

    // Student Breakdown data - aggregate attendance across all sessions
    const studentMap = {};
    sessions.forEach((session) => {
      const totalEnrolled = session.totalEnrolled || 0;
      const attended = session.attendanceCount || 0;
      
      // Create a unique identifier for aggregating (using session index for now)
      // In a real scenario, this would be per-student data
      const label = `Session ${sessions.indexOf(session) + 1}`;
      studentMap[label] = {
        student: label,
        present: attended,
        absent: Math.max(0, totalEnrolled - attended),
      };
    });

    const studentBreakdownData = Object.values(studentMap).slice(-10); // Last 10 sessions
    
    // Presence Timeline data - show attendance status across sessions
    const presenceTimelineData = sessions
      .slice(-12) // Last 12 sessions
      .map((session, idx) => ({
        time: idx + 1,
        student: idx + 1,  // Use numeric index for Y-axis
        studentLabel: `Session ${idx + 1}`,
        status: session.attendanceCount > 0 ? 1 : 0, // 1 for present, 0 for absent
        sessionDate: session.scheduledStartTime,
        attendance: session.attendanceCount,
        total: session.totalEnrolled,
      }));
    
    // Donut Chart data (attendance vs absence)
    const presentCount = sessions.reduce((sum, s) => sum + (s.attendanceCount || 0), 0);
    const totalEnrollments = sessions.reduce((sum, s) => sum + (s.totalEnrolled || 0), 0);
    const absentCount = Math.max(0, totalEnrollments - presentCount);

    const donutData = [
      { name: 'Present', value: presentCount, fill: '#10b981' },
      { name: 'Absent', value: absentCount, fill: '#ef4444' },
    ];

    setChartData({
      trendData: trendData.length > 0 ? trendData : [],
      studentBreakdownData: studentBreakdownData.length > 0 ? studentBreakdownData : [],
      durationData: durationData.length > 0 ? durationData : [],
      presenceTimelineData: presenceTimelineData.length > 0 ? presenceTimelineData : [],
      donutData,
    });
  };

  // Format duration in seconds to readable format
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  // Export attendance data to CSV
  const handleExportCSV = () => {
    if (!course || !sessions || sessions.length === 0) {
      alert('No data to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header row
    const headers = ['Date & Time', 'Duration', 'Attendance', 'Attendance Rate %'];
    csvContent += headers.join(',') + '\n';

    // Add data rows
    sessions.forEach((session) => {
      const attendanceRate =
        stats.totalStudents > 0
          ? Math.round(((session.attendanceCount || 0) / stats.totalStudents) * 100)
          : 0;
      
      const dateTime = session.scheduledStartTime
        ? new Date(session.scheduledStartTime).toLocaleString()
        : 'N/A';
      const duration = formatDuration(session.avgDuration || 0);
      const attendance = `${session.attendanceCount || 0}/${stats.totalStudents}`;
      
      csvContent += `"${dateTime}","${duration}","${attendance}",${attendanceRate}\n`;
    });

    // Add summary section
    csvContent += '\n\nSummary Statistics\n';
    csvContent += `Course Name,${course.name}\n`;
    csvContent += `Course Code,${course.code || 'N/A'}\n`;
    csvContent += `Total Sessions,${stats.totalSessions}\n`;
    csvContent += `Average Attendance,${stats.avgAttendance}\n`;
    csvContent += `Total Students,${stats.totalStudents}\n`;
    csvContent += `Average Duration,${formatDuration(stats.avgDuration)}\n`;
    csvContent += `Exported On,${new Date().toLocaleString()}\n`;

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${course.code || 'analytics'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ CSV exported successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">CampuSync</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.profile?.name || user?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {course?.name || 'Analytics'} - Statistics & Reports
            </h2>
            {course && <p className="text-gray-600 mt-1">{course.code}</p>}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              🔄 Refresh
            </button>
            {!loading && sessions.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium flex items-center gap-2"
              >
                📥 Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <div className="flex gap-1">
            <button
              onClick={() => setDateRange('all')}
              className={`px-4 py-2 rounded font-medium ${
                dateRange === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded font-medium ${
                dateRange === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded font-medium ${
                dateRange === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Last Week
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.totalSessions}
                </p>
                <p className="text-xs text-gray-500 mt-2">Classes conducted</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Avg Attendance</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.avgAttendance}
                </p>
                <p className="text-xs text-gray-500 mt-2">Students per session</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.totalStudents}
                </p>
                <p className="text-xs text-gray-500 mt-2">Enrolled in course</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {formatDuration(stats.avgDuration)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Per session</p>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Session History
                </h3>
              </div>

              {!sessions || sessions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No sessions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Attendance
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Attendance Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(sessions) && sessions.map((session, idx) => {
                        const attendanceRate =
                          stats.totalStudents > 0
                            ? Math.round(
                                ((session.attendanceCount || 0) / stats.totalStudents) *
                                  100
                              )
                            : 0;
                        return (
                          <tr
                            key={session.id || session.sessionId || `session-${idx}`}
                            className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition"
                            onClick={() => {
                              setSelectedSession(session);
                              setSessionDetailsOpen(true);
                            }}
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {session.scheduledStartTime
                                ? new Date(
                                    session.scheduledStartTime
                                  ).toLocaleString()
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDuration(session.sessionDurationSeconds ? session.sessionDurationSeconds : 0)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {session.attendanceCount || 0} / {session.totalEnrolled || stats.totalStudents}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  attendanceRate >= 80
                                    ? 'bg-green-100 text-green-800'
                                    : attendanceRate >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {attendanceRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Charts Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Visualizations</h3>
              
              {/* Top Row - Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <AttendanceTrendChart data={chartData.trendData} />
                <AttendanceDonutChart data={chartData.donutData} />
              </div>

              {/* Middle Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <StudentBreakdownChart data={chartData.studentBreakdownData} sessions={sessions} />
                <DurationDistributionChart data={chartData.durationData} />
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 gap-6">
                <PresenceTimeline data={chartData.presenceTimelineData} />
              </div>

              {/* Export Options */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">📊 Export Options</h4>
                <p className="text-blue-800 mb-4">Export detailed attendance reports:</p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    📥 CSV Report
                  </button>
                </div>
              </div>
            </div>

            {/* Session Details Modal */}
            <SessionDetailsModal 
              session={selectedSession}
              isOpen={sessionDetailsOpen}
              onClose={() => setSessionDetailsOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
