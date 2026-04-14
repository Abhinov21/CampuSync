import { Link, useLocation } from 'react-router-dom';

export default function AdminSidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'MQTT Monitor', path: '/admin/mqtt-monitor', icon: '📡' },
    { name: 'Active Sessions', path: '/admin/sessions', icon: '▶️' },
    { name: 'Anomalies', path: '/admin/anomalies', icon: '⚠️' },
    { name: 'Devices', path: '/admin/devices', icon: '📱' },
    { name: 'Analytics', path: '/admin/analytics', icon: '📊' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <p className="text-sm text-gray-400 mt-1">Navigation</p>
      </div>

      {/* Navigation Items */}
      <nav className="py-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-6 py-3 transition-all ${
              isActive(item.path)
                ? 'bg-blue-600 border-l-4 border-blue-400'
                : 'hover:bg-gray-800 border-l-4 border-transparent'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-700 bg-gray-900">
        <p className="text-xs text-gray-500">CampuSync Admin v1.0</p>
      </div>
    </aside>
  );
}
