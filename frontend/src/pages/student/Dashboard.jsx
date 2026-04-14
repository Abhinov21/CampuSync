import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAttendance } from '../../hooks/useAttendance';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { currentSession, fetchCurrentSession } = useAttendance();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchCurrentSession();
      setLoading(false);
    };
    loadData();
    
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [fetchCurrentSession]);

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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : currentSession ? (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-lg mb-8">
            <h3 className="text-2xl font-bold mb-4">{currentSession.course?.name || 'Active Session'}</h3>
            <div className="text-5xl font-mono mb-4">
              {currentSession.totalDurationSeconds ? 
                `${Math.floor(currentSession.totalDurationSeconds / 60)}:${(currentSession.totalDurationSeconds % 60).toString().padStart(2, '0')}` 
                : '00:00'}
            </div>
            <p className="text-blue-100">Joined at {new Date(currentSession.sessionStartTime).toLocaleTimeString()}</p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <p className="text-yellow-800">No active session right now</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium mb-2">Today's Attendence</p>
            <p className="text-3xl font-bold text-blue-600">--</p>
            <p className="text-gray-500 text-sm mt-2">Awaiting backend data</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium mb-2">Classes Attended</p>
            <p className="text-3xl font-bold text-green-600">--</p>
            <p className="text-gray-500 text-sm mt-2">Awaiting backend data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
