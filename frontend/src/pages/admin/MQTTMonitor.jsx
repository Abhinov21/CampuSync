import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import MQTTLogViewer from '../../components/MQTTLogViewer';
import toast from 'react-hot-toast';

export default function AdminMQTTMonitor() {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    fetchMQTTLogs();
    if (isMonitoring) {
      const interval = setInterval(fetchMQTTLogs, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const fetchMQTTLogs = async () => {
    try {
      const response = await api.get('/api/admin/mqtt-logs?limit=100');
      if (response.data.logs) {
        // Add timestamps to logs if not present
        const formattedLogs = response.data.logs.map((log, idx) => ({
          ...log,
          timestamp: new Date(log.createdAt || Date.now()).toLocaleTimeString(),
          id: log.id || idx,
        }));
        setLogs(formattedLogs);
        setEventCount(response.data.totalCount || formattedLogs.length);
      }
      setLoading(false);
    } catch (error) {
      if (loading) {
        // First load failure - show error
        console.error('Failed to fetch MQTT logs:', error);
      }
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setEventCount(0);
    toast.success('Logs cleared');
  };

  if (loading && logs.length === 0) {
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading MQTT logs...</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">MQTT Monitor</h2>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-green-600">{eventCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Displayed</p>
              <p className="text-3xl font-bold text-blue-600">{logs.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-3xl font-bold ${isMonitoring ? 'text-green-600' : 'text-gray-600'}`}>
                {isMonitoring ? '🔴 LIVE' : '⏸ PAUSED'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <input
              type="text"
              placeholder="Filter logs (event type, device ID, message)..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-4 py-2 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-4 py-2 rounded text-white font-semibold ${
                isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isMonitoring ? '⏸ Pause' : '▶ Resume'}
            </button>
            <button
              onClick={fetchMQTTLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              🔄 Refresh
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
            >
              🗑 Clear
            </button>
          </div>
        </div>

        {/* MQTT Log Viewer */}
        <MQTTLogViewer logs={logs} filter={filter} isLive={isMonitoring} />

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Logs are fetched every 2 seconds automatically. Use filters to find specific events by device ID or event type.
          </p>
        </div>
      </div>
    </div>
  );
}
