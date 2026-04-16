/**
 * Student Attendance Card
 * Displays individual student attendance details with real-time updates
 */

import React, { useEffect, useState } from 'react';

export default function StudentAttendanceCard({ student }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Initialize duration
    setDuration(student.totalDurationSeconds || 0);

    // Update duration every second
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [student.totalDurationSeconds]);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract student info from nested or flat structure
  const studentName = student.student?.name || student.studentName || student.name || 'Unknown';
  const rollNumber = student.student?.rollNumber || student.rollNumber || 'N/A';
  const department = student.student?.department || student.department || 'N/A';
  const deviceId = student.deviceId || 'N/A';

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{studentName}</h3>
            <p className="text-xs text-gray-600 mt-1">Roll: {rollNumber}</p>
          </div>
          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
            ✓ Present
          </span>
        </div>
      </div>

      {/* Student Details */}
      <div className="px-4 py-3 space-y-3">
        {/* Department */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">🏢</span>
          <div>
            <p className="text-xs text-gray-500">Department</p>
            <p className="text-sm font-medium text-gray-900">{department}</p>
          </div>
        </div>

        {/* Device ID */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">📱</span>
          <div>
            <p className="text-xs text-gray-500">Device ID</p>
            <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{deviceId}</p>
          </div>
        </div>

        {/* Confidence if available */}
        {student.confidence && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">📊</span>
            <div>
              <p className="text-xs text-gray-500">Confidence</p>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${student.confidence}%` }}
                  ></div>
                </div>
                <p className="text-sm font-medium text-gray-900">{student.confidence}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Duration */}
        <div className="bg-blue-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-gray-600 mb-1 font-semibold">⏱️ Session Duration</p>
          <p className="text-2xl font-bold text-blue-600 font-mono">
            {formatDuration(duration)}
          </p>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          Last update: {student.lastUpdate ? new Date(student.lastUpdate).toLocaleTimeString() : 'Just now'}
        </div>
      </div>
    </div>
  );
}
