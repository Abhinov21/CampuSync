import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function SessionDetailsModal({ session, isOpen, onClose }) {
  const [detailedReport, setDetailedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && session?.id) {
      fetchSessionDetails();
    }
  }, [isOpen, session?.id]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/sessions/${session.id}/report`);
      setDetailedReport(response.data?.data);
    } catch (err) {
      console.error('Error fetching session details:', err);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    // Convert to integer to avoid floating point precision issues
    const totalSecs = Math.floor(Number(seconds));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const calculateSessionDuration = () => {
    if (!detailedReport?.session) return 0;
    const start = new Date(detailedReport.session.sessionStartTime);
    const end = new Date(detailedReport.session.sessionEndTime);
    return Math.floor((end - start) / 1000);
  };

  const sessionDuration = calculateSessionDuration();
  const thresholdDuration = Math.ceil(sessionDuration * 0.65);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{session?.courseName || 'Session Details'}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {new Date(session?.scheduledStartTime).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-blue-600 rounded p-2 w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
              {error}
            </div>
          ) : detailedReport ? (
            <>
              {/* Session Summary */}
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Total Enrolled</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {detailedReport.report.totalEnrolled}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Present (≥65%)</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {detailedReport.report.attended}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Absent (&lt;65%)</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {detailedReport.report.absent}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Avg Duration</p>
                  <p className="text-xl font-bold text-purple-600 mt-1">
                    {formatDuration(detailedReport.report.averageDuration)}
                  </p>
                </div>
              </div>

              {/* Threshold Information */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Attendance Threshold</h3>
                <p className="text-sm text-gray-700">
                  Session Duration: <span className="font-mono font-bold">{formatDuration(sessionDuration)}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Required Duration (65%): <span className="font-mono font-bold text-blue-600">{formatDuration(thresholdDuration)}</span>
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  ✓ Students with ≥ {formatDuration(thresholdDuration)} are marked PRESENT
                </p>
              </div>

              {/* Students List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Student Attendance Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Roll #</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Duration</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">% of Session</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedReport.report.students.map((student, idx) => {
                        const durationPercentage = student.attendancePercentage;
                        const isPresent = student.attended;
                        
                        return (
                          <tr 
                            key={idx}
                            className={`border-b ${isPresent ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}`}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {student.rollNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-mono text-gray-800">
                              {formatDuration(student.durationSeconds)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex items-center justify-center">
                                <div className="w-24 bg-gray-300 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      isPresent ? 'bg-green-600' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${Math.min(durationPercentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold min-w-12 text-right">
                                  {durationPercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  isPresent
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-red-200 text-red-800'
                                }`}
                              >
                                {isPresent ? '✅ Present' : '❌ Absent'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {detailedReport.report.students.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No student attendance records for this session
                  </div>
                )}
              </div>

              {/* Duration Statistics */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 text-sm font-semibold">Longest Duration</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatDuration(detailedReport.report.longestDuration)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 text-sm font-semibold">Average Duration</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatDuration(detailedReport.report.averageDuration)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 text-sm font-semibold">Shortest Duration</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatDuration(detailedReport.report.shortestDuration)}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
