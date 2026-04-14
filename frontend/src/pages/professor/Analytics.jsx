import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';

export default function ProfessorAnalytics() {
  const { user, logout } = useAuth();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgAttendance: 0,
    totalStudents: 0,
    avgDuration: 0,
  });

  // Fetch course data and sessions
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !courseId) return;

      try {
        setLoading(true);

        // Fetch course details
        const courseResponse = await api.get(`/api/courses/${courseId}`);
        if (courseResponse.data?.data) {
          setCourse(courseResponse.data.data);
        }

        // Fetch attendance report
        const reportResponse = await api.get(`/api/attendance/course/${courseId}/report`);
        console.log('📊 Report response:', reportResponse.data);
        
        if (reportResponse.data?.data) {
          const data = reportResponse.data.data;
          const sessionData = Array.isArray(data.sessions) 
            ? data.sessions 
            : (data.sessions ? [data.sessions] : []);
          setSessions(sessionData);
          
          // Calculate statistics
          const totalSessions = data.sessions?.length || 0;
          const totalAttendance = data.sessions?.reduce(
            (sum, s) => sum + (s.attendanceCount || 0),
            0
          ) || 0;
          const avgAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;
          const totalStudents = data.totalStudents || 0;
          const totalDuration = data.sessions?.reduce(
            (sum, s) => sum + (s.avgDuration || 0),
            0
          ) || 0;
          const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

          setStats({
            totalSessions,
            avgAttendance,
            totalStudents,
            avgDuration,
          });
        }
      } catch (err) {
        console.error('❌ Error fetching analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user]);

  // Format duration in minutes
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
      const duration = formatDuration(session.avgDuration * 60 || 0);
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
    csvContent += `Average Duration,${formatDuration(stats.avgDuration * 60)}\n`;
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {course?.name || 'Analytics'} - Statistics & Reports
            </h2>
            {course && <p className="text-gray-600 mt-1">{course.code}</p>}
          </div>
          {!loading && sessions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium flex items-center gap-2"
            >
              📥 Export to CSV
            </button>
          )}
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
                  {formatDuration(stats.avgDuration * 60)}
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
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {session.scheduledStartTime
                                ? new Date(
                                    session.scheduledStartTime
                                  ).toLocaleString()
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDuration(session.avgDuration * 60 || 0)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {session.attendanceCount || 0} / {stats.totalStudents}
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
          </>
        )}
      </div>
    </div>
  );
}
