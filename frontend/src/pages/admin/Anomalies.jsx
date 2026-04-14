import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';
import AnomalyAlert from '../../components/AnomalyAlert';
import toast from 'react-hot-toast';

export default function AdminAnomalies() {
  const { user, logout } = useAuth();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // 'all', 'high', 'medium', 'low'
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnomalies = async () => {
    try {
      const response = await api.get('/api/admin/anomalies?limit=50');
      if (response.data.anomalies) {
        setAnomalies(response.data.anomalies);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
      setLoading(false);
    }
  };

  const filteredAnomalies = anomalies
    .filter(a => !dismissed.has(a.id))
    .filter(a => {
      if (filter === 'all') return true;
      return a.severity?.toUpperCase() === filter.toUpperCase();
    });

  const severityCounts = {
    high: anomalies.filter(a => a.severity?.toUpperCase() === 'HIGH').length,
    medium: anomalies.filter(a => a.severity?.toUpperCase() === 'MEDIUM').length,
    low: anomalies.filter(a => a.severity?.toUpperCase() === 'LOW').length,
  };

  const handleDismiss = (id) => {
    setDismissed(new Set([...dismissed, id]));
  };

  const handleClearAll = () => {
    setDismissed(new Set(anomalies.map(a => a.id)));
    toast.success('All anomalies dismissed');
  };

  if (loading && anomalies.length === 0) {
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
              <p className="text-gray-600">Loading anomalies...</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Anomalies & Alerts</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-3xl font-bold text-red-600">{severityCounts.high}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                <p className="text-sm text-gray-600">Medium Severity</p>
                <p className="text-3xl font-bold text-yellow-600">{severityCounts.medium}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <p className="text-sm text-gray-600">Low Severity</p>
                <p className="text-3xl font-bold text-blue-600">{severityCounts.low}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <p className="text-sm text-gray-600">Dismissed</p>
                <p className="text-3xl font-bold text-green-600">{dismissed.size}</p>
              </div>
            </div>
          </div> {/* ✅ THIS WAS MISSING */}

          <div className="flex gap-3 mb-6 flex-wrap items-center">
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded font-semibold ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                All ({anomalies.length})
              </button>
              <button onClick={() => setFilter('high')} className={`px-4 py-2 rounded font-semibold ${filter === 'high' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-300 hover:bg-red-50'}`}>
                High ({severityCounts.high})
              </button>
              <button onClick={() => setFilter('medium')} className={`px-4 py-2 rounded font-semibold ${filter === 'medium' ? 'bg-yellow-600 text-white' : 'bg-white text-yellow-700 border border-yellow-300 hover:bg-yellow-50'}`}>
                Medium ({severityCounts.medium})
              </button>
              <button onClick={() => setFilter('low')} className={`px-4 py-2 rounded font-semibold ${filter === 'low' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'}`}>
                Low ({severityCounts.low})
              </button>
            </div>

            <div className="ml-auto flex gap-2">
              <button onClick={fetchAnomalies} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
                🔄 Refresh
              </button>
              <button onClick={handleClearAll} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold">
                ✓ Dismiss All
              </button>
            </div>
          </div>

          {filteredAnomalies.length === 0 ? (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600">
                {anomalies.length === 0
                  ? '✓ No anomalies detected - System running smoothly!'
                  : 'No anomalies matching the selected severity filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnomalies.map((anomaly) => (
                <AnomalyAlert
                  key={anomaly.id}
                  anomaly={anomaly}
                  onDismiss={() => handleDismiss(anomaly.id)}
                />
              ))}
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>About Anomalies:</strong> System automatically detects duplicate logins, device mismatches, unauthorized devices, and session timeouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}