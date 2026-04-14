import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHistoryList } from '../../hooks/useAttendance';

/**
 * Student Attendance History Page
 * Features:
 * - Paginated attendance records (20 per page)
 * - Filter by course
 * - View session details
 * - Status badge indicators
 */
export default function StudentAttendance() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const selectedCourseId = searchParams.get('course') || null;

  const { records, totalPages, loading, error, totalCount } = useHistoryList(
    currentPage,
    selectedCourseId,
    20
  );

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams();
    params.set('page', newPage);
    if (selectedCourseId) params.set('course', selectedCourseId);
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">📋</span>
              Attendance History
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{user?.email || 'Student'}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center"
          >
            <span className="mr-2">🚪</span>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <a
          href="/student"
          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center mb-6"
        >
          <span className="mr-2">←</span>
          Back to Dashboard
        </a>

        {/* Results Info */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">{totalCount}</span> total attendance records
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Showing {records.length > 0 ? (currentPage - 1) * 20 + 1 : 0} to{' '}
                {Math.min(currentPage * 20, totalCount)} of {totalCount}
              </p>
            </div>
            {selectedCourseId && (
              <button
                onClick={() => setSearchParams(new URLSearchParams())}
                className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded text-sm"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="bg-white rounded-lg p-6 shadow-md animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <span className="text-red-600 text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Failed to Load Records</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
            <span className="text-5xl mb-4 block">📚</span>
            <p className="text-gray-600 font-semibold">No attendance records found</p>
            <p className="text-gray-500 text-sm mt-1">
              {selectedCourseId
                ? 'No records for this course. Try clearing the filter.'
                : 'You don\'t have any attendance records yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record, idx) => {
              const isPresent = record.attended === true || record.status === 'PRESENT';
              const sessionDate = new Date(record.date || record.sessionStartTime);
              const sessionTime = new Date(record.sessionStartTime);

              return (
                <div
                  key={record.id || idx}
                  className={`rounded-lg shadow-md p-6 border-l-4 transition duration-200 ${
                    isPresent
                      ? 'bg-green-50 border-green-500 hover:shadow-lg'
                      : 'bg-red-50 border-red-500 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {record.courseName || 'Course TBA'}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isPresent
                              ? 'bg-green-200 text-green-800'
                              : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {isPresent ? '✅ Present' : '❌ Absent'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Session Start Time */}
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                            Session Started
                          </p>
                          <p className="text-sm font-mono text-gray-800">
                            {sessionDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            {sessionTime.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {/* Duration */}
                        {record.durationSeconds && (
                          <div>
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                              Duration
                            </p>
                            <p className="text-sm font-mono text-gray-800">
                              {Math.floor(record.durationSeconds / 3600)}h{' '}
                              {Math.floor((record.durationSeconds % 3600) / 60)}m
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Course Code */}
                      {record.courseCode && (
                        <p className="text-xs text-gray-600 mt-3">
                          <span className="font-semibold">Code:</span> {record.courseCode}
                        </p>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="ml-4 text-4xl">
                      {isPresent ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              ← Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg font-semibold transition duration-200 ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Next →
            </button>
          </div>
        )}

        {/* Total Pages Info */}
        {totalPages > 1 && (
          <p className="text-center text-gray-600 text-sm mt-4">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </main>
    </div>
  );
}
