export default function AnomalyAlert({ anomaly, onDismiss }) {
  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'LOW':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-200 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-200 text-yellow-800';
      case 'LOW':
        return 'bg-blue-200 text-blue-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getAnomalyIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'duplicate_login':
        return '⚠️';
      case 'device_mismatch':
        return '🔄';
      case 'timeout':
        return '⏱️';
      case 'unauthorized_device':
        return '🔒';
      default:
        return '🔔';
    }
  };

  return (
    <div className={`p-4 rounded-lg border flex items-start justify-between ${getSeverityColor(anomaly.severity)}`}>
      <div className="flex gap-3 flex-1">
        <span className="text-xl mt-1">{getAnomalyIcon(anomaly.type)}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold">{anomaly.type?.replace(/_/g, ' ').toUpperCase()}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityBadge(anomaly.severity)}`}>
              {anomaly.severity?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm mb-2">{anomaly.message}</p>
          {anomaly.deviceId && (
            <p className="text-xs opacity-75">Device: {anomaly.deviceId}</p>
          )}
          {anomaly.studentId && (
            <p className="text-xs opacity-75">Student: {anomaly.studentId}</p>
          )}
          <p className="text-xs opacity-75 mt-1">
            {new Date(anomaly.detectedAt || Date.now()).toLocaleString()}
          </p>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-xl opacity-60 hover:opacity-100 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
}
