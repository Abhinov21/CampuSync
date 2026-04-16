import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function AdminActiveSessions() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
    try {
      // Call the correct backend endpoint without /admin prefix
      const response = await api.get('/api/admin/sessions/active');
      
      // Handle the response format from backend
      if (response.data?.data?.sessions) {
        // If backend returns sessions array
        setSessions(response.data.data.sessions);
      } else if (response.data?.data?.attendanceSessions) {
        // If backend returns attendance sessions
        setSessions(response.data.data.attendanceSessions);
      } else if (Array.isArray(response.data?.data)) {
        // If data is directly an array
        setSessions(response.data.data);
      } else {
        setSessions([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      if (error.response?.status === 404) {
        console.log('Endpoint may not exist - trying alternative route');
      }
      setSessions([]);
      setLoading(false);
    }
  };

  const filteredSessions = filter
    ? sessions.filter(session =>
        session.student?.name?.toLowerCase().includes(filter.toLowerCase()) ||
        session.studentId?.toLowerCase().includes(filter.toLowerCase()) ||
        session.course?.name?.toLowerCase().includes(filter.toLowerCase())
      )
    : sessions;

  const calculateDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">CampuSync</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user?.profile?.name || user?.email}</span>
              <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Logout
              </button>
            </div>
          </div>
        </nav>
        <div className="flex">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading active sessions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">CampuSync</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.profile?.name || user?.email}</span>
            <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Active Sessions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <p className="text-sm text-gray-600">Active Right Now</p>
                <p className="text-3xl font-bold text-green-600">{sessions.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <p className="text-sm text-gray-600">Displayed</p>
                <p className="text-3xl font-bold text-blue-600">{filteredSessions.length}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6 flex-wrap">
              <input
                type="text"
                placeholder="Filter by student name, ID, or course..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 px-4 py-2 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={fetchActiveSessions}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              >
                🔄 Refresh
              </button>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">
                  {sessions.length === 0 ? 'No active sessions right now' : 'No sessions matching filter'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 hover:shadow-lg transition">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {session.student?.profile?.name || session.studentId}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Course:</strong> {session.course?.name || 'N/A'}</p>
                          <p><strong>Student ID:</strong> {session.studentId}</p>
                          <p><strong>Device ID:</strong> <span className="font-mono text-xs bg-gray-100 px-2 py-1">{session.deviceId}</span></p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Session Duration</p>
                          <p className="text-3xl font-mono font-bold text-green-600">
                            {calculateDuration(session.sessionStartTime)}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 mt-4">
                          Started: {new Date(session.sessionStartTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ● ACTIVE
                      </span>
                      {session.recheckCount && session.recheckCount > 0 && (
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          ⟳ Rechecked {session.recheckCount}x
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> This page automatically refreshes every 5 seconds. Duration counters update in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}