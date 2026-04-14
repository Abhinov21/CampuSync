import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminAnomalies() {
  const { user, logout } = useAuth();
  const [anomalies] = useState([]);

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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Anomalies & Alerts</h2>
        {anomalies.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600">No anomalies detected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Anomalies will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}
