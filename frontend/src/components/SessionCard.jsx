import { useEffect, useState } from 'react';

/**
 * SessionCard Component
 * Displays current attendance session with real-time duration timer
 * 
 * Props:
 *   - session: Object { id, courseId, courseName, sessionStartTime, sessionStatus }
 *   - loading: Boolean
 *   - error: String
 */
export default function SessionCard({ session, loading, error, onExit }) {
  const [duration, setDuration] = useState('00:00:00');

  // Calculate and update duration every second
  useEffect(() => {
    if (!session || session.sessionStatus !== 'ACTIVE') return;

    const intervalId = setInterval(() => {
      const startTime = new Date(session.sessionStartTime);
      const now = new Date();
      const diffMs = now - startTime;

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatted = [hours, minutes, seconds]
        .map(v => String(v).padStart(2, '0'))
        .join(':');

      setDuration(formatted);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [session]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-blue-100 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-blue-100 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md">
        <div className="flex items-center">
          <span className="text-red-600 text-2xl mr-3">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Session</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 shadow-md border-2 border-dashed border-gray-300">
        <div className="text-center">
          <span className="text-5xl mb-3 block">📚</span>
          <h3 className="font-bold text-gray-800 text-lg mb-1">No Active Session</h3>
          <p className="text-gray-600 text-sm">
            You're not currently in an attendance session.
          </p>
          <p className="text-gray-500 text-xs mt-3">
            Your next class will appear here when a professor starts the session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 shadow-md border-l-4 border-green-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center">
            <span className="text-green-600 text-xl mr-2">✅</span>
            Active Session
          </h3>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            {session.courseName}
          </h2>
        </div>
        <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Started At</p>
          <p className="text-lg font-mono text-gray-800">
            {new Date(session.sessionStartTime).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Duration</p>
          <p className="text-lg font-mono font-bold text-green-700">{duration}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
        <p className="text-xs text-gray-600 mb-1">Session Status</p>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="font-semibold text-green-700">Attendance Recording Active</span>
        </div>
      </div>

      {onExit && (
        <button
          onClick={onExit}
          className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
        >
          <span className="mr-2">🚪</span>
          Exit Session
        </button>
      )}
    </div>
  );
}
