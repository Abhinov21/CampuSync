# 🚀 MQTT-Based Real-Time Attendance System - Complete Roadmap

**Project:** CampuSync - IoT Biometric Attendance Tracking  
**Timeline:** 18 days (70 hours)  
**Status:** Planning Phase  
**Last Updated:** 14 April 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Phase Breakdown](#phase-breakdown)
4. [Detailed Implementation Guide](#detailed-implementation-guide)
5. [Data Model](#data-model)
6. [Timeline & Milestones](#timeline--milestones)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)
9. [Decision Points](#decision-points)

---

## Project Overview

### Core Problem

Traditional attendance systems only record **whether** a student checked in once.

**CampuSync** records **how long** a student was actually present in class.

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   HiveMQ Cloud Broker                        │
│              (fingerprint/match topic)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ (MQTT Messages)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Node.js Backend                                 │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐  │
│ │ MQTT Subscriber (mqtt.js)                              │  │
│ │ - Subscribe to fingerprint/match                       │  │
│ │ - Parse events (auth, ping, recheck_ok, session_end)  │  │
│ └────────────────────────────────────────────────────────┘  │
│                       ↓                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Event Processor Service                                │  │
│ │ - Validate device→student binding                      │  │
│ │ - Create/update session                                │  │
│ │ - Calculate duration                                   │  │
│ │ - Handle edge cases (duplicates, timeouts)            │  │
│ └────────────────────────────────────────────────────────┘  │
│                       ↓                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Database Layer (Prisma + PostgreSQL)                   │  │
│ │ - Store sessions, attendance, devices, logs           │  │
│ └────────────────────────────────────────────────────────┘  │
│                       ↓                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ REST APIs + WebSocket (real-time updates)             │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       ↑
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
   ┌─────────────┐           ┌──────────────┐
   │   React     │           │   React      │
   │  Frontend   │           │   Frontend   │
   │ (Live View) │           │ (Analytics)  │
   └─────────────┘           └──────────────┘
   (Student/Prof/Admin Dashboards)
```

### Key Features

✅ Real-time MQTT message processing  
✅ Session lifecycle management  
✅ Biometric wristband authentication  
✅ Live dashboard updates via WebSocket  
✅ Multi-role access control (Student/Professor/Admin)  
✅ Attendance duration calculation  
✅ Anomaly detection (device mismatch, duplicates)  
✅ Comprehensive logging & analytics  

---

## System Architecture

### MQTT Message Types

#### 1. AUTH Event (Session Start)

```json
{
  "type": "auth",
  "device": "WB_001",
  "id": 5,
  "confidence": 88
}
```

**Action:** Create new attendance session

---

#### 2. PING Event (Presence Confirmation)

```json
{
  "type": "ping",
  "device": "WB_001",
  "id": 5,
  "ts": 1712754123
}
```

**Action:** Update last_ping_time, reset timeout

---

#### 3. RECHECK_OK Event (Re-verification Success)

```json
{
  "type": "recheck_ok",
  "device": "WB_001",
  "id": 5
}
```

**Action:** Log re-verification, continue session

---

#### 4. SESSION_END Event (Session Terminated)

```json
{
  "type": "session_end",
  "device": "WB_001",
  "id": 5
}
```

**Action:** End session, calculate total duration

---

### Session Lifecycle State Machine

```
┌─────────────┐
│  No Session │
└──────┬──────┘
       │ AUTH received
       ↓
┌─────────────────┐
│  ACTIVE SESSION │ ←─── PING/RECHECK_OK
├─────────────────┤      (reset timeout)
│ duration tracks │
│ presence        │
└──────┬──────────┘
       │ SESSION_END or PING TIMEOUT
       ↓
┌────────────────┐
│ ENDED SESSION  │
│ duration final │
└────────────────┘
```

### Timeout Logic

- **PING Timeout:** 30 seconds
- If no PING received within 30s → auto-end session
- Every PING resets the 30-second countdown

---

## Phase Breakdown

### PHASE 1: Data Model & Foundation (Days 1-2)

**Estimated Time:** 8 hours  
**Deliverables:** Schema, migration, test data

```
Day 1 (4 hrs): Design complete Prisma schema
Day 2 (4 hrs): Migration + seed data
```

---

### PHASE 2: Backend MQTT Processing (Days 3-6)

**Estimated Time:** 16 hours  
**Deliverables:** Fully functional MQTT event pipeline

```
Day 3 (2 hrs):  MQTT setup + HiveMQ connection
Day 4 (4 hrs):  Event processor + session logic
Day 5 (3 hrs):  REST API endpoints
Day 6 (3 hrs):  WebSocket real-time updates
Day 6 (4 hrs):  Testing + edge cases
```

---

### PHASE 3: Frontend Development (Days 7-12)

**Estimated Time:** 24 hours  
**Deliverables:** Complete React application with 3 dashboards

```
Day 7  (2 hrs):  React setup + real-time context
Day 8  (4 hrs):  Student dashboard
Day 9  (5 hrs):  Professor live view
Day 10 (4 hrs):  Professor management panel
Day 11 (5 hrs):  Admin real-time monitor
Day 12 (4 hrs):  Charts & analytics
```

---

### PHASE 4: Testing & Refinement (Days 13-15)

**Estimated Time:** 12 hours  
**Deliverables:** Tested, optimized system

```
Day 13 (4 hrs):  E2E testing
Day 14 (4 hrs):  Edge case handling
Day 15 (4 hrs):  Performance optimization
```

---

### PHASE 5: Deployment (Days 16-18)

**Estimated Time:** 10 hours  
**Deliverables:** Live production system

```
Day 16 (3 hrs):  Backend deployment
Day 17 (2 hrs):  Frontend deployment
Day 18 (3 hrs):  Load testing + monitoring
```

---

## Detailed Implementation Guide

### PHASE 1: Data Model & Foundation

#### Day 1: Prisma Schema Design

**File:** `prisma/schema.prisma`

**What to implement:**

```prisma
// Users & Roles
User → Student Profile
User → Professor Profile
User → Admin Profile

// Courses & Enrollment
Course (managed by Professor)
Enrollment (Student ← → Course)

// Devices
Device (WB_001, WB_002, etc.)
Device ← Student (one-to-one binding)

// Attendance Sessions
Session (Class periods)
AttendanceSession (Student's attendance in one class)
AttendanceRecord (Individual events: AUTH, PING, etc.)

// Logging & Monitoring
MQTTEventLog (All raw MQTT events)
AnomalyLog (Device mismatch, duplicates, etc.)
```

**Entities to create:**
- [ ] User (with Role enum)
- [ ] Student
- [ ] Professor
- [ ] Admin
- [ ] Course
- [ ] Enrollment
- [ ] Device
- [ ] Session
- [ ] AttendanceSession
- [ ] AttendanceRecord
- [ ] MQTTEventLog
- [ ] AnomalyLog

**Key Considerations:**
- Device ID must be unique
- Student-Device binding must be one-to-one
- Sessions must have schedule times
- Attendance records need fine-grained timestamps
- MQTT logs need indexes for performance

---

#### Day 2: Migration & Seed Data

**Commands:**

```bash
# Generate and apply migration
npx prisma migrate dev --name "mqtt_attendance_system"

# Verify in Prisma Studio
npx prisma studio
```

**Seed data to create:**

```javascript
// 1 Admin user
// 2 Professor users + their courses
// 5 Student users + enrollments
// 5 Device records (WB_001 to WB_005) assigned to students
// 2 Active sessions
```

**Verification Steps:**
- [ ] All tables created in PostgreSQL
- [ ] No foreign key constraint errors
- [ ] Seed script runs without errors
- [ ] Prisma Studio shows all data

---

### PHASE 2: Backend MQTT Processing

#### Day 3: MQTT Setup & Connection

**Install:**
```bash
npm install mqtt
```

**Create:** `src/services/mqttService.js`

**Responsibilities:**
1. Connect to HiveMQ Cloud broker
2. Subscribe to `fingerprint/match` topic
3. Parse JSON messages
4. Pass events to event processor
5. Handle connection/error states

**Key Code Sections:**
```javascript
- constructor()
- connect()
- subscribe()
- on('message')
- on('error')
- disconnect()
```

**Environment Variables:**
```
MQTT_BROKER_URL=mqtt://broker-address.hivemq.cloud
MQTT_USERNAME=username
MQTT_PASSWORD=password
MQTT_PORT=8883 (TLS)
```

**Testing:**
```bash
# Verify connection with logs:
npm run dev
# Should see: "✅ Connected to HiveMQ"
# Should see: "✅ Subscribed to fingerprint/match"
```

---

#### Day 4: Event Processor & Session Logic

**Create:** `src/services/eventProcessor.js`

**Responsibilities:**
1. Parse MQTT payload
2. Validate device exists
3. Verify device-student binding
4. Handle 4 event types (AUTH, PING, RECHECK_OK, SESSION_END)
5. Manage session lifecycle
6. Log anomalies
7. Set/reset timeouts

**Methods to Implement:**

```javascript
class EventProcessor {
  async processEvent(payload)           // Route to correct handler
  async handleAuthEvent(payload)        // Create session
  async handlePingEvent(payload)        // Extend duration
  async handleRecheckEvent(payload)     // Log re-verification
  async handleSessionEndEvent(payload)  // End session
  
  async recordAttendanceEvent()         // Create AttendanceRecord
  async logMQTTEvent()                  // Log MQTT event
  async logAnomaly()                    // Log suspicious activity
  
  setPingTimeout()                      // Auto-end after 30s no-ping
  findCurrentSessionForStudent()        // Find active class session
}
```

**Edge Cases to Handle:**
- [ ] Duplicate AUTH (session already active)
- [ ] PING without active session
- [ ] Unknown device
- [ ] Device-student mismatch
- [ ] Orphaned sessions

---

#### Day 5: REST API Endpoints

**File:** `src/routes/attendance.js`

**Student Endpoints:**
```
GET  /api/attendance/current           (my active session)
GET  /api/attendance/course/:courseId  (stats for one course)
GET  /api/attendance/history           (all my sessions)
```

**Professor Endpoints:**
```
GET  /api/attendance/course/:courseId/live         (live students)
POST /api/attendance/course/:courseId/start-session (start class)
PATCH /api/attendance/course/:courseId/end-session  (end class)
GET  /api/attendance/course/:courseId/report        (attendance report)
```

**Admin Endpoints:**
```
GET /api/attendance/admin/active-sessions  (all active now)
GET /api/attendance/admin/mqtt-logs        (raw MQTT events)
GET /api/attendance/admin/anomalies        (suspicious activity)
GET /api/attendance/admin/devices          (device status)
```

**Response Format Example (Live Attendance):**
```json
{
  "message": "Live attendance data",
  "activeStudents": 23,
  "sessions": [
    {
      "id": "session-123",
      "studentId": "student-456",
      "durationSeconds": 1425,
      "status": "active",
      "joinedAt": "2026-04-14T09:00:00Z"
    }
  ]
}
```

---

#### Day 6: WebSocket Real-Time Updates

**Install:**
```bash
npm install socket.io
```

**Create:** `src/services/websocketService.js`

**Features:**
- [ ] Student joins session room
- [ ] Emit when student joins class
- [ ] Emit duration updates every PING
- [ ] Emit when student leaves
- [ ] Emit anomaly alerts

**WebSocket Events:**

```javascript
// From server to clients:
socket.emit('session-event', {
  type: 'student-joined',
  data: { studentId, durationSeconds }
})

socket.emit('session-event', {
  type: 'ping-update',
  durationSeconds: 125
})

socket.emit('session-event', {
  type: 'session-ended',
  totalDuration: 2700
})
```

**Integration Points:**
- Update eventProcessor to emit WebSocket events
- Pass io instance to event processor
- Rooms: `session-{sessionId}`, `admin-room`, etc.

---

### PHASE 3: Frontend Development

#### Day 7: React Setup + Real-Time Context

**Setup Vite React:**
```bash
npm create vite frontend -- --template react
cd frontend
npm install react-router-dom axios zustand socket.io-client recharts react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Create Store:** `src/store/attendanceStore.js`

```javascript
// Using Zustand for state management
- currentSession
- activeSessions
- socket connection
- real-time duration updates
```

**Create Layout:**
- Navigation (role-based menu)
- Header (user info, logout)
- Sidebar (navigation)
- Protected route wrapper

---

#### Day 8: Student Dashboard

**Pages:**
- `/student/dashboard` - Current view
- `/student/attendance` - History
- `/student/courses` - Enrolled courses

**Components:**

```
StudentDashboard
├── CurrentSessionCard
│   ├── DurationDisplay (updates via WebSocket)
│   ├── SessionStatus
│   └── LeaveClassButton
├── TodayStats
│   ├── AttendancePercentage
│   └── ClassesAttended
└── QuickLinks
    ├── ViewHistory
    └── ViewCourses
```

**Features:**
- [ ] Display current session (if active)
- [ ] Show duration counting up in real-time
- [ ] Display today's attendance stats
- [ ] Show courses with attendance %
- [ ] History of past sessions

---

#### Day 9: Professor Dashboard - Live Attendance

**Pages:**
- `/professor/courses/:courseId/live` - Live view

**Components:**

```
ProfessorLiveView
├── SessionHeader
│   ├── ClassName
│   ├── SessionTime
│   └── EndSessionButton
├── LiveStudentList
│   ├── StudentCard (repeating)
│   │   ├── StudentName
│   │   ├── Duration (real-time)
│   │   ├── Confidence
│   │   └── Status Indicator
│   └── Refresh counter
└── Statistics
    ├── TotalPresent
    ├── TotalExpected
    └── AttendancePercentage
```

**Real-Time Features:**
- [ ] List updates every PING (~10s)
- [ ] Duration counting up
- [ ] Color coding (present/left/failed-recheck)
- [ ] Notifications for arrivals/departures

---

#### Day 10: Professor Management Panel

**Pages:**
- `/professor/courses` - My courses
- `/professor/courses/new` - Create course
- `/professor/courses/:id/settings` - Manage course
- `/professor/courses/:id/students` - Enrolled students

**Components:**

```
CourseManagement
├── CourseList
├── CreateCourseForm
├── EnrollmentManager
│   ├── Available students
│   ├── Enrolled students
│   └── Bulk enroll
└── SessionScheduler
```

**Features:**
- [ ] CRUD for courses
- [ ] Add/remove students
- [ ] Schedule session times
- [ ] Pre-authorize session before starting

---

#### Day 11: Admin Real-Time Monitor

**Pages:**
- `/admin/mqtt-monitor` - Live MQTT stream
- `/admin/active-sessions` - All active now
- `/admin/anomalies` - Alert list
- `/admin/devices` - Device registry
- `/admin/users` - User management

**Components:**

```
AdminMonitor
├── MQTTLogViewer
│   ├── Real-time event stream
│   ├── Filter by device/type
│   └── Export logs
├── ActiveSessionsMonitor
│   ├── Global session count
│   ├── Session list with details
│   └── Anomalies highlighted in red
├── AnomalyAlerts
│   ├── Device mismatch alerts
│   ├── Duplicate AUTH alerts
│   └── Failed re-verification alerts
└── DeviceRegistry
    ├── Device status
    ├── Battery level
    └── Assignment history
```

**Real-Time Features:**
- [ ] MQTT logs append in real-time
- [ ] Active session counter updates
- [ ] Red alerts for anomalies
- [ ] Color coding for severity

---

#### Day 12: Charts & Analytics

**Libraries:** Recharts

**Charts to Create:**

1. **Attendance Trend (Line Chart)**
   - X-axis: Days
   - Y-axis: Attendance %
   - Multi-course overlay

2. **Student Breakdown (Bar Chart)**
   - X-axis: Students
   - Y-axis: Sessions attended

3. **Duration Distribution (Histogram)**
   - X-axis: Duration minutes
   - Y-axis: Count of sessions

4. **Presence Timeline (Timeline)**
   - X-axis: Time
   - Y-axis: Students
   - Blocks showing presence duration

**Components:**

```
AnalyticsDashboard
├── AttendanceTrendChart
├── StudentBreakdownChart
├── DurationDistributionChart
├── PresenceTimeline
└── ExportButton (CSV)
```

---

### PHASE 4: Testing & Refinement

#### Day 13: E2E Testing

**Test Scenarios:**

```
Scenario 1: Complete Student Flow
├── Register student with email
├── Admin assigns device WB_001 to student
├── Professor creates course
├── Student enrolls in course
├── Professor starts session
├── MQTT AUTH event received
├── Student appears in live view
├── MQTT PING events received every 10s
├── Duration updates in real-time
└── MQTT SESSION_END event
    └── Session ends
    └── Final duration recorded

Scenario 2: Anomaly Detection
├── MQTT AUTH received for unknown device
└── Logged as anomaly ✓

Scenario 3: Device Mismatch
├── Device WB_001 sent AUTH
├── Database shows WB_001 belongs to Student A
├── Payload says id=5 (Student B)
└── Logged as mismatch ✓

Scenario 4: Duplicate Prevention
├── First AUTH → session created
├── Second AUTH (same device) → rejected
└── No duplicate session ✓

Scenario 5: Timeout
├── Session created with PING
├── No PING for 30+ seconds
└── Session auto-ends ✓
```

**Tools:**
- Postman for API testing
- MQTT CLI for message publishing
- Browser WebSocket inspector

---

#### Day 14: Edge Case Handling

**Cases to Handle:**

```
1. Network Interruption
   - Reconnect MQTT client
   - Resume processing queue
   
2. Concurrent Sessions
   - Two devices for same student?
   - Reject second auth
   
3. Delayed Messages
   - PING out of order?
   - Use timestamp to validate
   
4. Device Disconnect
   - Wristband battery died
   - Auto-end session after timeout
   
5. Failed Re-verification
   - Mark session suspicious
   - Alert admin
   - Allow completion but flag
   
6. Database Errors
   - Retry logic
   - Error logs
   - Admin alerts
```

**Implementation:**
- [ ] Retry mechanisms
- [ ] Error recovery
- [ ] Comprehensive logging
- [ ] Admin notifications

---

#### Day 15: Performance Optimization

**Database Optimization:**
```sql
-- Indexes for MQTT queries
CREATE INDEX idx_mqtt_event_device ON mqtt_event_log(device_id, created_at);
CREATE INDEX idx_attendance_session_student ON attendance_session(student_id);
CREATE INDEX idx_attendance_session_status ON attendance_session(session_status);
```

**Backend Optimization:**
- [ ] Batch WebSocket updates (max 10/sec)
- [ ] Query result caching
- [ ] N+1 query elimination
- [ ] Connection pooling

**Frontend Optimization:**
- [ ] Code splitting by route
- [ ] Component memoization (React.memo)
- [ ] Virtual scrolling for long lists
- [ ] WebSocket message debouncing

---

### PHASE 5: Deployment

#### Day 16: Backend Deployment

**Deploy to Render.com:**

```bash
# Connect GitHub repo
# Create new service
# Set environment variables:
DATABASE_URL=...
MQTT_BROKER_URL=...
MQTT_USERNAME=...
MQTT_PASSWORD=...
JWT_SECRET=...
```

**Steps:**
- [ ] Version bumps
- [ ] Final testing on staging
- [ ] Database migrations
- [ ] MQTT credentials configured
- [ ] Health check passing

**Verification:**
```bash
curl https://your-api.onrender.com/health
```

---

#### Day 17: Frontend Deployment

**Deploy to Vercel:**

```bash
# Connect GitHub repo
# Set environment variables:
VITE_API_URL=https://your-api.onrender.com
VITE_MQTT_NAMESPACE=/mqtt-logs
```

**Steps:**
- [ ] Build optimization complete
- [ ] API endpoint configured
- [ ] WebSocket URL correct
- [ ] CORS settings verified

**Verification:**
```
https://your-app.vercel.app
Login with test account
```

---

#### Day 18: Load Testing & Monitoring

**Load Testing:**
```javascript
// Simulate 50 concurrent wristbands
// Send AUTH + PING events for 1 hour
// Measure response times
// Check database performance
```

**Monitoring Setup:**

```
Error Tracking: Sentry
Frontend Monitoring: LogRocket
Performance: New Relic or DataDog
Logs: CloudWatch or Papertrail
Uptime: UptimeRobot
```

**Expected Metrics:**
- API response time: < 100ms (P95)
- MQTT processing: < 50ms
- WebSocket latency: < 100ms
- Database query: < 50ms

---

## Data Model

### Complete Schema

```
User
├── id (UUID, PK)
├── email (unique)
├── password (hashed)
├── role (STUDENT | PROFESSOR | ADMIN)
├── createdAt
└── updatedAt

Student (1:1 with User)
├── id
├── userId (FK, unique)
├── name
├── rollNumber (unique)
├── department
├── year
├── enrollments[] (many)
├── devices[] (many)
├── attendanceSessions[] (many)

Professor (1:1 with User)
├── id
├── userId (FK, unique)
├── name
├── employeeId (unique)
├── department
└── courses[] (many)

Admin (1:1 with User)
├── id
├── userId (FK, unique)
└── name

Course
├── id
├── code (unique)
├── name
├── professorId (FK)
├── enrollments[] (many)
└── sessions[] (many)

Enrollment (M:N between Student and Course)
├── id
├── studentId (FK)
├── courseId (FK)
├── enrolledAt

Device (Wristband)
├── id
├── deviceId (unique, WB_001, etc.)
├── studentId (FK, unique/one-to-one)
├── deviceStatus
├── assignedAt
├── lastPingAt
├── batteryLevel
└── attendanceSessions[] (many)

Session (Class Period)
├── id
├── courseId (FK)
├── scheduledStartTime
├── scheduledEndTime
├── actualStartTime
├── actualEndTime
├── sessionStatus (scheduled | active | completed)
└── attendanceSessions[] (many)

AttendanceSession (Student's attendance in one class)
├── id
├── sessionId (FK)
├── studentId (FK)
├── deviceId (FK)
├── sessionStartTime
├── lastPingTime
├── sessionEndTime
├── totalDurationSeconds
├── sessionStatus (active | ended)
├── reCheckFailureCount
└── attendanceRecords[] (many)

AttendanceRecord (Individual event)
├── id
├── attendanceSessionId (FK)
├── studentId (FK)
├── eventType (auth | ping | recheck_ok | session_end)
├── eventTimestamp
└── createdAt

MQTTEventLog (Raw event logging)
├── id
├── deviceId (FK)
├── eventType
├── payload (JSON - raw MQTT message)
├── processedAt
├── status (processed | failed)
├── errorMessage
└── createdAt (indexed)

AnomalyLog
├── id
├── studentId (FK, nullable)
├── deviceId (FK, nullable)
├── anomalyType
├── description
├── severity (low | medium | high)
└── createdAt
```

### Key Relationships

```
User (1) ──── Student (1)
         ├──── Professor (1)
         └──── Admin (1)

Student (M) ──── Enrollment ──── (M) Course ──── Professor (1)
   │                                    │
   │                                    └─── Session (M)
   │                                           │
   └── Device (1) ──────────────────────┐     │
       │                                │     │
       └── AttendanceSession (M) ◄─────────┘
              │
              └── AttendanceRecord (M)
              └── MQTTEventLog (M)

Anomaly ◄──── Device/Student
```

---

## Timeline & Milestones

### Week 1: Backend Foundation

| Day | Phase | Tasks | Status |
|-----|-------|-------|--------|
| 1-2 | 1 | Schema + Migration + Seed | ⏳ Pending |
| 3 | 2 | MQTT Connection | ⏳ Pending |
| 4 | 2 | Event Processor | ⏳ Pending |
| 5 | 2 | REST APIs | ⏳ Pending |
| 6 | 2 | WebSocket | ⏳ Pending |

**Milestone:** Backend MVP (can process MQTT, store data, expose APIs)

---

### Week 2: Frontend Development

| Day | Phase | Tasks | Status |
|-----|-------|-------|--------|
| 7 | 3 | React Setup + Context | ⏳ Pending |
| 8 | 3 | Student Dashboard | ⏳ Pending |
| 9 | 3 | Professor Live View | ⏳ Pending |
| 10 | 3 | Professor Management | ⏳ Pending |
| 11 | 3 | Admin Monitor | ⏳ Pending |
| 12 | 3 | Analytics & Charts | ⏳ Pending |

**Milestone:** Frontend MVP (all 3 dashboards working)

---

### Week 3: Polish & Deployment

| Day | Phase | Tasks | Status |
|-----|-------|-------|--------|
| 13-15 | 4 | Testing & Optimization | ⏳ Pending |
| 16-18 | 5 | Deployment & Monitoring | ⏳ Pending |

**Milestone:** Live Production System

---

## Testing Strategy

### Unit Tests

```javascript
// Backend
- hashPassword() and comparePassword()
- generateToken() and verifyToken()
- Event processor logic
- Session calculations
- Anomaly detection

// Frontend
- Component rendering
- Store mutations
- WebSocket handlers
```

### Integration Tests

```
Test scenarios:
1. Auth flow (register → login → token)
2. MQTT message → Database state
3. API endpoint → Database fetch
4. WebSocket event → Component update
```

### E2E Tests

```
Complete user flows:
1. Student registers, logs in, views attendance
2. Professor creates course, enrolls students, starts session
3. MQTT device sends events, appears live, session ends
4. Admin monitors all in real-time
```

### Manual Acceptance Tests

```
Student Role:
- ✅ Can register
- ✅ Can login
- ✅ Can view dashboard
- ✅ Can see current session live
- ✅ Can view history

Professor Role:
- ✅ Can create course
- ✅ Can enroll students
- ✅ Can start session
- ✅ Can see live attendance
- ✅ Can view analytics

Admin Role:
- ✅ Can see all active sessions
- ✅ Can see MQTT logs
- ✅ Can see anomalies
- ✅ Can manage devices
```

---

## Deployment Guide

### Pre-Deployment Checklist

```
Backend:
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] MQTT credentials secured
- [ ] JWT secret changed
- [ ] CORS configured
- [ ] Rate limiting in place

Frontend:
- [ ] All tests passing
- [ ] Production build optimized
- [ ] API endpoint configured
- [ ] Environment variables set
- [ ] No console warnings
- [ ] Responsive on mobile
- [ ] Performance optimized
```

### Deployment Platforms

**Backend Options:**
- Render.com (recommended)
- Railway
- Fly.io
- Digital Ocean

**Frontend Options:**
- Vercel (recommended)
- Netlify
- GitHub Pages
- Cloudflare Pages

**Database:**
- Supabase (already used)
- AWS RDS
- PlanetScale

**MQTT Broker:**
- HiveMQ Cloud (current)
- AWS IoT Core
- Azure IoT Hub

### Post-Deployment Steps

```bash
# Test production URLs
curl https://api.campusync.app/health
curl https://app.campusync.app

# Verify MQTT connection
Check admin dashboard for MQTT logs

# Verify database
npx prisma db execute --file check.sql

# Setup monitoring
- Configure Sentry
- Setup CloudWatch logs
- Enable error alerts
```

---

## Decision Points

### Before Starting Implementation

**1. HiveMQ Account**
- [ ] Do you have HiveMQ Cloud credentials?
- [ ] Is the topic name correct: `fingerprint/match`?

**2. MQTT Simulator**
How will you test without real wristbands?
- [ ] Option A: Write Node.js script to publish test messages
- [ ] Option B: Use MQTT CLI tool (`mqtt-cli`)
- [ ] Option C: Use MQTT.fx GUI tool

**3. Frontend URL**
Where will the React app run?
- [ ] Localhost: http://localhost:5173 (Vite default)
- [ ] Production domain: https://app.campusync.com

**4. Authentication**
- [ ] Separate registration for admin, or manual creation?
- [ ] Role assignment at registration or admin panel?

**5. Notifications**
- [ ] Email alerts for anomalies?
- [ ] SMS for students?
- [ ] Push notifications?

**6. Video/Photo Storage**
- [ ] Store biometric data?
- [ ] Keep RFID confidence level only?

---

## Project Structure

```
campusync/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js                (login/register)
│   │   │   ├── courses.js             (course CRUD)
│   │   │   ├── attendance.js          (attendance APIs)
│   │   │   └── devices.js             (device management)
│   │   │
│   │   ├── services/
│   │   │   ├── mqttService.js         (MQTT connection)
│   │   │   ├── eventProcessor.js      (event handling)
│   │   │   ├── websocketService.js    (real-time updates)
│   │   │   └── sessionManager.js      (session logic)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                (JWT verification)
│   │   │   └── errorHandler.js
│   │   │
│   │   ├── utils/
│   │   │   ├── auth.js                (bcrypt, JWT)
│   │   │   └── validators.js
│   │   │
│   │   ├── server.js                  (Express setup)
│   │   └── constants.js               (config)
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   │
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Attendance.jsx
│   │   │   │   └── Courses.jsx
│   │   │   │
│   │   │   ├── professor/
│   │   │   │   ├── Courses.jsx
│   │   │   │   ├── LiveAttendance.jsx
│   │   │   │   ├── CreateCourse.jsx
│   │   │   │   └── Analytics.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── MQTTMonitor.jsx
│   │   │       ├── ActiveSessions.jsx
│   │   │       ├── Anomalies.jsx
│   │   │       └── Devices.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── SessionCard.jsx
│   │   │   ├── LiveDuration.jsx
│   │   │   ├── AttendanceChart.jsx
│   │   │   ├── RealTimeLog.jsx
│   │   │   └── Navigation.jsx
│   │   │
│   │   ├── store/
│   │   │   ├── attendanceStore.js
│   │   │   ├── authStore.js
│   │   │   └── websocketStore.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAttendance.js
│   │   │   ├── useWebSocket.js
│   │   │   └── useAuth.js
│   │   │
│   │   ├── utils/
│   │   │   ├── api.js              (axios config)
│   │   │   └── formatters.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── README.md
│
├── COMPLETE_ROADMAP.md       (this file)
├── README.md
└── .gitignore
```

---

## Next Steps

### Immediate Actions (Next 24 Hours)

1. **Confirm MQTT Setup**
   - [ ] Get HiveMQ Cloud credentials
   - [ ] Test connection with mqtt-cli
   - [ ] Verify topic: fingerprint/match

2. **Update Prisma Schema**
   - [ ] Add all 12 entities (see schema above)
   - [ ] Define all relationships
   - [ ] Add indexes

3. **Run Migration**
   - [ ] `npx prisma migrate dev`
   - [ ] Verify all tables in Prisma Studio

4. **Create Seed Data**
   - [ ] 1 Admin user
   - [ ] 2 Professors
   - [ ] 5 Students
   - [ ] Enroll students in courses
   - [ ] Assign devices

5. **Create MQTT Simulator**
   - [ ] Node.js script to publish test events
   - [ ] Test AUTH, PING, SESSION_END flows

6. **Commit to Git**
   - [ ] Push schema changes
   - [ ] Push seed data script

---

## Resources & References

### MQTT Resources
- HiveMQ Cloud: https://www.hivemq.com/mqtt-cloud/
- MQTT Specification: https://mqtt.org/
- MQTT.js Library: https://github.com/mqttjs/MQTT.js

### Tech Stack Docs
- Prisma: https://www.prisma.io/docs/
- Express.js: https://expressjs.com/
- React: https://react.dev/
- Socket.io: https://socket.io/docs/
- TailwindCSS: https://tailwindcss.com/

### Deployment
- Render.com: https://render.com/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs

---

## Success Metrics

By end of project, you will have:

✅ **Real-time MQTT processing** - Events handled within 50ms  
✅ **Live dashboards** - Updates via WebSocket in real-time  
✅ **Multi-role access control** - Student/Professor/Admin with proper permissions  
✅ **Attendance tracking** - Duration-based (not just presence))  
✅ **Anomaly detection** - Flags suspicious patterns  
✅ **Scalable architecture** - Handles 100+ concurrent devices  
✅ **Production deployment** - Live on cloud platforms  
✅ **Comprehensive logging** - All MQTT events and anomalies tracked  

---

## Questions?

Refer back to this document whenever you're unsure about:
- What to build next (follow Phase breakdown)
- How to structure code (see Project Structure)
- What the data model looks like (see Data Model section)
- How the system works end-to-end (see System Architecture)

---

**Document Version:** 1.0  
**Last Updated:** 14 April 2026  
**Next Review:** After Phase 1 completion

