import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import StudentBreakdownChart from '../../components/charts/StudentBreakdownChart';
import DurationDistributionChart from '../../components/charts/DurationDistributionChart';
import PresenceTimeline from '../../components/charts/PresenceTimeline';
import AttendanceDonutChart from '../../components/charts/AttendanceDonutChart';

export default function AdminAnalytics() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 'all', 'week', 'month'
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0,
    averageDuration: 0,
    activeCourses: 0,
    totalAttendanceRecords: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      // Build query params based on date range
      let queryParams = '';
      if (dateRange === 'week') {
        queryParams = '?days=7';
      } else if (dateRange === 'month') {
        queryParams = '?days=30';
      }

      const response = await api.get(`/api/admin/analytics/overview${queryParams}`);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
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

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">System-Wide Analytics</h2>
              <p className="text-gray-600 mt-1">Global statistics and insights for CampuSync</p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              🔄 Refresh
            </button>
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalSessions}</p>
                <p className="text-xs text-gray-500 mt-2">Classes conducted system-wide</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500 mt-2">Enrolled in platform</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.activeCourses}</p>
                <p className="text-xs text-gray-500 mt-2">Running on platform</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <p className="text-sm text-gray-600">Avg Attendance Rate</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.averageAttendance}%</p>
                <p className="text-xs text-gray-500 mt-2">Across all classes</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-pink-500">
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-pink-600 mt-2">
                  {formatDuration(stats.averageDuration * 60)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Per session</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalAttendanceRecords}</p>
                <p className="text-xs text-gray-500 mt-2">Attendance records</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">System Analytics & Visualizations</h3>
              
              {/* Top Row - Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <AttendanceTrendChart />
                <AttendanceDonutChart />
              </div>

              {/* Middle Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <StudentBreakdownChart />
                <DurationDistributionChart />
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 gap-6">
                <PresenceTimeline />
              </div>

              {/* System Health */}
              <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">🔍 System Health Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">✓</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">API Health</p>
                    <p className="text-xs text-gray-600">Operational</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">✓</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">Database</p>
                    <p className="text-xs text-gray-600">Connected</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">✓</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">MQTT Broker</p>
                    <p className="text-xs text-gray-600">Connected</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">✓</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">WebSocket</p>
                    <p className="text-xs text-gray-600">Running</p>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">📊 System Export Options</h4>
                <p className="text-blue-800 mb-4">Generate comprehensive system reports:</p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                    📥 Full System Report
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                    📄 Daily Summary
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium">
                    📋 Student Roster
                  </button>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-medium">
                    📈 Trends Report
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
