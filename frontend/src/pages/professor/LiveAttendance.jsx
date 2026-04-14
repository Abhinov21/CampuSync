import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import StudentAttendanceCard from '../../components/StudentAttendanceCard';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';

export default function ProfessorLiveAttendance() {
  const { user, logout } = useAuth();
  const [currentSession, setCurrentSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('LOADING'); // LOADING, ACTIVE, ENDED

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Connecting to WebSocket...');
    const newSocket = io(import.meta.env.VITE_API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 WebSocket disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user]);

  // Fetch active session and join room
  useEffect(() => {
    if (!socket || !user) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching active session for professor...');
        
        const response = await api.get('/api/sessions/active');
        console.log('Active session response:', response.data);

        if (response.data?.data) {
          const session = response.data.data;
          console.log('✅ Active session found:', session);
          setCurrentSession(session);
          setSessionStatus('ACTIVE');

          // Join WebSocket room for this session
          if (socket && socket.connected) {
            socket.emit('join-session', session.id);
            console.log(`📍 Joined session room: ${session.id}`);
          }
        } else {
          console.log('ℹ️ No active session found');
          setCurrentSession(null);
          setSessionStatus('NO_SESSION');
        }
      } catch (err) {
        console.error('❌ Error fetching session:', err.response?.status, err.response?.data || err.message);
        setError('Failed to load session. No active session found.');
        setSessionStatus('NO_SESSION');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [socket, user]);

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket || !currentSession) return;

    // Student joined
    socket.on('session-event', (data) => {
      if (data.type === 'student-joined') {
        console.log('📢 Student joined:', data.data.student?.name || data.data.studentName);
        setStudents((prev) => {
          const exists = prev.some((s) => s.attendanceSessionId === data.data.attendanceSessionId);
          if (exists) {
            return prev.map((s) =>
              s.attendanceSessionId === data.data.attendanceSessionId
                ? { ...s, ...data.data, lastUpdate: new Date() }
                : s
            );
          }
          return [...prev, { ...data.data, lastUpdate: new Date() }];
        });
      } else if (data.type === 'duration-update') {
        console.log('⏱️ Duration update for student:', data.data.studentId);
        setStudents((prev) =>
          prev.map((s) =>
            s.studentId === data.data.studentId
              ? {
                  ...s,
                  totalDurationSeconds: data.data.totalDurationSeconds,
                  lastUpdate: new Date(),
                }
              : s
          )
        );
      }
    });

    // Session ended
    socket.on('session-ended', (data) => {
      console.log('🔴 Session ended');
      setSessionStatus('ENDED');
    });

    return () => {
      socket.off('session-event');
      socket.off('session-ended');
    };
  }, [socket, currentSession]);

  // Handle ending the session
  const handleEndSession = async () => {
    if (!currentSession?.id) {
      alert('Session ID not found');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to end this session? This action cannot be undone.');
    if (!confirmed) return;

    try {
      console.log('🛑 Ending session:', currentSession.id);
      const response = await api.patch(`/api/sessions/${currentSession.id}/end`);
      console.log('✅ Session ended successfully:', response.data);
      setSessionStatus('ENDED');
      alert('Session ended successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/professor/courses';
      }, 2000);
    } catch (err) {
      console.error('❌ Error ending session:', err.response?.data || err.message);
      alert(`Error ending session: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">CampuSync</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.profile?.name || user?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Live Attendance</h2>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* No Session State */}
        {!loading && sessionStatus === 'NO_SESSION' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-800 text-lg">No active session. Start a class session to view live attendance.</p>
          </div>
        )}

        {/* Session Header */}
        {currentSession && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Session</h3>
              </div>
              <button
                onClick={handleEndSession}
                disabled={sessionStatus !== 'ACTIVE'}
                className={`px-4 py-2 rounded font-medium text-white transition ${
                  sessionStatus === 'ACTIVE'
                    ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                🛑 End Session
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Course</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSession.course?.name || currentSession.courseName || 'Course'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Start Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(currentSession.scheduledStartTime).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      sessionStatus === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : sessionStatus === 'ENDED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {sessionStatus === 'ACTIVE' ? '🟢 Active' : sessionStatus === 'ENDED' ? '🔴 Ended' : '⚪ Loading'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSession.roomNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {!loading && sessionStatus !== 'NO_SESSION' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-3xl font-bold text-green-600">{students.length}</p>
              <p className="text-xs text-gray-500 mt-1">Students checked in</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Enrolled</p>
              <p className="text-3xl font-bold text-blue-600">
                {currentSession?.enrolledStudents || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total students in class</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-3xl font-bold text-red-600">
                {Math.max(0, (currentSession?.enrolledStudents || 0) - students.length)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Students not present</p>
            </div>
          </div>
        )}

        {/* Students Grid */}
        {!loading && students.length === 0 && sessionStatus !== 'NO_SESSION' && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-600">Waiting for students to join...</p>
          </div>
        )}

        {!loading && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <StudentAttendanceCard key={student.id || student.attendanceSessionId} student={student} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
