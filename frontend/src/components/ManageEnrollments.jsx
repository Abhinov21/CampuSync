import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ManageEnrollments({ courseId, courseName, onClose, onUpdate }) {
  const [allStudents, setAllStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('add'); // 'add' or 'enrolled'

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all students
      const studentsRes = await api.get('/api/courses/admin/students-list');
      setAllStudents(studentsRes.data.students || []);

      // Fetch enrolled students for this course
      const enrolledRes = await api.get(`/api/courses/${courseId}/students`);
      setEnrolledStudents(enrolledRes.data.students || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const enrolledStudentIds = new Set(enrolledStudents.map((s) => s.id));

  const availableStudents = allStudents.filter(
    (student) => !enrolledStudentIds.has(student.id)
  );

  const filteredAvailable = availableStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnrolled = enrolledStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleEnrollStudents = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      const enrollmentPromises = Array.from(selectedStudents).map((studentId) =>
        api.post(`/api/courses/${courseId}/enroll`, { studentId })
      );

      await Promise.all(enrollmentPromises);

      const count = selectedStudents.size;
      toast.success(`${count} student(s) enrolled successfully`);

      setSelectedStudents(new Set());
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error enrolling students:', error);
      toast.error('Failed to enroll students');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await api.delete(`/api/courses/${courseId}/students/${studentId}`);
      toast.success('Student removed from course');
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredAvailable.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredAvailable.map((s) => s.id)));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Course Enrollments</h2>
            <p className="text-blue-100 mt-1">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-4">
          <button
            onClick={() => {
              setTab('add');
              setSearchTerm('');
              setSelectedStudents(new Set());
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              tab === 'add'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Add Students ({availableStudents.length})
          </button>
          <button
            onClick={() => {
              setTab('enrolled');
              setSearchTerm('');
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              tab === 'enrolled'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Enrolled Students ({enrolledStudents.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by name, roll number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
          />

          {tab === 'add' ? (
            <div>
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-semibold mb-2">No students available</p>
                  <p className="text-sm">
                    {searchTerm
                      ? 'No students match your search'
                      : 'All registered students are already enrolled in this course'}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Select All Checkbox */}
                  <div className="mb-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === filteredAvailable.length && filteredAvailable.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-sm font-semibold text-gray-700 cursor-pointer flex-1">
                      Select All ({filteredAvailable.length})
                    </label>
                    <span className="text-sm text-blue-600 font-semibold">
                      {selectedStudents.size} selected
                    </span>
                  </div>

                  {/* Student List */}
                  <div className="space-y-2">
                    {filteredAvailable.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">
                            {student.rollNumber} • {student.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.department} • Year {student.year}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {student.enrolledCourses} courses
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {filteredEnrolled.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-semibold mb-2">No enrolled students</p>
                  <p className="text-sm">
                    {searchTerm
                      ? 'No students match your search'
                      : 'No students are currently enrolled in this course'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEnrolled.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-red-50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">
                          {student.rollNumber} • {student.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.department} • Year {student.year}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100 px-3 py-2 rounded transition font-semibold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
          >
            Close
          </button>
          {tab === 'add' && (
            <button
              onClick={handleEnrollStudents}
              disabled={selectedStudents.size === 0}
              className={`px-4 py-2 rounded-lg transition font-semibold text-white ${
                selectedStudents.size === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Enroll {selectedStudents.size > 0 ? `(${selectedStudents.size})` : 'Students'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
