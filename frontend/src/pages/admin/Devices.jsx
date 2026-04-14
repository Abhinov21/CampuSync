import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function AdminDevices() {
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [assignModal, setAssignModal] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/api/admin/devices');
      if (response.data.devices) {
        setDevices(response.data.devices);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/admin/students');
      if (response.data.students) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleAssignClick = async (device) => {
    await fetchStudents();
    setAssignModal(device);
    setSelectedStudent('');
  };

  const handleAssignDevice = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    try {
      await api.post(`/api/admin/devices/${assignModal.id}/assign`, {
        studentId: selectedStudent,
      });
      toast.success('Device assigned successfully');
      setAssignModal(null);
      fetchDevices();
    } catch (error) {
      toast.error('Failed to assign device');
    }
  };

  const handleUnassignDevice = async (deviceId) => {
    if (!confirm('Unassign this device?')) return;

    try {
      await api.post(`/api/admin/devices/${deviceId}/unassign`);
      toast.success('Device unassigned');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to unassign device');
    }
  };

  const filteredDevices = devices.filter(device => {
    if (filter === 'active') return device.isActive;
    if (filter === 'inactive') return !device.isActive;
    return true;
  });

  const statusCounts = {
    total: devices.length,
    active: devices.filter(d => d.isActive).length,
    inactive: devices.filter(d => !d.isActive).length,
  };

  if (loading && devices.length === 0) {
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
              <p className="text-gray-600">Loading devices...</p>
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
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Devices Registry</h2>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Total Devices</p>
              <p className="text-3xl font-bold text-blue-600">{statusCounts.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-600">{statusCounts.active}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-3xl font-bold text-gray-600">{statusCounts.inactive}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6 flex-wrap items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All ({statusCounts.total})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
                }`}
              >
                Active ({statusCounts.active})
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded font-semibold ${
                  filter === 'inactive'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Inactive ({statusCounts.inactive})
              </button>
            </div>
            <div className="ml-auto">
              <button
                onClick={fetchDevices}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        {filteredDevices.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600">
              {devices.length === 0 ? 'No devices registered yet' : 'No devices matching filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device) => (
              <div
                key={device.id}
                className={`p-6 rounded-lg shadow border-l-4 ${
                  device.isActive ? 'border-green-500 bg-green-50' : 'border-gray-500 bg-gray-100'
                }`}
              >
                {/* Device Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{device.deviceName || device.id}</h3>
                    <p className="text-xs text-gray-600 font-mono">{device.id}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      device.isActive
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-300 text-gray-800'
                    }`}
                  >
                    {device.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>

                {/* Device Info */}
                <div className="space-y-2 text-sm mb-4">
                  {device.student ? (
                    <>
                      <p>
                        <strong>Assigned to:</strong>
                      </p>
                      <div className="bg-white p-2 rounded">
                        <p className="font-semibold">{device.student.profile?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">{device.studentId}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600 italic">Not assigned to any student</p>
                  )}

                  {device.batteryLevel !== undefined && (
                    <div>
                      <p>
                        <strong>Battery:</strong>
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition ${
                              device.batteryLevel > 50
                                ? 'bg-green-500'
                                : device.batteryLevel > 20
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${device.batteryLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium min-w-[3rem]">{device.batteryLevel}%</span>
                      </div>
                    </div>
                  )}

                  {device.lastSeen && (
                    <p className="text-xs text-gray-600">
                      <strong>Last seen:</strong> {new Date(device.lastSeen).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAssignClick(device)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Assign
                  </button>
                  {device.student && (
                    <button
                      onClick={() => handleUnassignDevice(device.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition"
                    >
                      Unassign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Device Management:</strong> Register and assign biometric wristbands to students. Battery levels update in real-time as devices communicate.
          </p>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              Assign Device: {assignModal.id}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border rounded border-gray-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose a student --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.profile?.name || student.email} ({student.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDevice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
