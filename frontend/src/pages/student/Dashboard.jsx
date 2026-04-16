import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentSession } from '../../hooks/useAttendance';
import SessionCard from '../../components/SessionCard';
import api from '../../utils/api';

/**
 * Student Dashboard
 * Displays:
 * - Current active session with real-time timer
 * - Attendance statistics
 * - Enrolled courses list
 * - Quick links to history and course details
 */
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { session, loading: sessionLoading, error: sessionError, refetch: refetchSession } = useCurrentSession();
  
  const [stats, setStats] = useState({
    presentCount: 0,
    totalSessions: 0,
    attendancePercentage: 0,
    currentStreak: 0,
  });

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  
  // Track which sessions we've already joined to avoid duplicate toasts
  const joinedSessions = useRef(new Set());

  // Fetch statistics from attendance history
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // For Day 2, show placeholder stats since no actual attendance data exists
        // This will be populated once professors start attendance sessions
        setStats({
          presentCount: 0,
          totalSessions: 0,
          attendancePercentage: 0,
          currentStreak: 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats({
          presentCount: 0,
          totalSessions: 0,
          attendancePercentage: 0,
          currentStreak: 0,
        });
      }
    };

    fetchStats();
  }, []);

  // Fetch enrolled courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await api.get('/api/courses');
        setCourses(response.data.data?.courses || []);
        setCoursesError(null);
      } catch (error) {
        setCoursesError(error.response?.data?.message || 'Failed to fetch courses');
        toast.error('Failed to load courses');
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Auto-join active sessions in enrolled courses
  useEffect(() => {
    if (courses && courses.length > 0) {
      const autoJoinSessions = async () => {
        for (const course of courses) {
          try {
            console.log('🔍 Checking for active session in course:', course.name);
            const response = await api.post('/api/attendance/join-session', {
              courseId: course.id,
            });
            if (response.data?.status === 'success') {
              // Only show toast if we haven't already joined this session
              if (!joinedSessions.current.has(course.id)) {
                // Check if it's a new join (not "already joined")
                if (!response.data?.message?.includes('Already')) {
                  console.log('✅ Joined active session:', course.name);
                  toast.success(`Joined session for ${course.name}`);
                  joinedSessions.current.add(course.id);
                }
              }
              // Trigger refresh of current session
              if (refetchSession) {
                refetchSession();
              }
            }
          } catch (error) {
            // No active session - remove from joined set
            // This allows showing the message again if session restarts
            if (error.response?.status === 404) {
              joinedSessions.current.delete(course.id);
              console.log(`ℹ️ No active session for ${course.name}`);
            } else {
              console.log(`ℹ️ Error joining session for ${course.name}:`, error.message);
            }
          }
        }
      };

      autoJoinSessions();
      
      // Only retry every 10 seconds if there's no active session
      // This prevents continuous retries when already joined
      const retryInterval = setInterval(() => {
        // Only retry if we don't have an active session
        if (!session) {
          autoJoinSessions();
        }
      }, 10000);
      
      return () => clearInterval(retryInterval);
    }
  }, [courses, refetchSession, session]);

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
              <span className="mr-3">👨‍🎓</span>
              Student Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome, <span className="font-semibold">{user?.email || 'Student'}</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Session Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📍</span>
            Current Session
          </h2>
          <SessionCard
            session={session}
            loading={sessionLoading}
            error={sessionError}
          />
        </section>

        {/* Statistics Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Attendance Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sessions */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSessions}</p>
                </div>
                <span className="text-4xl">📚</span>
              </div>
            </div>

            {/* Present Count */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase">Present</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.presentCount}</p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </div>

            {/* Attendance Percentage */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase">Attendance %</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.attendancePercentage}%</p>
                </div>
                <span className="text-4xl">📈</span>
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.currentStreak}</p>
                </div>
                <span className="text-4xl">🔥</span>
              </div>
            </div>
          </div>
        </section>

        {/* Enrolled Courses Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">📖</span>
              My Courses
            </h2>
            <a
              href="/student/attendance"
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center"
            >
              View Full History
              <span className="ml-2">→</span>
            </a>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-md animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : coursesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 font-semibold">Failed to load courses</p>
              <p className="text-red-500 text-sm mt-1">{coursesError}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
              <span className="text-5xl mb-4 block">📚</span>
              <p className="text-gray-600 font-semibold">No courses enrolled yet</p>
              <p className="text-gray-500 text-sm mt-1">
                You'll see your courses here once you're enrolled by a professor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200 border-t-4 border-indigo-500 cursor-pointer group"
                >
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-semibold">Code:</span> {course.code}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Professor:</span> {course.professorName || 'TBA'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <a
                      href={`/student/attendance?course=${course.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center"
                    >
                      View Attendance
                      <span className="ml-1">→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="bg-white rounded-lg shadow-md p-8 border-t-4 border-indigo-500">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/student/attendance"
              className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-6 transition duration-200 border border-blue-200"
            >
              <div className="text-3xl mb-3">📋</div>
              <h4 className="font-bold text-gray-900 mb-1">Attendance History</h4>
              <p className="text-sm text-gray-600">View your complete attendance record</p>
            </a>

            <a
              href="/student/courses"
              className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg p-6 transition duration-200 border border-green-200"
            >
              <div className="text-3xl mb-3">📚</div>
              <h4 className="font-bold text-gray-900 mb-1">My Courses</h4>
              <p className="text-sm text-gray-600">View enrolled courses and details</p>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
