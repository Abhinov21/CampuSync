# CampuSync Comprehensive Codebase Analysis

*Analysis Date: May 4, 2026*

---

## 1. ANALYTICS/STATISTICS CALCULATION

### 1.1 Backend Analytics Endpoints

#### **Admin Analytics Overview** (`GET /api/admin/analytics/overview`)
**File**: [backend/src/routes/admin.js](backend/src/routes/admin.js#L261)

**Calculated Metrics:**
- **Total Sessions**: `SELECT COUNT(*) FROM sessions WHERE scheduledStartTime >= dateFilter`
- **Total Students**: `SELECT COUNT(*) FROM students` (system-wide, not filtered by date)
- **Average Attendance**: Percentage of `COMPLETED` attendance sessions vs total
- **Average Duration**: Minutes calculated from `(actualEndTime - scheduledStartTime) / 1000 / 60`
- **Active Courses**: Count of courses with sessions in date range
- **Total Attendance Records**: Count of `AttendanceSession` records

**Query Parameters:**
- `?days=7` for last 7 days
- `?days=30` for last 30 days
- Omit for all time

**Response Format:**
```json
{
  "stats": {
    "totalSessions": 45,
    "totalStudents": 150,
    "averageAttendance": 85,
    "averageDuration": 45,
    "activeCourses": 12,
    "totalAttendanceRecords": 500
  }
}
```

#### **Professor Course Analytics Report** (`GET /api/attendance/course/:courseId/report`)
**File**: [backend/src/routes/attendance.js](backend/src/routes/attendance.js#L394)

**Calculated Metrics:**
- **Total Sessions**: Count of all sessions for the course
- **Total Students**: Per-session student count (for max value)
- **Average Attendance**: Calculated as `attendanceCount / totalEnrolled * 100`
- **Average Duration**: `SUM(totalDurationSeconds) / attendedSessions.length`
- **Attendance Threshold**: 65% of session duration for marking present

**Per-Session Data Included:**
```javascript
{
  id: session.id,
  scheduledStartTime: session.scheduledStartTime,
  attendanceCount: 42,
  totalEnrolled: 50,
  attended: 42,
  absent: 8,
  avgDuration: 2850, // seconds
  attendanceRate: "84.00%"
}
```

### 1.2 Frontend Components for Analytics

#### **Admin Analytics Page** (`frontend/src/pages/admin/Analytics.jsx`)
**Features:**
- Fetches from `/api/admin/analytics/overview?days={7|30|all}`
- Displays 6 stats cards with color-coded borders
- Includes charts section:
  - AttendanceTrendChart
  - AttendanceDonutChart
  - StudentBreakdownChart
  - DurationDistributionChart
- Date range buttons for filtering

**Key Calculations:**
```javascript
// Line 18-38: Stats state
const [stats, setStats] = useState({
  totalSessions: 0,
  totalStudents: 0,
  averageAttendance: 0,
  averageDuration: 0,
  activeCourses: 0,
  totalAttendanceRecords: 0,
});

// Duration formatting
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
};
```

#### **Professor Analytics Page** (`frontend/src/pages/professor/Analytics.jsx`)
**Features:**
- Course-specific analytics with date range filter
- Fetches from `/api/attendance/course/{courseId}/report`
- Displays statistics cards and multiple charts
- SessionDetailsModal for detailed session view

**Key Calculations (Lines 52-112):**
```javascript
// Calculate statistics from sessions data
const totalSessions = data.totalSessions || 0;
const totalAttendance = sessionData.reduce(
  (sum, s) => sum + (s.attendanceCount || 0), 0
);
const avgAttendance = totalSessions > 0 
  ? Math.round(totalAttendance / totalSessions) 
  : 0;
const totalStudents = data.totalStudents || 0;

// Average duration calculation (already in seconds)
const totalDuration = sessionData.reduce(
  (sum, s) => sum + (s.avgDuration || 0), 0
);
const avgDuration = totalSessions > 0 
  ? Math.round(totalDuration / totalSessions) 
  : 0;
```

**Chart Data Preparation (Lines 115-166):**
- **Trend Data**: Last 30 sessions, attendance percentage per session
- **Duration Distribution**: Bins into ranges (0-15m, 15-30m, 30-45m, 45-60m, 60m+)
- **Student Breakdown**: Per-session present/absent counts
- **Presence Timeline**: Last 12 sessions status visualization
- **Donut Chart**: Total present vs absent aggregated

### 1.3 State Management

#### **Attendance Store** (`frontend/src/store/attendanceStore.js`)
```javascript
export const useAttendanceStore = create((set) => ({
  currentSession: null,
  activeSessions: [],
  allSessions: [],
  
  setCurrentSession: (session) => set({ currentSession: session }),
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
  setAllSessions: (sessions) => set({ allSessions: sessions }),
}));
```

**Note**: Store is minimal - complex calculations happen at endpoint or component level

#### **useAttendance Hook** (`frontend/src/hooks/useAttendance.js`)
**Methods:**
- `fetchCurrentSession()`: GET `/api/attendance/current` → sets currentSession
- `fetchCourseHistory(courseId)`: GET `/api/attendance/course/{courseId}`
- `fetchAttendanceHistory()`: GET `/api/attendance/history` → sets allSessions
- `fetchLiveAttendance(courseId)`: GET `/api/attendance/course/{courseId}/live`

---

## 2. PROFESSOR ACTIVE SESSIONS PAGE

### 2.1 Component Location and Status
**File**: [frontend/src/pages/professor/LiveAttendance.jsx](frontend/src/pages/professor/LiveAttendance.jsx)

**Note**: Named `ProfessorLiveAttendance` but displays as "Live Attendance" (showing active session with real-time student attendance)

### 2.2 Current Data Display

**Session Information Shown:**
```javascript
const [currentSession, setCurrentSession] = useState(null);
// Fetched from GET /api/sessions/active
// Contains: courseId, courseName, sessionId, startTime
```

**Student Attendance Cards** (Lines 140-200+):
- Uses `<StudentAttendanceCard>` components
- Displays per-student real-time data:
  - Student name
  - Status (PRESENT/ABSENT)
  - Duration in session
  - Last update timestamp

### 2.3 Real-Time Updates Via WebSocket

**Socket Events Listened For:**
```javascript
socket.on('session-event', (data) => {
  // data.type === 'student-joined'
  // data.type === 'duration-update'
  // Updates student list in real-time
});

socket.on('session-ended', (data) => {
  // Session ended event
  setSessionStatus('ENDED');
});
```

**Room-Based Updates:**
- Professor joins room for `sessionId`
- Receives events for all students in that session
- Updates happen without page refresh

### 2.4 Session Management Functions

**End Session Functionality** (Lines 160+):
```javascript
const handleEndSession = async () => {
  if (!currentSession?.id) {
    alert('Session ID not found');
    return;
  }
  
  // Verifies PROFESSOR permission before ending
  const permission = verifyPermission('PROFESSOR');
  if (!permission.allowed) {
    // Handle permission error
  }
  
  // Call to backend to mark session as COMPLETED
};
```

**Refresh Interval:**
- Fetches session data every 5 seconds
- Updates student attendance counts
- Maintains WebSocket connection

### 2.5 Current Issues/Limitations

1. **NO Manual Attendance Marking**: Page only displays real-time MQTT-captured attendance
2. **No Manual Record Entry**: Cannot manually add/remove students
3. **No Batch Operations**: Cannot mark all present/absent at once
4. **Limited Session Control**: Can only end session, no start/pause options

---

## 3. ATTENDANCE RECORDING FLOW

### 3.1 Event Sources

#### **MQTT Events (Primary)**
**Flow**: MQTT Device → HiveMQ Cloud → `mqttService.js` → `eventProcessor.js`

**Event Types:**
1. **AUTH**: Biometric fingerprint matched, session starts
2. **PING**: Periodic presence confirmation (every ~30 seconds)
3. **RECHECK_OK**: Re-verification of presence successful
4. **SESSION_END**: Student removed device or class ended

**MQTT Topics Subscribed:**
- `fingerprint/match` - AUTH events
- `devicelog/reception` - PING/RECHECK/SESSION_END events

#### **Manual Records (NOT Currently Implemented)**
- No UI component for professors to manually add attendance
- No API endpoint for manual record creation
- Could be added via new form component + POST endpoint

### 3.2 Event Processing Pipeline

**File**: [backend/src/services/eventProcessor.js](backend/src/services/eventProcessor.js)

#### **Main Entry Point: `processEvent(payload)`**
```
Incoming MQTT Payload
    ↓
Payload Normalization (device_mac → device, user_id → id)
    ↓
Basic Validation (type, device fields)
    ↓
Device Lookup + Student Binding Verification
    ↓
Event Type Routing
    ├─ AUTH → handleAuthEvent()
    ├─ PING → handlePingEvent()
    ├─ RECHECK_OK → handleRecheckEvent()
    └─ SESSION_END → handleSessionEndEvent()
    ↓
Anomaly Detection + Logging
    ↓
WebSocket Broadcast to Professors
```

#### **AUTH Event Handler** (Lines 73-195)
**Sequence:**
1. Check if device already has active session (prevent duplicates)
2. Find current active session for student
3. Check if student already attended this session
4. Create/update `AttendanceSession` record with:
   - `sessionStatus = ACTIVE`
   - `sessionStartTime = NOW`
   - `totalDurationSeconds = 0` (initially)
5. Create `AttendanceRecord` with `eventType = AUTH`
6. Store in memory map: `activeSessions.set(deviceId, {...})`
7. Set 30-second ping timeout
8. Broadcast WebSocket event: `session-created`

**Key Logic:**
- **Rejoin Handling**: If student left (ENDED) and returned, create NEW attendance record
- **Duplicate Detection**: Prevents AUTH if session already active
- **Session Requirement**: Must have active class session scheduled

#### **PING Event Handler** (Lines 197-245)
**Sequence:**
1. Check if device has active session in memory
2. Update `lastPingTime` in memory
3. Create `AttendanceRecord` with `eventType = PING`
4. Reset 30-second timeout (prevents auto-end)
5. Emit WebSocket: `duration-update` for all students

**Duration Calculation:**
```javascript
durationSeconds = Math.floor((NOW - sessionStartTime) / 1000)
```

#### **RECHECK_OK Event Handler** (Lines 247-273)
- Similar to PING but with `eventType = RECHECK_OK`
- Confirms re-verification successful
- Resets timeout

#### **SESSION_END Event Handler** (Lines 275-291)
- Triggered by student removing device
- Calls `endSession()` with reason "USER_REQUEST"
- Calculates final `totalDurationSeconds`
- Marks `AttendanceSession.sessionStatus = ENDED`

### 3.3 Session Timeout Logic

**30-Second Automatic Timeout:**
```javascript
setPingTimeout(deviceId, studentId, sessionId) {
  // Clear existing timeout if any
  if (activeSessions.get(deviceId)?.timeoutHandler) {
    clearTimeout(activeSessions.get(deviceId).timeoutHandler);
  }
  
  // Set new 30-second timeout
  const handler = setTimeout(() => {
    // If no PING/RECHECK in 30 seconds, auto-end session
    this.endSession(deviceId, "TIMEOUT");
  }, 30000);
  
  activeSessions.get(deviceId).timeoutHandler = handler;
}
```

### 3.4 Database Record Creation

**AttendanceSession Record** (Per Student Per Session):
```javascript
{
  id: UUID,
  sessionId: String,        // Link to Session
  studentId: String,        // Link to Student
  deviceId: String,         // Link to Device
  sessionStartTime: DateTime, // When AUTH occurred
  lastPingTime: DateTime?,  // Last PING/RECHECK
  sessionEndTime: DateTime?, // When session ended (NULL until SESSION_END)
  totalDurationSeconds: Int, // Calculated when session ends
  sessionStatus: 'ACTIVE' | 'ENDED',
  reCheckFailureCount: Int,
  createdAt: DateTime
}
```

**AttendanceRecord** (Event Log):
```javascript
{
  id: UUID,
  attendanceSessionId: String, // Link to AttendanceSession
  studentId: String,
  eventType: 'AUTH' | 'PING' | 'RECHECK_OK' | 'SESSION_END',
  eventTimestamp: DateTime,
  createdAt: DateTime
}
```

**MQTTEventLog** (Raw Events):
```javascript
{
  id: UUID,
  deviceId: String,
  eventType: String,
  payload: JSON,       // Raw MQTT message
  processedAt: DateTime?,
  status: 'pending' | 'processed' | 'failed',
  errorMessage: String?,
  createdAt: DateTime
}
```

### 3.5 Anomaly Detection

**Logged Anomalies:**
1. **INVALID_PAYLOAD**: Missing type or device field
2. **UNKNOWN_DEVICE**: Device not in database
3. **UNBOUND_DEVICE**: Device not linked to student
4. **UNKNOWN_EVENT_TYPE**: Invalid event type
5. **PROCESSOR_ERROR**: General processing failure
6. **DUPLICATE_AUTH**: Device already has active session
7. **NO_ACTIVE_SESSION**: No class session for student
8. **PING_WITHOUT_SESSION**: PING received with no active session
9. **DUPLICATE_ATTENDANCE**: Student already marked present in session
10. **RECHECK_WITHOUT_SESSION**: RECHECK without active session
11. **SESSION_END_ERROR**: Failed to end session

---

## 4. DATABASE SCHEMA FOR ATTENDANCE

### 4.1 Core Attendance Models

#### **Session** (Represents a Class Period)
**File**: [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L169)

```prisma
model Session {
  id                  String   @id @default(uuid())
  courseId            String
  scheduledStartTime  DateTime
  scheduledEndTime    DateTime?
  actualStartTime     DateTime?
  actualEndTime       DateTime?
  sessionStatus       SessionStatus @default(SCHEDULED)
    // SCHEDULED | ACTIVE | COMPLETED
  createdAt           DateTime @default(now())
  
  // Relationships
  course              Course              @relation(fields: [courseId], references: [id])
  attendanceSessions  AttendanceSession[]
  
  @@index([courseId])
  @@index([sessionStatus])
}
```

#### **AttendanceSession** (Per-Student Attendance Per Session)
**File**: [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L189)

```prisma
model AttendanceSession {
  id                  String   @id @default(uuid())
  sessionId           String
  studentId           String
  deviceId            String
  sessionStartTime    DateTime
  lastPingTime        DateTime?
  sessionEndTime      DateTime?
  totalDurationSeconds Int     @default(0)
  sessionStatus       AttendanceSessionStatus @default(ACTIVE)
    // ACTIVE | ENDED
  reCheckFailureCount Int     @default(0)
  createdAt           DateTime @default(now())
  
  // Relationships
  session             Session             @relation(fields: [sessionId], references: [id])
  student             Student             @relation(fields: [studentId], references: [id])
  device              Device              @relation(fields: [deviceId], references: [id])
  attendanceRecords   AttendanceRecord[]
  
  @@index([deviceId])
  @@index([studentId])
  @@index([sessionId])
  @@index([sessionStatus])
}
```

#### **AttendanceRecord** (Event-Level Records)
**File**: [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L220)

```prisma
model AttendanceRecord {
  id                  String   @id @default(uuid())
  attendanceSessionId String
  studentId           String
  eventType           EventType  // AUTH | PING | RECHECK_OK | SESSION_END
  eventTimestamp      DateTime
  createdAt           DateTime @default(now())
  
  // Relationships
  attendanceSession   AttendanceSession @relation(fields: [attendanceSessionId], references: [id])
  student             Student           @relation(fields: [studentId], references: [id])
}
```

### 4.2 Relationship Diagram

```
Session (class period)
  ↓
  ├─→ Course (course info)
  │     └─→ Professor
  │
  └─→ AttendanceSession[] (per-student record)
        ├─→ Student
        ├─→ Device
        └─→ AttendanceRecord[] (event log)
```

### 4.3 Attendance Threshold Logic

**65% Rule for Marking Present:**
```javascript
sessionDurationSeconds = 
  (scheduledEndTime - scheduledStartTime) / 1000
  
attendanceThreshold = ceil(sessionDurationSeconds * 0.65)

isPresent = (studentTotalDurationSeconds >= attendanceThreshold)
```

**Applied in:**
1. [backend/src/routes/attendance.js](backend/src/routes/attendance.js#L385-L388) - Student history endpoint
2. [backend/src/routes/attendance.js](backend/src/routes/attendance.js#L421-L433) - Course analytics report
3. Frontend Analytics: Donut chart calculations

### 4.4 Enrollment Model

**Defines Course Enrollment:**
```prisma
model Enrollment {
  id        String   @id @default(uuid())
  studentId String
  courseId  String
  enrolledAt DateTime @default(now())
  
  student   Student @relation(fields: [studentId], references: [id])
  course    Course  @relation(fields: [courseId], references: [id])
  
  @@unique([studentId, courseId])
  @@index([studentId])
  @@index([courseId])
}
```

**Used to:**
- Verify student is enrolled before marking attendance
- Calculate total enrolled for course analytics
- Filter which courses appear for students

### 4.5 Device Model

```prisma
model Device {
  id              String   @id @default(uuid())
  deviceId        String   @unique // WB_001, WB_002
  studentId       String   @unique // One-to-one binding
  deviceStatus    DeviceStatus @default(ACTIVE)
  batteryLevel    Int      @default(100)
  lastPingAt      DateTime?
  assignedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  
  student         Student             @relation(fields: [studentId])
  attendanceSessions  AttendanceSession[]
  mqttEventLogs   MQTTEventLog[]
  anomalies       AnomalyLog[]
}
```

**One-to-One Binding:**
- Each device assigned to exactly one student
- Each student can have exactly one device
- Enforced by `@unique` constraint on `studentId`

### 4.6 Logging Models

#### **MQTTEventLog** (Raw Events)
```prisma
model MQTTEventLog {
  id              String   @id @default(uuid())
  deviceId        String
  eventType       EventType
  payload         Json     // Raw MQTT message
  processedAt     DateTime?
  status          String   @default("pending")  // pending | processed | failed
  errorMessage    String?
  createdAt       DateTime @default(now())
  
  device          Device   @relation(fields: [deviceId])
  
  @@index([createdAt])
  @@index([deviceId])
  @@index([status])
}
```

#### **AnomalyLog** (Detected Issues)
```prisma
model AnomalyLog {
  id              String   @id @default(uuid())
  studentId       String?
  deviceId        String?
  anomalyType     String   // "device_mismatch", "duplicate_auth", etc.
  description     String
  severity        AnomalySeverity  // LOW | MEDIUM | HIGH
  createdAt       DateTime @default(now())
  
  student         Student? @relation(fields: [studentId])
  device          Device?  @relation(fields: [deviceId])
  
  @@index([deviceId])
  @@index([studentId])
  @@index([createdAt])
  @@index([severity])
}
```

---

## 5. IMPLEMENTATION SUMMARY

### What Exists
✅ **Fully Implemented:**
- MQTT event capture and processing
- Real-time session tracking with 30-second timeout
- Attendance recording at AUTH/PING/RECHECK/SESSION_END events
- 65% threshold logic for marking present
- WebSocket broadcasting to professors
- Analytics calculations for admin/professor dashboards
- Session lifecycle management (SCHEDULED → ACTIVE → COMPLETED/ENDED)

### What's Missing
❌ **NOT Implemented:**
- **Manual Attendance Marking**: No professor interface to manually add/remove students
- **Batch Operations**: No bulk mark present/absent
- **Session Start/Pause**: Professors can only end sessions
- **Attendance Appeals**: No student appeal/override system
- **Custom Thresholds**: 65% is hardcoded, no admin settings
- **Export/Reports**: No PDF or CSV export functionality
- **Absence Notifications**: No automated alerts for absent students

### Key Files Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Attendance Routes | [backend/src/routes/attendance.js](backend/src/routes/attendance.js) | API endpoints for attendance operations |
| Admin Routes | [backend/src/routes/admin.js](backend/src/routes/admin.js) | Analytics overview endpoints |
| Event Processor | [backend/src/services/eventProcessor.js](backend/src/services/eventProcessor.js) | MQTT event handling & session lifecycle |
| MQTT Service | [backend/src/services/mqttService.js](backend/src/services/mqttService.js) | MQTT connection & subscriptions |
| WebSocket Service | [backend/src/services/websocketService.js](backend/src/services/websocketService.js) | Real-time session updates |
| Prisma Schema | [backend/prisma/schema.prisma](backend/prisma/schema.prisma) | Database models |
| Admin Analytics UI | [frontend/src/pages/admin/Analytics.jsx](frontend/src/pages/admin/Analytics.jsx) | System-wide analytics dashboard |
| Professor Analytics UI | [frontend/src/pages/professor/Analytics.jsx](frontend/src/pages/professor/Analytics.jsx) | Course-specific analytics |
| Live Attendance UI | [frontend/src/pages/professor/LiveAttendance.jsx](frontend/src/pages/professor/LiveAttendance.jsx) | Real-time session monitoring |
| Attendance Store | [frontend/src/store/attendanceStore.js](frontend/src/store/attendanceStore.js) | Zustand state management |
| useAttendance Hook | [frontend/src/hooks/useAttendance.js](frontend/src/hooks/useAttendance.js) | API fetching helper |

