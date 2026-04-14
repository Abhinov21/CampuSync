import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentCourses from './pages/student/Courses';

// Professor Pages
import ProfessorCourses from './pages/professor/Courses';
import ProfessorLiveAttendance from './pages/professor/LiveAttendance';
import ProfessorAnalytics from './pages/professor/Analytics';

// Admin Pages
import AdminMQTTMonitor from './pages/admin/MQTTMonitor';
import AdminActiveSessions from './pages/admin/ActiveSessions';
import AdminAnomalies from './pages/admin/Anomalies';
import AdminDevices from './pages/admin/Devices';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentCourses />
              </ProtectedRoute>
            }
          />

          {/* Professor Routes */}
          <Route
            path="/professor/courses"
            element={
              <ProtectedRoute requiredRole="PROFESSOR">
                <ProfessorCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professor/live-attendance"
            element={
              <ProtectedRoute requiredRole="PROFESSOR">
                <ProfessorLiveAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professor/analytics/:courseId"
            element={
              <ProtectedRoute requiredRole="PROFESSOR">
                <ProfessorAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/mqtt-monitor"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminMQTTMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminActiveSessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/anomalies"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminAnomalies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDevices />
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}
