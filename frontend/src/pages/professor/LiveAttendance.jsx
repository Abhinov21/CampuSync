import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import StudentAttendanceCard from '../../components/StudentAttendanceCard';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { diagnoseAuth, fixAuth, verifyPermission } from '../../utils/authDiagnostics';

export default function ProfessorLiveAttendance() {
  const { user, logout } = useAuth();
  const [currentSession, setCurrentSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsDetails, setStudentsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('LOADING'); // LOADING, ACTIVE, ENDED
  const [showManualMarking, setShowManualMarking] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [markingInProgress, setMarkingInProgress] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const isInitialLoadRef = useRef(true);
  const hasShownErrorRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const sessionStartTimeRef = useRef(null);

  // Handle logout with proper cleanup
  const handleLogout = () => {
    isLoggingOutRef.current = true;
    if (socket) {
      socket.disconnect();
    }
    logout();
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return;
    }

    console.log('🔌 Connecting to WebSocket with authentication...');
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: token  // Send JWT token for authentication
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      toast.success('Real-time connection established');
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 WebSocket disconnected');
      // Only show disconnect toast if not intentional logout
      if (!isLoggingOutRef.current) {
        toast.error('Connection lost - reconnecting...');
      }
    });

    newSocket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      toast.error('Connection error - please refresh if issues persist');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user]);

  // Track if we've already joined the session
  const joinedSessionIdRef = useRef(null);

  // Fetch enrolled students for manual marking
  useEffect(() => {
    if (!currentSession?.id) return;

    const fetchEnrolledStudents = async () => {
      try {
        const response = await api.get(`/api/sessions/${currentSession.id}/enrolled-students`);
        if (response.data?.data?.students) {
          setEnrolledStudents(response.data.data.students);
        }
      } catch (err) {
        console.error('Failed to fetch enrolled students:', err);
      }
    };

    fetchEnrolledStudents();
    // Refresh every 10 seconds to get updates
    const interval = setInterval(fetchEnrolledStudents, 10000);
    return () => clearInterval(interval);
  }, [currentSession?.id]);

  // Handle manual attendance marking
  const handleMarkAttendance = async (studentId, isPresent) => {
    if (markingInProgress) return;
    
    setMarkingInProgress(true);
    try {
      const response = await api.post(`/api/sessions/${currentSession.id}/mark-attendance`, {
        studentId,
        isPresent,
      });

      if (response.status === 200) {
        toast.success(`Student marked as ${isPresent ? 'present' : 'absent'}`);
        
        // Update enrolled students list
        setEnrolledStudents(prev =>
          prev.map(s =>
            s.studentId === studentId
              ? { ...s, isPresent }
              : s
          )
        );

        // Also refresh the live attendance list
        const currentResponse = await api.get('/api/sessions/active');
        if (currentResponse.data?.data) {
          setCurrentSession(currentResponse.data.data);
        }
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
      toast.error(`Failed to mark attendance: ${err.response?.data?.message || err.message}`);
    } finally {
      setMarkingInProgress(false);
    }
  };

  // Fetch active session and join room
  useEffect(() => {
    if (!socket || !user) return;

    const fetchSession = async () => {
      // Only show loading on initial load, not on interval refreshes
      const isInitialLoad = isInitialLoadRef.current;
      if (isInitialLoad) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }

      try {
        const response = await api.get('/api/sessions/active');

        if (response.data?.data) {
          const session = response.data.data;
          setCurrentSession(session);
          setSessionStatus('ACTIVE');
          setError(null); // Clear any previous errors on success
          hasShownErrorRef.current = false;
          // Store session start time for duration calculation
          if (!sessionStartTimeRef.current) {
            sessionStartTimeRef.current = new Date(session.sessionStartTime);
          }

          // Join WebSocket room for this session - ONLY if we haven't joined yet
          if (socket && socket.connected && joinedSessionIdRef.current !== session.id) {
            socket.emit('join-session', { sessionId: session.id });
            joinedSessionIdRef.current = session.id;
          }
        } else {
          // Only set as NO_SESSION if we had no session before
          if (!currentSession) {
            setCurrentSession(null);
            setSessionStatus('NO_SESSION');
            joinedSessionIdRef.current = null;
            if (!hasShownErrorRef.current) {
              setError('Failed to load session. No active session found.');
              hasShownErrorRef.current = true;
            }
          }
        }
      } catch (err) {
        // Silent error handling on interval refreshes
        if (isInitialLoad) {
          setError('Failed to load session. No active session found.');
          setSessionStatus('NO_SESSION');
          joinedSessionIdRef.current = null;
          if (!hasShownErrorRef.current) {
            toast.error('No active session found. Start a session to begin.');
            hasShownErrorRef.current = true;
          }
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    // Set interval to refresh session data every 5 seconds to update counts
    const interval = setInterval(fetchSession, 5000);
    return () => {
      clearInterval(interval);
      joinedSessionIdRef.current = null;
    };
  }, [socket, user]);

  // Update session duration timer every second
  useEffect(() => {
    if (sessionStatus !== 'ACTIVE' || !sessionStartTimeRef.current) return;

    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - sessionStartTimeRef.current) / 1000);
      setSessionDuration(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStatus]);

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket || !currentSession) return;

    // Student joined
    socket.on('session-event', (data) => {
      if (data.type === 'student-joined') {
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

    // VERIFICATION: Verify permission before attempting to end
    const permission = verifyPermission('PROFESSOR');
    if (!permission.allowed) {
      console.error('❌ PERMISSION DENIED:', permission.reason);
      alert(`⚠️ Permission denied: ${permission.reason}\n\nDiagnosing authentication...`);
      
      // Run diagnostics
      const diag = await diagnoseAuth();
      
      // Offer to fix authentication
      if (diag.issues?.length > 0) {
        const fixAuth = window.confirm(
          `Authentication issues detected:\n${diag.issues.join('\n')}\n\nWould you like to log out and log back in?`
        );
        if (fixAuth) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      return;
    }

    const confirmed = window.confirm('Are you sure you want to end this session? This action cannot be undone.');
    if (!confirmed) return;

    try {
      console.log('🛑 Ending session:', currentSession.id);
      console.log('🔍 DEBUG: Current session object:', currentSession);
      console.log('🔍 DEBUG: User role verification:', user?.role);
      console.log('🔍 DEBUG: Permission verified: PROFESSOR');
      
      const response = await api.patch(`/api/sessions/${currentSession.id}/end`);
      console.log('✅ Session ended successfully:', response.data);
      setSessionStatus('ENDED');
      alert('Session ended successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/professor/courses';
      }, 2000);
    } catch (err) {
      console.error('❌ Error ending session');
      
      // Log detailed error info
      const errorData = err.response?.data || {};
      console.error('  Status:', err.response?.status);
      console.error('  Message:', errorData.message);
      console.error('  Token role:', errorData.userRole);
      console.error('  Required roles:', errorData.requiredRoles);
      
      // If 403, suggest re-authentication
      if (err.response?.status === 403) {
        const shouldDiagnose = window.confirm(
          `Authorization failed (403): ${errorData.message}\n\nToken role: "${errorData.userRole}" requires: "${errorData.requiredRoles?.[0]}"\n\nWould you like to diagnose this issue?`
        );
        if (shouldDiagnose) {
          diagnoseAuth();
        }
      } else {
        alert(`Error ending session: ${errorData.message || err.message}`);
      }
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
              onClick={handleLogout}
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
              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualMarking(!showManualMarking)}
                  className={`px-4 py-2 rounded font-medium transition ${
                    showManualMarking
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {showManualMarking ? '📋 Hide Manual Marking' : '📋 Manual Marking'}
                </button>
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
                  {new Date(currentSession.sessionStartTime).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.floor(sessionDuration / 3600)}h {Math.floor((sessionDuration % 3600) / 60)}m {sessionDuration % 60}s
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
            <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">PRESENT</p>
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <p className="text-4xl font-bold text-green-600">{currentSession?.presentCount || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Students checked in</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">ENROLLED</p>
                <span className="text-blue-600 text-xl">👥</span>
              </div>
              <p className="text-4xl font-bold text-blue-600">{currentSession?.enrolledCount || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Total registered students</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">ABSENT</p>
                <span className="text-red-600 text-xl">✗</span>
              </div>
              <p className="text-4xl font-bold text-red-600">{currentSession?.absentCount || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Not yet checked in</p>
            </div>
          </div>
        )}

        {/* Students Grid */}
        {!loading && students.length === 0 && sessionStatus !== 'NO_SESSION' && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">⏳ Waiting for students to join...</p>
            <p className="text-gray-500 text-sm mt-2">Students will appear here once they check in</p>
          </div>
        )}

        {!loading && students.length > 0 && !showManualMarking && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  PRESENT STUDENTS ({students.length})
                </span>
              </h3>
              <p className="text-gray-600 text-sm mt-2">Students currently checked in to this session</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <StudentAttendanceCard key={student.id || student.attendanceSessionId} student={student} />
              ))}
            </div>
          </div>
        )}

        {/* Manual Attendance Marking Section */}
        {showManualMarking && enrolledStudents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Attendance Marking</h3>
            <p className="text-gray-600 text-sm mb-6">
              Click on each student to mark them as present or absent. Changes will be reflected immediately.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledStudents.map((student) => (
                <div
                  key={student.studentId}
                  className={`p-4 rounded-lg border-2 transition ${
                    student.isPresent
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{student.fullName}</p>
                      <p className="text-sm text-gray-600">{student.rollNumber}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                      {student.duration > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Duration: {Math.floor(student.duration / 60)} min
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkAttendance(student.studentId, true)}
                        disabled={markingInProgress}
                        className={`px-3 py-2 rounded text-sm font-medium transition ${
                          student.isPresent
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        } ${markingInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        ✓ Present
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(student.studentId, false)}
                        disabled={markingInProgress}
                        className={`px-3 py-2 rounded text-sm font-medium transition ${
                          !student.isPresent
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        } ${markingInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        ✗ Absent
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Summary:</strong> {enrolledStudents.filter(s => s.isPresent).length} of{' '}
                {enrolledStudents.length} students marked as present
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
