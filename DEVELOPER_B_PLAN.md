# 🎨 DEVELOPER B: Frontend Implementation Plan

**Role:** Frontend Engineer  
**Focus:** React UI, Dashboards, Real-Time Updates  
**Duration:** 6 days (24 hours)  
**Git Branch:** `dev/frontend/dashboards`

---

## Table of Contents

1. [Pre-Development Coordination](#pre-development-coordination)
2. [Day 1: React Setup & Foundation](#day-1-react-setup--foundation)
3. [Day 2: Student Dashboard](#day-2-student-dashboard)
4. [Day 3: Professor Dashboard - Live View](#day-3-professor-dashboard---live-view)
5. [Day 4: Admin Dashboard](#day-4-admin-dashboard)
6. [Day 5: Charts & Analytics](#day-5-charts--analytics)
7. [Day 6: Polish & Integration Testing](#day-6-polish--integration-testing)
8. [Integration Points](#integration-points)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Development Coordination

### ⚠️ WAIT FOR COORDINATION PHASE (30 min)

**Before starting Day 1, complete with Developer A:**

- [ ] Both clone repository
- [ ] Both create `.env` file
- [ ] Both review and approve API contract
- [ ] Both agree on WebSocket event format
- [ ] Both create separate git branches

**Your checklist:**
- [ ] Read COMPLETE_ROADMAP.md → Phase 3 section
- [ ] Ensure `.env` configured with:
  - VITE_API_URL=http://localhost:5000
- [ ] Understand test credentials from Dev A
- [ ] Agree on API response formats

---

## Day 1: React Setup & Foundation (3 hours)

### Task B1.1: Create React Project (1 hour)

**Objective:** Initialize React app with all dependencies

**What you'll do:**

1. Create Vite React app:
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   ```

2. Install all dependencies:
   ```bash
   npm install react-router-dom axios zustand socket.io-client recharts react-hot-toast
   npm install -D tailwindcss postcss autoprefixer
   ```

3. Setup Tailwind CSS:
   ```bash
   npx tailwindcss init -p
   ```

4. Update `frontend/src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

5. Test app runs:
   ```bash
   npm run dev
   # Should see: Local: http://localhost:5173/
   ```

**Files Created:**
- `frontend/` folder structure
- `frontend/package.json` (with dependencies)
- `frontend/.env` (environment config)
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`

**Environment File (.env):**
```
VITE_API_URL=http://localhost:5000
```

**Checklist:**
- [ ] Vite React app created
- [ ] All npm packages installed
- [ ] TailwindCSS configured
- [ ] App runs on localhost:5173
- [ ] No build errors

**Commit:**
```bash
cd frontend
git add .
git commit -m "feat: Initialize React project with Vite and Tailwind"
```

**Time Check:** Should take ~1 hour. If slower, check npm install.

---

### Task B1.2: Project Structure & Zustand Store (1 hour)

**Objective:** Organization and state management

**What you'll do:**

1. Create folder structure:
   ```
   frontend/src/
   ├── pages/
   │   ├── student/
   │   │   ├── Dashboard.jsx
   │   │   ├── Attendance.jsx
   │   │   └── Courses.jsx
   │   ├── professor/
   │   │   ├── Courses.jsx
   │   │   ├── LiveAttendance.jsx
   │   │   └── Analytics.jsx
   │   └── admin/
   │       ├── MQTTMonitor.jsx
   │       ├── ActiveSessions.jsx
   │       ├── Anomalies.jsx
   │       └── Devices.jsx
   ├── components/
   │   ├── SessionCard.jsx
   │   ├── StudentCard.jsx
   │   ├── Navigation.jsx
   │   └── charts/
   │       ├── AttendanceTrendChart.jsx
   │       └── ...
   ├── store/
   │   ├── attendanceStore.js
   │   ├── authStore.js
   │   └── websocketStore.js
   ├── hooks/
   │   ├── useAuth.js
   │   ├── useAttendance.js
   │   └── useWebSocket.js
   ├── utils/
   │   ├── api.js
   │   └── formatters.js
   ├── App.jsx
   └── main.jsx
   ```

2. Create `frontend/src/utils/api.js`:
   ```javascript
   import axios from 'axios';

   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
     timeout: 10000,
   });

   // Add token to requests
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('authToken');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   export default api;
   ```

3. Create `frontend/src/store/authStore.js` (Zustand):
   ```javascript
   import { create } from 'zustand';

   export const useAuthStore = create((set) => ({
     user: null,
     token: localStorage.getItem('authToken') || null,
     isAuthenticated: !!localStorage.getItem('authToken'),

     setUser: (user) => set({ user }),
     setToken: (token) => {
       localStorage.setItem('authToken', token);
       set({ token, isAuthenticated: !!token });
     },
     logout: () => {
       localStorage.removeItem('authToken');
       set({ user: null, token: null, isAuthenticated: false });
     },
   }));
   ```

4. Create `frontend/src/store/attendanceStore.js` (Zustand):
   ```javascript
   import { create } from 'zustand';

   export const useAttendanceStore = create((set) => ({
     currentSession: null,
     activeSessions: [],
     allSessions: [],

     setCurrentSession: (session) => set({ currentSession: session }),
     setActiveSessions: (sessions) => set({ activeSessions: sessions }),
     setAllSessions: (sessions) => set({ allSessions: sessions }),
   }));
   ```

5. Create `frontend/src/hooks/useAuth.js`:
   ```javascript
   import { useAuthStore } from '../store/authStore';
   import api from '../utils/api';

   export const useAuth = () => {
     const { user, token, setUser, setToken, logout } = useAuthStore();

     const login = async (email, password) => {
       const response = await api.post('/auth/login', { email, password });
       setToken(response.data.token);
       setUser(response.data.user);
       return response.data;
     };

     const register = async (data) => {
       const response = await api.post('/auth/register', data);
       setToken(response.data.token);
       setUser(response.data.user);
       return response.data;
     };

     return { user, token, login, register, logout };
   };
   ```

**Files to Create:**
- `frontend/src/utils/api.js` (~50 lines)
- `frontend/src/store/authStore.js` (~50 lines)
- `frontend/src/store/attendanceStore.js` (~50 lines)
- `frontend/src/hooks/useAuth.js` (~50 lines)

**Checklist:**
- [ ] All folders created
- [ ] API client configured
- [ ] Auth store working
- [ ] Attendance store working
- [ ] Hooks created

**Commit:**
```bash
git add frontend/src/
git commit -m "feat: Project structure with Zustand stores and API client"
```

**Time Check:** 1 hour

---

### Task B1.3: Authentication Pages & Routing (1 hour)

**Objective:** Login/Register and app routing

**What you'll do:**

1. Create `frontend/src/pages/auth/Login.jsx`:
   ```javascript
   import { useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { useAuth } from '../../hooks/useAuth';
   import toast from 'react-hot-toast';

   export default function Login() {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const { login } = useAuth();
     const navigate = useNavigate();

     const handleSubmit = async (e) => {
       e.preventDefault();
       try {
         const data = await login(email, password);
         toast.success('Login successful!');
         // Redirect based on role
         if (data.user.role === 'STUDENT') navigate('/student/dashboard');
         if (data.user.role === 'PROFESSOR') navigate('/professor/courses');
         if (data.user.role === 'ADMIN') navigate('/admin/mqtt-monitor');
       } catch (error) {
         toast.error(error.response?.data?.error || 'Login failed');
       }
     };

     return (
       <div className="flex items-center justify-center min-h-screen bg-gray-100">
         <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg max-w-md w-full">
           <h1 className="text-2xl font-bold mb-6">CampuSync Login</h1>
           <input
             type="email"
             placeholder="Email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className="w-full mb-4 p-2 border rounded"
             required
           />
           <input
             type="password"
             placeholder="Password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             className="w-full mb-6 p-2 border rounded"
             required
           />
           <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded font-semibold hover:bg-blue-600">
             Login
           </button>
         </form>
       </div>
     );
   }
   ```

2. Create `frontend/src/App.jsx`:
   ```javascript
   import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
   import { useAuthStore } from './store/authStore';
   import Login from './pages/auth/Login';
   import StudentDashboard from './pages/student/Dashboard';
   import ProfessorCourses from './pages/professor/Courses';
   import AdminMonitor from './pages/admin/MQTTMonitor';

   function ProtectedRoute({ children, requiredRole }) {
     const { isAuthenticated, user } = useAuthStore();
     if (!isAuthenticated) return <Navigate to="/login" />;
     if (requiredRole && user?.role !== requiredRole) {
       return <Navigate to="/login" />;
     }
     return children;
   }

   export default function App() {
     return (
       <Router>
         <Routes>
           <Route path="/login" element={<Login />} />
           <Route path="/student/dashboard" element={
             <ProtectedRoute requiredRole="STUDENT">
               <StudentDashboard />
             </ProtectedRoute>
           } />
           <Route path="/professor/courses" element={
             <ProtectedRoute requiredRole="PROFESSOR">
               <ProfessorCourses />
             </ProtectedRoute>
           } />
           <Route path="/admin/mqtt-monitor" element={
             <ProtectedRoute requiredRole="ADMIN">
               <AdminMonitor />
             </ProtectedRoute>
           } />
           <Route path="*" element={<Navigate to="/login" />} />
         </Routes>
       </Router>
     );
   }
   ```

3. Create `frontend/src/main.jsx` (if not exists):
   ```javascript
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App.jsx'
   import './index.css'

   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>,
   )
   ```

**Files to Create:**
- `frontend/src/pages/auth/Login.jsx` (~70 lines)
- `frontend/src/App.jsx` (~50 lines)
- `frontend/src/main.jsx` (~15 lines)

**Checklist:**
- [ ] Login page renders
- [ ] Form submission works
- [ ] API calls on login
- [ ] Token stored in localStorage
- [ ] Protected routes working
- [ ] Role-based routing
- [ ] No console errors

**Test:**
```bash
# Use Dev A's test credentials
Email: student1@campusync.com
Password: student123
```

**Commit:**
```bash
git add frontend/src/pages/auth/ frontend/src/App.jsx frontend/src/main.jsx
git commit -m "feat: Authentication pages and protected routing"
```

**Message to Dev A:**
```
Frontend authentication ready! You can now:
1. Start your backend
2. I'll test login with your seed user credentials
3. Once verified, I'll continue with dashboards

Expected seed users:
- student1@campusync.com / student123
- prof1@campusync.com / prof123
- admin@campusync.com / admin123
```

**Time Check:** 1 hour

---

## Day 2: Student Dashboard (5 hours)

### Task B2.1: Current Session Display (2.5 hours)

**Objective:** Show real-time student session info

**What you'll do:**

1. Create `frontend/src/pages/student/Dashboard.jsx`:
   ```javascript
   import { useEffect, useState } from 'react';
   import api from '../../utils/api';
   import { useAttendanceStore } from '../../store/attendanceStore';
   import SessionCard from '../../components/SessionCard';
   import DurationDisplay from '../../components/DurationDisplay';
   import toast from 'react-hot-toast';

   export default function StudentDashboard() {
     const [session, setSession] = useState(null);
     const [stats, setStats] = useState(null);
     const [loading, setLoading] = useState(true);
     const { currentSession, setCurrentSession } = useAttendanceStore();

     useEffect(() => {
       fetchCurrentSession();
       const interval = setInterval(fetchCurrentSession, 5000); // Poll every 5s
       return () => clearInterval(interval);
     }, []);

     const fetchCurrentSession = async () => {
       try {
         const response = await api.get('/api/attendance/current');
         setCurrentSession(response.data.session);
         setSession(response.data.session);
       } catch (error) {
         // No active session is OK
       } finally {
         setLoading(false);
       }
     };

     if (loading) return <div className="p-8">Loading...</div>;

     return (
       <div className="p-8 max-w-4xl mx-auto">
         <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

         {session ? (
           <SessionCard session={session}>
             <DurationDisplay durationSeconds={session.totalDurationSeconds} isLive={true} />
           </SessionCard>
         ) : (
           <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
             <p className="text-yellow-800">No active session right now</p>
           </div>
         )}

         {/* Today's Stats */}
         <div className="grid grid-cols-2 gap-4 mt-8">
           <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
             <p className="text-sm text-gray-600">Classes Attended</p>
             <p className="text-3xl font-bold text-blue-600">3</p>
           </div>
           <div className="bg-green-50 p-6 rounded-lg border border-green-200">
             <p className="text-sm text-gray-600">Today's Attendance</p>
             <p className="text-3xl font-bold text-green-600">85%</p>
           </div>
         </div>
       </div>
     );
   }
   ```

2. Create `frontend/src/components/SessionCard.jsx`:
   ```javascript
   export default function SessionCard({ session, children }) {
     return (
       <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-lg">
         <h2 className="text-2xl font-bold mb-4">{session?.session?.course?.name || 'Session'}</h2>
         <div className="text-6xl font-mono mb-6">
           {children}
         </div>
         <p className="text-blue-100">
           Joined at {new Date(session?.sessionStartTime).toLocaleTimeString()}
         </p>
       </div>
     );
   }
   ```

3. Create `frontend/src/components/DurationDisplay.jsx`:
   ```javascript
   import { useState, useEffect } from 'react';

   export default function DurationDisplay({ durationSeconds, isLive }) {
     const [display, setDisplay] = useState(durationSeconds || 0);

     useEffect(() => {
       if (!isLive) return setDisplay(durationSeconds);

       const interval = setInterval(() => {
         setDisplay(prev => prev + 1);
       }, 1000);

       return () => clearInterval(interval);
     }, [isLive, durationSeconds]);

     const minutes = Math.floor(display / 60);
     const seconds = display % 60;

     return (
       <div className="font-mono">
         {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
       </div>
     );
   }
   ```

**Files to Create:**
- `frontend/src/pages/student/Dashboard.jsx` (~80 lines)
- `frontend/src/components/SessionCard.jsx` (~30 lines)
- `frontend/src/components/DurationDisplay.jsx` (~40 lines)

**Features:**
- [ ] Current session displayed
- [ ] Duration counts up in real-time
- [ ] Polls API every 5 seconds
- [ ] Shows stats cards
- [ ] Responsive layout

**Checklist:**
- [ ] Page loads without errors
- [ ] API call works
- [ ] Duration counter runs
- [ ] Responsive design
- [ ] Loading state shown

**Commit:**
```bash
git add frontend/src/pages/student/ frontend/src/components/SessionCard.jsx frontend/src/components/DurationDisplay.jsx
git commit -m "feat: Student dashboard with current session display"
```

**Time Check:** 2.5 hours

---

### Task B2.2: Attendance History & Courses (2.5 hours)

**Objective:** Show past sessions and course attendance

**What you'll do:**

1. Create `frontend/src/pages/student/Attendance.jsx`:
   - API: `GET /api/attendance/history`
   - Display list of past sessions
   - Filter by course
   - Show duration per session

2. Create `frontend/src/pages/student/Courses.jsx`:
   - API: `GET /api/courses`
   - List enrolled courses
   - Show attendance % per course
   - Course cards with details

3. Create `frontend/src/components/CoursCard.jsx`:
   - Course name, code
   - Attendance percentage (progress bar)
   - Sessions attended / total

4. Update `frontend/src/App.jsx` routing:
   ```javascript
   <Route path="/student/attendance" element={...} />
   <Route path="/student/courses" element={...} />
   ```

5. Create Navigation component:
   ```javascript
   // frontend/src/components/Navigation.jsx
   export default function Navigation({ role }) {
     return (
       <nav className="bg-gray-800 text-white p-4">
         {role === 'STUDENT' && (
           <>
             <button onClick={() => navigate('/student/dashboard')}>Dashboard</button>
             <button onClick={() => navigate('/student/attendance')}>Attendance</button>
             <button onClick={() => navigate('/student/courses')}>Courses</button>
           </>
         )}
       </nav>
     );
   }
   ```

**Files to Create:**
- `frontend/src/pages/student/Attendance.jsx` (~100 lines)
- `frontend/src/pages/student/Courses.jsx` (~100 lines)
- `frontend/src/components/CourseCard.jsx` (~50 lines)
- `frontend/src/components/Navigation.jsx` (~50 lines)

**Checklist:**
- [ ] History page displays past sessions
- [ ] Courses page shows enrolled courses
- [ ] Attendance % calculated
- [ ] Navigation between pages works
- [ ] Responsive layout

**Commit:**
```bash
git add frontend/src/pages/student/ frontend/src/components/CourseCard.jsx frontend/src/components/Navigation.jsx
git commit -m "feat: Student attendance history and courses pages"
```

**Time Check:** 2.5 hours

**Progress:** Student dashboard complete! ✅

---

## Day 3: Professor Dashboard - Live View (5 hours)

### Task B3.1: Live Attendance Board (3 hours)

**Objective:** Real-time list of students in class

**What you'll do:**

1. Create `frontend/src/pages/professor/LiveAttendance.jsx`:
   ```javascript
   import { useEffect, useState } from 'react';
   import io from 'socket.io-client';
   import api from '../../utils/api';
   import StudentAttendanceCard from '../../components/StudentAttendanceCard';

   export default function LiveAttendance() {
     const courseId = new URLSearchParams(window.location.search).get('courseId');
     const [students, setStudents] = useState([]);
     const [loading, setLoading] = useState(true);
     const socket = io(import.meta.env.VITE_API_URL);

     useEffect(() => {
       fetchLiveAttendance();
       socket.emit('join-session', courseId);
       socket.on('session-event', (event) => {
         if (event.type === 'student-joined') {
           setStudents(prev => [...prev, event.data]);
         }
         if (event.type === 'ping-update') {
           setStudents(prev => prev.map(s =>
             s.studentId === event.data.studentId
               ? { ...s, totalDurationSeconds: event.durationSeconds }
               : s
           ));
         }
       });

       return () => socket.disconnect();
     }, [courseId, socket]);

     const fetchLiveAttendance = async () => {
       try {
         const response = await api.get(`/api/attendance/course/${courseId}/live`);
         setStudents(response.data.sessions[0]?.attendanceSessions || []);
       } finally {
         setLoading(false);
       }
     };

     return (
       <div className="p-8">
         <h1 className="text-3xl font-bold mb-8">Live Attendance</h1>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {students.map(student => (
             <StudentAttendanceCard key={student.id} student={student} />
           ))}
         </div>
       </div>
     );
   }
   ```

2. Create `frontend/src/components/StudentAttendanceCard.jsx`:
   ```javascript
   import DurationDisplay from './DurationDisplay';

   export default function StudentAttendanceCard({ student }) {
     return (
       <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
         <h3 className="font-bold mb-2">{student.student?.name}</h3>
         <p className="text-sm text-gray-600 mb-4">{student.student?.rollNumber}</p>
         <div className="text-4xl font-mono mb-2">
           <DurationDisplay durationSeconds={student.totalDurationSeconds} isLive={true} />
         </div>
         <div className="flex items-center gap-2">
           <div className="h-3 w-3 bg-green-500 rounded-full"></div>
           <span className="text-sm text-gray-600">Present</span>
         </div>
       </div>
     );
   }
   ```

3. WebSocket Integration:
   - Join session room on load
   - Listen for `session-event`
   - Handle `student-joined`, `ping-update`, `session-ended`

**Files to Create:**
- `frontend/src/pages/professor/LiveAttendance.jsx` (~80 lines)
- `frontend/src/components/StudentAttendanceCard.jsx` (~50 lines)

**Features:**
- [ ] Real-time student list
- [ ] Duration updates from WebSocket
- [ ] Student details displayed
- [ ] Responsive grid layout
- [ ] Connection status shown

**Commit:**
```bash
git add frontend/src/pages/professor/LiveAttendance.jsx frontend/src/components/StudentAttendanceCard.jsx
git commit -m "feat: Professor live attendance dashboard with WebSocket"
```

**Time Check:** 3 hours

---

### Task B3.2: Course Management & Analytics (2 hours)

**Objective:** Create/manage courses and view stats

**What you'll do:**

1. Create `frontend/src/pages/professor/Courses.jsx`:
   - List my courses
   - Create course button
   - Start session button per course

2. Create `frontend/src/pages/professor/CreateCourse.jsx`:
   - Form: code, name, credits, schedule
   - POST to API

3. Create `frontend/src/pages/professor/Analytics.jsx`:
   - Charts placeholder (will do tomorrow)
   - Attendance stats
   - Export button

4. Add routes to App.jsx

**Files to Create:**
- `frontend/src/pages/professor/Courses.jsx` (~80 lines)
- `frontend/src/pages/professor/CreateCourse.jsx` (~100 lines)
- `frontend/src/pages/professor/Analytics.jsx` (~50 lines)

**Checklist:**
- [ ] Course listing works
- [ ] Create course form functional
- [ ] Start session button works
- [ ] Analytics page created
- [ ] Navigation wired

**Commit:**
```bash
git add frontend/src/pages/professor/
git commit -m "feat: Professor course management and analytics pages"
```

**Time Check:** 2 hours

**Progress:** Professor dashboard complete! ✅

---

## Day 4: Admin Dashboard (5 hours)

### Task B4.1: MQTT Monitor & Real-Time Event Stream (2.5 hours)

**Objective:** Display live MQTT events

**What you'll do:**

1. Create `frontend/src/pages/admin/MQTTMonitor.jsx`:
   - API: `GET /api/attendance/admin/mqtt-logs` (poll every 2s)
   - WebSocket: Listen for new MQTT events
   - Display as scrollable log
   - Timestamps, device ID, event type

2. Create `frontend/src/components/MQTTLogViewer.jsx`:
   - Scrollable log display
   - Color coding by event type
   - Filter options

**Files to Create:**
- `frontend/src/pages/admin/MQTTMonitor.jsx` (~100 lines)
- `frontend/src/components/MQTTLogViewer.jsx` (~80 lines)

**Features:**
- [ ] Real-time MQTT log stream
- [ ] Timestamps displayed
- [ ] Event type colored
- [ ] Autoscrolls to latest
- [ ] Responsive layout

**Commit:**
```bash
git add frontend/src/pages/admin/MQTTMonitor.jsx frontend/src/components/MQTTLogViewer.jsx
git commit -m "feat: Admin MQTT real-time monitor"
```

**Time Check:** 2.5 hours

---

### Task B4.2: Active Sessions & Anomalies (2.5 hours)

**Objective:** Global session and anomaly monitoring

**What you'll do:**

1. Create `frontend/src/pages/admin/ActiveSessions.jsx`:
   - Display all active sessions globally
   - Refresh every 5 seconds
   - Session counter badge

2. Create `frontend/src/pages/admin/Anomalies.jsx`:
   - Show all anomalies/alerts
   - Color code by severity (red=high, yellow=medium)
   - Sort by timestamp

3. Create `frontend/src/pages/admin/Devices.jsx`:
   - Device registry
   - Device status (active/inactive)
   - Battery level
   - Assign to student UI

**Files to Create:**
- `frontend/src/pages/admin/ActiveSessions.jsx` (~80 lines)
- `frontend/src/pages/admin/Anomalies.jsx` (~80 lines)
- `frontend/src/pages/admin/Devices.jsx` (~100 lines)
- `frontend/src/components/AnomalyAlert.jsx` (~50 lines)

**Checklist:**
- [ ] Sessions displayed
- [ ] Anomalies color-coded
- [ ] Severity badges shown
- [ ] Device registry works
- [ ] All pages responsive

**Commit:**
```bash
git add frontend/src/pages/admin/ frontend/src/components/AnomalyAlert.jsx
git commit -m "feat: Admin monitoring (sessions, anomalies, devices)"
```

**Time Check:** 2.5 hours

**Progress:** Admin dashboard complete! ✅

---

## Day 5: Charts & Analytics (4 hours)

### Task B5.1: Install Recharts & Create Chart Components (3.5 hours)

**Objective:** Visual analytics with professional charts

**What you'll do:**

1. Verify Recharts installed:
   ```bash
   npm ls recharts
   ```

2. Create 5 chart components in `frontend/src/components/charts/`:

   **AttendanceTrendChart.jsx:**
   - Line chart showing attendance % over time
   - Multi-course overlay option
   - Recharts ResponsiveContainer + LineChart

   **StudentBreakdownChart.jsx:**
   - Bar chart comparing students
   - X-axis: Student name, Y-axis: Sessions attended

   **DurationDistributionChart.jsx:**
   - Histogram of session durations
   - Bins: 0-30min, 30-60min, 60-90min, etc.

   **PresenceTimeline.jsx:**
   - Timeline visualization
   - X-axis: Time, Y-axis: Students
   - Color blocks showing presence

   **AttendanceDonutChart.jsx:**
   - Donut/pie chart
   - Present vs Absent percentages

3. Update `frontend/src/pages/professor/Analytics.jsx`:
   - Display all charts
   - Date range picker (optional for now - use hardcoded data)
   - CSV export button (stub for now)

4. Create `frontend/src/pages/admin/Analytics.jsx`:
   - System-wide charts
   - Global statistics

**Files to Create:**
- `frontend/src/components/charts/AttendanceTrendChart.jsx` (~80 lines)
- `frontend/src/components/charts/StudentBreakdownChart.jsx` (~80 lines)
- `frontend/src/components/charts/DurationDistributionChart.jsx` (~80 lines)
- `frontend/src/components/charts/PresenceTimeline.jsx` (~80 lines)
- `frontend/src/components/charts/AttendanceDonutChart.jsx` (~80 lines)

**Chart Data Example:**
```javascript
const mockData = [
  { date: '2026-04-01', attendance: 92 },
  { date: '2026-04-02', attendance: 88 },
  { date: '2026-04-03', attendance: 95 },
];
```

**Checklist:**
- [ ] All 5 chart types created
- [ ] Charts render correctly
- [ ] Recharts API used properly
- [ ] Responsive containers
- [ ] No console errors
- [ ] Charts look professional

**Commit:**
```bash
git add frontend/src/components/charts/ frontend/src/pages/professor/Analytics.jsx
git commit -m "feat: Analytics dashboards with 5 Recharts"
```

**Time Check:** 3.5 hours

---

### Task B5.2: Polish Analytics Pages (0.5 hours)

**Objective:** Make analytics pages production-ready

**What you'll do:**

1. Add date range filter (basic)
2. Add refresh button
3. Add export to CSV stub
4. Responsive grid for charts
5. Loading states

**Commit:**
```bash
git add frontend/src/pages/
git commit -m "feat: Analytics pages with date filters and export"
```

**Time Check:** 0.5 hours

**Progress:** Charts and analytics complete! ✅

---

## Day 6: Polish & Integration Testing (2 hours)

### Task B6.1: Error Handling & Loading States (0.5 hours)

**Objective:** Professional error experience

**What you'll do:**

1. Add loading spinners to all pages:
   ```javascript
   {loading && <div className="text-center p-8">Loading...</div>}
   ```

2. Add error boundaries:
   ```javascript
   try {
     // API call
   } catch (error) {
     toast.error(error.response?.data?.error || 'An error occurred');
   }
   ```

3. Use react-hot-toast for notifications:
   ```javascript
   import toast from 'react-hot-toast';
   toast.success('Session started!');
   toast.error('Failed to start session');
   ```

4. Handle WebSocket disconnection:
   ```javascript
   socket.on('disconnect', () => {
     toast.warning('Connection lost');
   });
   ```

**Checklist:**
- [ ] Loading states on all pages
- [ ] Error messages user-friendly
- [ ] Toast notifications working
- [ ] WebSocket reconnection handled

**Commit:**
```bash
git add -A
git commit -m "feat: Error handling and loading states"
```

**Time Check:** 0.5 hours

---

### Task B6.2: Responsive Design & Testing (1.5 hours)

**Objective:** Mobile-first responsive design

**What you'll do:**

1. Test on mobile (DevTools):
   - [ ] All pages responsive
   - [ ] No horizontal scrolling
   - [ ] Touch-friendly buttons (min 44px)
   - [ ] Font sizes readable
   - [ ] Spacing adequate

2. Test on tablet:
   - [ ] Grid layouts adjust
   - [ ] Navigation visible
   - [ ] Charts readable

3. Test on desktop:
   - [ ] Optimal layout
   - [ ] No wasted space

4. Test features:
   - [ ] Login works
   - [ ] Student dashboard displays
   - [ ] Real-time duration updates
   - [ ] Professor live view works
   - [ ] Charts display correctly
   - [ ] Admin dashboards functional

5. Test with backend:
   - [ ] All API calls succeed
   - [ ] WebSocket real-time updates
   - [ ] No 404 errors
   - [ ] No CORS issues

**Checklist:**
- [ ] Mobile responsive
- [ ] Tablet optimized
- [ ] Desktop polished
- [ ] All pages tested
- [ ] API integration verified
- [ ] WebSocket working
- [ ] No console errors

**Commit:**
```bash
git add -A
git commit -m "feat: Responsive design for mobile/tablet/desktop"
```

**Final Check:**
```bash
npm run dev
# Verify:
# ✅ App loads on localhost:5173
# ✅ Login works
# ✅ Dashboard displays
# ✅ No console errors
```

**Time Check:** 1.5 hours

**Progress:** Frontend complete! ✅

---

## Integration Points

### Waiting on Dev A

| Task | Blocked Until | Dev A Task |
|------|--------------|-----------|
| Login | Day 3 | A3.1 (auth endpoints) |
| Current Session | Day 4 | A3.1 (attendance endpoints) |
| Live Attendance | Day 5 | A4.1 (WebSocket) |
| Admin Monitor | Day 5 | A3.1 (admin endpoints) |

### Have Assumptions About Dev A

**Assumption 1: API Responses**
```javascript
// You assume this format from Dev A:
{
  "message": "Current session",
  "data": { /* actual data */ }
}
```

**Assumption 2: WebSocket Events**
```javascript
// You expect these socket events:
socket.on('session-event', {
  type: 'student-joined' | 'ping-update' | 'session-ended'
})
```

**If format differs, update immediately!**

---

## Testing Your Work

### Manual Test Checklist

**Day 1:**
```
npm run dev
✅ App loads on localhost:5173
✅ No build errors
✅ TailwindCSS working (colored text)
```

**Day 2:**
```
✅ Login page displays
✅ Dashboard page loads (after login)
✅ Duration counter runs
✅ Navigation works
```

**Day 3:**
```
✅ Live attendance page displays
✅ Student list shows
✅ (WebSocket not needed until Dev A ready)
```

**Day 4:**
```
✅ Admin MQTT monitor loads
✅ Anomalies page works
✅ Device registry displays
```

**Day 5:**
```
✅ Charts render correctly
✅ Multiple chart types working
✅ Responsive on mobile
```

**Day 6:**
```
✅ All error messages show
✅ Loading spinners work
✅ Mobile responsive
✅ No 404 errors
```

---

## Git Workflow

### Before Each Commit

```bash
# Check status
git status

# Add specific files
git add frontend/src/pages/student/

# Review changes
git diff --staged

# Commit with message
git commit -m "feat(student): Dashboard with real-time duration"

# Push to branch
git push origin dev/frontend/dashboards
```

### Commit Message Format

```
feat(scope): Description         ← New features
fix(scope): Description          ← Bug fixes
refactor(scope): Description     ← Code improvements
style(scope): Description        ← CSS/styling
test(scope): Description         ← Test additions
```

---

## Troubleshooting

### API Calls Failing 404

**Error:** `GET /api/attendance/current 404`

**Solutions:**
1. Verify backend is running: `npm run dev` in backend folder
2. Check VITE_API_URL in .env matches backend URL
3. Check route created in backend
4. Check route registered in server.js

### WebSocket Not Connecting

**Error:** WebSocket connection fails

**Solutions:**
1. Verify Socket.io initialized on backend (Day A5)
2. Check console for connection errors
3. Verify FRONTEND_URL in backend .env (should be http://localhost:5173)
4. Check CORS settings

### Tailwind Classes Not Applied

**Error:** Styling not working

**Solutions:**
1. Verify tailwind.config.js includes src paths
2. Verify index.css imported in main.jsx
3. Clear build: `rm -rf node_modules/.vite`
4. Restart dev server

### Button Width Weird on Mobile

**Error:** Buttons too wide/narrow

**Solutions:**
1. Add responsive width: `w-full md:w-auto`
2. Test in DevTools mobile view
3. Adjust padding: `px-2 md:px-4`

---

## Success Criteria

✅ **Day 1:** React app with auth pages  
✅ **Day 2:** Student dashboard functional  
✅ **Day 3:** Professor live view working  
✅ **Day 4:** Admin monitoring complete  
✅ **Day 5:** Charts and analytics added  
✅ **Day 6:** Fully responsive and polished  

**Overall:** Frontend ready for integration testing

---

## Deliverables Summary

By end of Day 6, you'll have:

```
Frontend/
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx              ✅
│   │   ├── student/
│   │   │   ├── Dashboard.jsx          ✅
│   │   │   ├── Attendance.jsx         ✅
│   │   │   └── Courses.jsx            ✅
│   │   ├── professor/
│   │   │   ├── Courses.jsx            ✅
│   │   │   ├── LiveAttendance.jsx     ✅
│   │   │   └── Analytics.jsx          ✅
│   │   └── admin/
│   │       ├── MQTTMonitor.jsx        ✅
│   │       ├── ActiveSessions.jsx     ✅
│   │       ├── Anomalies.jsx          ✅
│   │       └── Devices.jsx            ✅
│   ├── components/
│   │   ├── SessionCard.jsx            ✅
│   │   ├── DurationDisplay.jsx        ✅
│   │   ├── StudentAttendanceCard.jsx  ✅
│   │   ├── Navigation.jsx             ✅
│   │   ├── MQTTLogViewer.jsx          ✅
│   │   ├── AnomalyAlert.jsx           ✅
│   │   └── charts/
│   │       ├── AttendanceTrendChart.jsx    ✅
│   │       ├── StudentBreakdownChart.jsx   ✅
│   │       ├── DurationDistributionChart.jsx ✅
│   │       ├── PresenceTimeline.jsx       ✅
│   │       └── AttendanceDonutChart.jsx   ✅
│   ├── store/
│   │   ├── authStore.js               ✅
│   │   └── attendanceStore.js         ✅
│   ├── hooks/
│   │   └── useAuth.js                 ✅
│   ├── utils/
│   │   └── api.js                     ✅
│   ├── App.jsx                        ✅
│   ├── main.jsx                       ✅
│   └── index.css                      ✅
├── .env                               ✅
├── vite.config.js                     ✅
├── tailwind.config.js                 ✅
└── package.json                       ✅
```

---

## Next Steps (After Day 6)

1. **Wait for Dev A** to complete backend (should be done by Day 6)
2. **Coordinate** with Dev A on integration testing (Days 7-8)
3. **Deploy together** to production (Days 9-11)

---

**Ready to start? Begin with Task B1.1!**

Questions? Ask Dev A or check COMPLETE_ROADMAP.md.

Good luck! 🚀

