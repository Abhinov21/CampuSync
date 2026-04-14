import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function StudentCourses() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/courses');
      console.log('📚 Enrolled courses response:', response.data);
      setCourses(response.data.data?.courses || []);
      
      if (!response.data.data?.courses || response.data.data.courses.length === 0) {
        console.log('ℹ️ No courses enrolled');
      }
    } catch (error) {
      console.error('❌ Failed to fetch courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
              if (!response.data?.message?.includes('Already')) {
                console.log('✅ Joined active session:', course.name);
                toast.success(`Joined session for ${course.name}`);
              }
            }
          } catch (error) {
            // No active session is fine
            console.log(`ℹ️ No active session for ${course.name}`);
          }
        }
      };

      autoJoinSessions();
    }
  }, [courses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">CampuSync</h1>
            <p className="text-xs text-gray-500">Student Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-sm">{user?.email}</span>
            <button 
              onClick={logout} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Courses</h2>
            <p className="text-gray-600 mt-1">
              Enrolled in <span className="font-semibold text-blue-600">{courses.length}</span> course{courses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-500 p-8 text-center">
            <p className="text-gray-600 text-lg">📚 No courses enrolled yet</p>
            <p className="text-gray-500 text-sm mt-2">Please check back later or contact your instructor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border-t-4 border-blue-500"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                  <h3 className="text-lg font-bold">{course.name}</h3>
                  <p className="text-sm text-blue-100 mt-1">{course.code}</p>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Basic Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Credits:</span>
                      <span className="font-semibold text-gray-900">{course.credits}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-semibold text-gray-900">{course.semester}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Professor:</span>
                      <span className="font-semibold text-gray-900">{course.professor?.name || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Attendance Stats */}
                  <div className="space-y-3 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Attendance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Sessions:</span>
                        <span className="font-semibold text-gray-900">{course.totalSessions || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Attended:</span>
                        <span className="font-semibold text-green-600">{course.attendedSessions || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Percentage:</span>
                        <span className="font-semibold text-indigo-600">
                          {course.attendancePercentage || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(course.attendancePercentage || 0, 100)}%` }}
                    ></div>
                  </div>

                  {/* Enrollment Status */}
                  <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                    ✓ Enrolled
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <a
                    href={`/student/courses/${course.id}`}
                    className="w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition font-medium block"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
