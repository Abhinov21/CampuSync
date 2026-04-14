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

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {/* Student Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {student.student?.name || student.studentName || 'Unknown Student'}
        </h3>
        <p className="text-sm text-gray-600">
          Roll: {student.student?.rollNumber || student.rollNumber || 'N/A'}
        </p>
        <p className="text-sm text-gray-600">
          Dept: {student.student?.department || student.department || 'N/A'}
        </p>
      </div>

      {/* Device Info */}
      <div className="mb-4 p-2 bg-gray-50 rounded">
        <p className="text-xs text-gray-600">Device ID: {student.deviceId}</p>
        {student.confidence && (
          <p className="text-xs text-gray-600">Confidence: {student.confidence}%</p>
        )}
      </div>

      {/* Duration */}
      <div className="mb-4 p-3 bg-blue-50 rounded text-center">
        <p className="text-xs text-gray-600 mb-1">Session Duration</p>
        <p className="text-2xl font-bold text-blue-600 font-mono">
          {formatDuration(duration)}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          ✓ Present
        </span>
        <span className="text-xs text-gray-500">
          {student.lastUpdate ? new Date(student.lastUpdate).toLocaleTimeString() : 'Just now'}
        </span>
      </div>
    </div>
  );
}
