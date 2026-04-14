import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function ProfessorCourses() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    semester: 'Spring 2024',
  });

  // Fetch professor's courses
  const fetchCourses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.get('/api/courses/my-courses');
      console.log('📋 Courses response:', response.data);
      
      const courseData = response.data?.data || response.data?.courses || [];
      const coursesArray = Array.isArray(courseData) ? courseData : [];
      
      setCourses(coursesArray);
      console.log('✅ Fetched', coursesArray.length, 'courses');
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
      setError('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  // Handle form submission
  const handleCreateCourse = async (e) => {
    e.preventDefault();

    try {
      console.log('🚀 Creating course:', formData);
      const response = await api.post('/api/courses', formData);
      console.log('✅ Course created:', response.data);
      
      setCourses((prev) => [...prev, response.data?.data || response.data]);
      setFormData({ name: '', code: '', description: '', credits: 3, semester: 'Spring 2024' });
      setShowModal(false);
      setError(null);
      
      await fetchCourses();
    } catch (err) {
      console.error('❌ Error creating course:', err);
      setError(err.response?.data?.message || 'Failed to create course');
    }
  };

  // Start session for a course
  const handleStartSession = async (courseId) => {
    try {
      console.log('🚀 Starting session for course:', courseId);
      const response = await api.post(`/api/sessions/start`, { courseId });
      console.log('✅ Session started:', response.data);
      
      // Navigate to live attendance
      navigate('/professor/live-attendance');
    } catch (err) {
      console.error('❌ Error starting session:', err);
      setError(err.response?.data?.message || 'Failed to start session');
    }
  };

  // Export courses to CSV
  const handleExportCourses = () => {
    if (!courses || courses.length === 0) {
      alert('No courses to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    const headers = ['Course Name', 'Course Code', 'Credits', 'Semester', 'Enrolled Students'];
    csvContent += headers.join(',') + '\n';

    courses.forEach((course) => {
      const name = `"${course.name || ''}"`;
      const code = `"${course.code || ''}"`;
      const credits = course.credits || 0;
      const semester = `"${course.semester || ''}"`;
      const enrolled = course.enrolledStudents || 0;
      
      csvContent += `${name},${code},${credits},${semester},${enrolled}\n`;
    });

    csvContent += '\n\nSummary\n';
    csvContent += `Total Courses,${courses.length}\n`;
    csvContent += `Exported On,${new Date().toLocaleString()}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `courses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Courses CSV exported successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">CampuSync</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.profile?.name || user?.email}</span>
            <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">My Courses</h2>
          <div className="flex gap-2">
            {!loading && courses && courses.length > 0 && (
              <button
                onClick={handleExportCourses}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                📥 Export
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + New Course
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Courses List */}
        {!loading && (!courses || courses.length === 0) ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600 mb-4">No courses created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(courses) && courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{course.code}</p>
                    {course.description && (
                      <p className="text-gray-700 mt-2">{course.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <span>📚 {course.credits} Credits</span>
                      <span>👥 {course.enrolledStudents || 0} Students</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartSession(course.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                    >
                      📍 Start Session
                    </button>
                    <button
                      onClick={() => navigate(`/professor/analytics/${course.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      📊 Analytics
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Data Structures"
                />
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., CS201"
                />
              </div>

              {/* Credits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Course description"
                  rows="3"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Course
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
