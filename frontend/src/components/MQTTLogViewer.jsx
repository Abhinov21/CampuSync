import { useEffect, useRef } from 'react';

export default function MQTTLogViewer({ logs, filter = '', isLive = true }) {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (isLive && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, isLive]);

  const filteredLogs = filter
    ? logs.filter(log =>
        log.message?.toLowerCase().includes(filter.toLowerCase()) ||
        log.eventType?.toLowerCase().includes(filter.toLowerCase()) ||
        log.deviceId?.toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'auth':
        return 'text-green-400';
      case 'ping':
        return 'text-blue-400';
      case 'recheck_ok':
        return 'text-yellow-400';
      case 'session_end':
        return 'text-red-400';
      case 'anomaly':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const getEventBg = (eventType) => {
    switch (eventType) {
      case 'auth':
        return 'bg-green-900/20';
      case 'ping':
        return 'bg-blue-900/20';
      case 'recheck_ok':
        return 'bg-yellow-900/20';
      case 'session_end':
        return 'bg-red-900/20';
      case 'anomaly':
        return 'bg-orange-900/20';
      default:
        return 'bg-gray-900/20';
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto border border-gray-700"
    >
      {filteredLogs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {logs.length === 0 ? 'No MQTT events yet' : 'No events matching filter'}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className={`p-2 rounded ${getEventBg(log.eventType)}`}>
              <div className="flex gap-2">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className={`font-bold ${getEventColor(log.eventType)}`}>
                  {log.eventType?.toUpperCase()}
                </span>
                <span className="text-gray-400">{log.deviceId}</span>
                <span className="text-white flex-1">{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
