# 🔌 WebSocket Specification - CampuSync Real-Time Events

**Status:** Day 0 - Agreement for Parallel Development  
**Version:** 1.0  
**Last Updated:** 14 April 2026  
**Tool:** Socket.io  
**Developers:** Dev A (Backend) & Dev B (Frontend)

---

## Overview

This document defines **exact WebSocket event formats** for real-time updates. Dev B can build UI listening to these events while Dev A implements the backend.

**CRITICAL:** Event names and data structure must match exactly.

---

## Connection Setup

### Frontend (Dev B)

```javascript
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL, {
  auth: {
    token: localStorage.getItem('authToken')
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

### Backend (Dev A)

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use((socket, next) => {
  // Authenticate using JWT token from auth object
  const token = socket.handshake.auth.token;
  // Verify and attach user to socket
  next();
});
```

---

## Room Structure

Students and Professors join room per session:

```
Room Name: `session-{sessionId}`
Example:   `session-sess-456`
```

All students and professor in same session receive events.

---

## Events: Session Lifecycle

### Event: `session-started`

**Emitted By:** Backend when professor starts session  
**Emit To:** All professors, all enrolled students  
**Trigger:** `POST /api/sessions/start`

**Payload:**
```json
{
  "type": "session-started",
  "data": {
    "sessionId": "sess-456",
    "courseId": "course-1",
    "courseName": "Data Structures",
    "professors": {
      "id": "prof-1",
      "name": "Dr. Sharma"
    },
    "sessionStartTime": "2026-04-14T10:30:45Z",
    "enrolledStudents": 45
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

**Frontend Handling:**
```javascript
socket.on('session-started', (data) => {
  console.log(`Session started: ${data.data.courseName}`);
  // Update UI to show active session
});
```

### Event: `session-ended`

**Emitted By:** Backend when professor ends session  
**Emit To:** All in that session room  
**Trigger:** `PATCH /api/sessions/:sessionId/end`

**Payload:**
```json
{
  "type": "session-ended",
  "data": {
    "sessionId": "sess-456",
    "sessionEndTime": "2026-04-14T11:30:45Z",
    "totalDurationSeconds": 3600,
    "attendanceCount": 42,
    "absentCount": 3
  },
  "timestamp": "2026-04-14T11:30:45.123Z"
}
```

**Frontend Handling:**
```javascript
socket.on('session-ended', (data) => {
  console.log('Session ended');
  // Update UI: disable duration counter, show completed state
});
```

---

## Events: Student Attendance

### Event: `student-joined`

**Emitted By:** Backend when student's MQTT device authenticates  
**Emit To:** Professor + all other students in session room  
**Trigger:** MQTT AUTH event received  
**Frequency:** Once per session per student

**Payload:**
```json
{
  "type": "student-joined",
  "data": {
    "attendanceSessionId": "attses-123",
    "studentId": "student-1",
    "student": {
      "name": "Arjun Sharma",
      "rollNumber": "2024001",
      "department": "CS"
    },
    "deviceId": "device-001",
    "sessionStartTime": "2026-04-14T10:31:00Z",
    "totalDurationSeconds": 5,
    "confidence": 98.5
  },
  "timestamp": "2026-04-14T10:31:00.123Z"
}
```

**Frontend Handling (Professor View):**
```javascript
socket.on('student-joined', (data) => {
  // Add student card to live attendance view
  console.log(`${data.data.student.name} joined`);
});
```

**Frontend Handling (Student View):**
```javascript
socket.on('student-joined', (data) => {
  if (data.data.studentId === currentUserId) {
    // Start duration counter
    startDurationCounter();
  }
});
```

### Event: `duration-update`

**Emitted By:** Backend on each MQTT PING event (every 10-15 seconds)  
**Emit To:** All in session room  
**Trigger:** MQTT PING received  
**Frequency:** Every 10-15 seconds per active student

**Payload:**
```json
{
  "type": "duration-update",
  "data": {
    "attendanceSessionId": "attses-123",
    "studentId": "student-1",
    "totalDurationSeconds": 125,
    "lastPingTime": "2026-04-14T10:33:15Z"
  },
  "timestamp": "2026-04-14T10:33:15.123Z"
}
```

**Frontend Handling:**
```javascript
socket.on('duration-update', (data) => {
  // Update student card duration display
  const student = students.find(s => s.studentId === data.data.studentId);
  if (student) {
    student.totalDurationSeconds = data.data.totalDurationSeconds;
    // Trigger re-render
  }
});
```

### Event: `student-left`

**Emitted By:** Backend when student session ends (session timeout or manual end)  
**Emit To:** All in session room  
**Trigger:** 30-second PING timeout OR professor ends session  
**Frequency:** Once per student at session end

**Payload:**
```json
{
  "type": "student-left",
  "data": {
    "attendanceSessionId": "attses-123",
    "studentId": "student-1",
    "totalDurationSeconds": 3600,
    "sessionEndTime": "2026-04-14T11:30:45Z",
    "attended": true
  },
  "timestamp": "2026-04-14T11:30:45.123Z"
}
```

**Frontend Handling:**
```javascript
socket.on('student-left', (data) => {
  // Remove from live list or mark as ended
  console.log(`Student left after ${data.data.totalDurationSeconds}s`);
});
```

---

## Events: MQTT Real-Time Monitoring (Admin)

### Event: `mqtt-event-received`

**Emitted By:** Backend when MQTT message parsed  
**Emit To:** Admin users in admin room  
**Trigger:** MQTT event arrives  
**Frequency:** Variable (per device activity)

**Payload:**
```json
{
  "type": "mqtt-event-received",
  "data": {
    "logId": "log-1",
    "deviceId": "device-001",
    "eventType": "AUTH",
    "studentId": "student-1",
    "sessionId": "sess-456",
    "rawPayload": {
      "fingerprint": 0.985,
      "confidence": 98.5
    },
    "processedStatus": "SUCCESS",
    "timestamp": "2026-04-14T10:31:00Z"
  },
  "timestamp": "2026-04-14T10:31:00.123Z"
}
```

**Frontend Handling (Admin MQTT Monitor):**
```javascript
socket.on('mqtt-event-received', (data) => {
  // Add to scrolling log display
  console.log(`MQTT: ${data.data.eventType} from ${data.data.deviceId}`);
});
```

### Event: `anomaly-detected`

**Emitted By:** Backend when anomaly logic triggers  
**Emit To:** Admin users  
**Trigger:** Anomalous event detected  
**Frequency:** Per anomaly

**Payload:**
```json
{
  "type": "anomaly-detected",
  "data": {
    "anomalyId": "anom-1",
    "anomalyType": "DUPLICATE_AUTH",
    "severity": "MEDIUM",
    "description": "Device device-001 authenticated twice in 5 seconds",
    "deviceId": "device-001",
    "studentId": "student-1",
    "sessionId": "sess-456",
    "timestamp": "2026-04-14T10:31:30Z"
  },
  "timestamp": "2026-04-14T10:31:30.123Z"
}
```

**Frontend Handling (Admin Anomalies):**
```javascript
socket.on('anomaly-detected', (data) => {
  // Add to anomalies list with severity color code
  console.log(`ALERT: ${data.data.anomalyType} (${data.data.severity})`);
});
```

---

## Events: System Status

### Event: `connection-status`

**Emitted By:** Backend on any connection change  
**Emit To:** Requesting client  
**Trigger:** Connection/disconnection events

**Payload:**
```json
{
  "type": "connection-status",
  "data": {
    "mqtt": {
      "connected": true,
      "lastConnectionTime": "2026-04-14T10:00:00Z"
    },
    "database": {
      "connected": true
    },
    "timestamp": "2026-04-14T10:30:45.123Z"
  }
}
```

---

## Client Methods (Emits)

### Method: `join-session`

**Emitted By:** Frontend (Professor or Student)  
**Listened By:** Backend  
**Usage:** When professor/student wants to join session room

**Emit:**
```javascript
socket.emit('join-session', {
  sessionId: 'sess-456'
});
```

**Backend Response:**
```javascript
socket.on('join-session', (data) => {
  socket.join(`session-${data.sessionId}`);
  socket.emit('joined-session-success', {
    sessionId: data.sessionId,
    message: 'Successfully joined session'
  });
});
```

### Method: `leave-session`

**Emitted By:** Frontend  
**Listened By:** Backend  
**Usage:** When professor/student leaves session

**Emit:**
```javascript
socket.emit('leave-session', {
  sessionId: 'sess-456'
});
```

### Method: `subscribe-admin`

**Emitted By:** Admin dashboard  
**Listened By:** Backend  
**Usage:** Subscribe to admin events (MQTT logs, anomalies)

**Emit:**
```javascript
socket.emit('subscribe-admin', {
  topics: ['mqtt-events', 'anomalies', 'system-status']
});
```

---

## Reconnection Logic

### Frontend Reconnection

```javascript
socket.on('connect', () => {
  console.log('Reconnected');
  // Re-join previous rooms
  const sessionId = getCurrentSessionId();
  if (sessionId) {
    socket.emit('join-session', { sessionId });
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected - will auto-reconnect');
  // Show warning toast
  toast.warning('Connection lost - reconnecting...');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  toast.error('Connection error');
});
```

---

## Testing WebSocket

### Using Browser Console

```javascript
// Connect
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

// Listen for events
socket.on('student-joined', (data) => console.log('Student joined:', data));

// Emit event
socket.emit('join-session', { sessionId: 'sess-456' });

// Disconnect
socket.disconnect();
```

### Using Node.js Test Script

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: { token: 'test-token' }
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join-session', { sessionId: 'sess-456' });
});

socket.on('student-joined', (data) => {
  console.log('Event received:', data);
});
```

---

## Performance Considerations

1. **Duration Updates:** Backend sends `duration-update` every 10-15 seconds (scope: MQTT PING interval)
2. **Live Attendance Limit:** Max 200 students per session (UI optimization needed beyond this)
3. **MQTT Log Streaming:** Max 10 events/second to prevent UI lag
4. **Room Size:** Each session room should not exceed 300 users

---

## Error Scenarios

### Student Joins After Session Ended

**Scenario:** Student device authenticates 5 seconds after professor ended session

**Dev A Handling:**
```
- Check if session still ACTIVE
- If ended, don't create AttendanceSession
- Log as anomaly
- Emit: anomaly-detected (LATE_AUTH)
```

**Dev B Handling:**
```
- Receive anomaly-detected event
- Don't add student to live list
- Show alert in MQTT monitor
```

### Network Split (WebSocket Lost)

**Scenario:** Frontend loses connection mid-session

**Frontend:**
- Show "Connection Lost" banner
- Auto-reconnect attempts
- Re-join previous session upon reconnect

**Backend:**
- Treat disconnected client as listener dropped
- Session continues (not affected)
- Client receives missed events upon reconnect (depends on Socket.io history)

---

**Version Control:** This spec is locked for Day 0-1. Any changes require mutual agreement. Update timestamp with modifications.

