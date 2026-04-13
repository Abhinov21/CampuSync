# 📋 API Contract - CampuSync

**Status:** Day 0 - Agreement for Parallel Development  
**Version:** 1.0  
**Last Updated:** 14 April 2026  
**Developers:** Dev A (Backend) & Dev B (Frontend)

---

## Overview

This document defines the **exact API response formats** both developers agree to use. This allows Dev B to build frontend with mock data while Dev A implements the backend.

**CRITICAL:** Any deviation from these formats must be discussed in 10-minute daily sync.

---

## General Response Format

All successful API responses follow this structure:

```json
{
  "status": "success" | "error",
  "message": "Human-readable message",
  "data": { /* actual response data */ },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

HTTP Status Codes:
- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

---

## Authentication

### Request Header Format

```
Authorization: Bearer {token}
Content-Type: application/json
```

### POST /auth/login

**Request:**
```json
{
  "email": "student1@campusync.com",
  "password": "student123"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-1",
      "email": "student1@campusync.com",
      "role": "STUDENT",
      "profile": {
        "name": "Arjun Sharma",
        "rollNumber": "2024001",
        "department": "CS"
      }
    }
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

**Error (401 Unauthorized):**
```json
{
  "status": "error",
  "message": "Invalid email or password",
  "error": "INVALID_CREDENTIALS",
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### POST /auth/register

**Request:**
```json
{
  "email": "newstudent@campusync.com",
  "password": "password123",
  "role": "STUDENT",
  "name": "New Student",
  "rollNumber": "2024099",
  "department": "CS"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { /* same as login response */ }
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

---

## Student Endpoints

### GET /api/attendance/current

**Description:** Get current active session for logged-in student

**Request:**
```
GET /api/attendance/current
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Current session fetched",
  "data": {
    "currentSession": {
      "id": "sess-123",
      "courseId": "course-1",
      "courseName": "Data Structures",
      "studentId": "student-1",
      "deviceId": "device-1",
      "sessionStartTime": "2026-04-14T10:00:00Z",
      "totalDurationSeconds": 1845,
      "sessionStatus": "ACTIVE",
      "lastPingTime": "2026-04-14T10:30:45Z"
    }
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

**Response (404 Not Found) - if no active session:**
```json
{
  "status": "success",
  "message": "No active session",
  "data": {
    "currentSession": null
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### GET /api/attendance/history

**Description:** Get all past sessions for student

**Request:**
```
GET /api/attendance/history?limit=20&offset=0
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Attendance history fetched",
  "data": {
    "sessions": [
      {
        "id": "sess-123",
        "courseId": "course-1",
        "courseName": "Data Structures",
        "sessionStartTime": "2026-04-13T10:00:00Z",
        "sessionEndTime": "2026-04-13T11:00:00Z",
        "totalDurationSeconds": 3600,
        "sessionStatus": "ENDED",
        "attendancePercentage": 95
      },
      {
        "id": "sess-124",
        "courseId": "course-2",
        "courseName": "Algorithms",
        "sessionStartTime": "2026-04-13T14:00:00Z",
        "sessionEndTime": "2026-04-13T15:30:00Z",
        "totalDurationSeconds": 2700,
        "sessionStatus": "ENDED",
        "attendancePercentage": 85
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### GET /api/courses

**Description:** Get all courses student is enrolled in

**Request:**
```
GET /api/courses
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Courses fetched",
  "data": {
    "courses": [
      {
        "id": "course-1",
        "code": "CS101",
        "name": "Data Structures",
        "credits": 3,
        "semester": "4",
        "professor": {
          "id": "prof-1",
          "name": "Dr. Sharma"
        },
        "enrollmentStatus": "ACTIVE",
        "totalSessions": 20,
        "attendedSessions": 19,
        "attendancePercentage": 95
      }
    ],
    "total": 4
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

---

## Professor Endpoints

### GET /api/courses/my-courses

**Description:** Get courses taught by professor

**Request:**
```
GET /api/courses/my-courses
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Courses fetched",
  "data": {
    "courses": [
      {
        "id": "course-1",
        "code": "CS101",
        "name": "Data Structures",
        "credits": 3,
        "semester": "4",
        "enrolledStudents": 45,
        "totalSessions": 20
      }
    ],
    "total": 3
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### POST /api/sessions/start

**Description:** Start new attendance session for a course

**Request:**
```json
{
  "courseId": "course-1"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Session started",
  "data": {
    "session": {
      "id": "sess-456",
      "courseId": "course-1",
      "courseName": "Data Structures",
      "sessionStartTime": "2026-04-14T10:30:45Z",
      "sessionStatus": "ACTIVE",
      "enrolledStudents": 45
    }
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### PATCH /api/sessions/:sessionId/end

**Description:** End attendance session

**Request:**
```json
{
  "sessionId": "sess-456"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Session ended",
  "data": {
    "session": {
      "id": "sess-456",
      "courseId": "course-1",
      "sessionStartTime": "2026-04-14T10:30:45Z",
      "sessionEndTime": "2026-04-14T11:30:45Z",
      "sessionStatus": "ENDED",
      "studentAttendance": [
        {
          "studentId": "student-1",
          "name": "Arjun Sharma",
          "attended": true,
          "durationSeconds": 3600,
          "attendancePercentage": 100
        }
      ]
    }
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### GET /api/sessions/:sessionId/live

**Description:** Get live attendance data for ongoing session

**Request:**
```
GET /api/sessions/sess-456/live
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Live attendance fetched",
  "data": {
    "session": {
      "id": "sess-456",
      "courseName": "Data Structures",
      "sessionStartTime": "2026-04-14T10:30:45Z",
      "sessionStatus": "ACTIVE"
    },
    "attendanceSessions": [
      {
        "id": "attsess-1",
        "studentId": "student-1",
        "student": {
          "name": "Arjun Sharma",
          "rollNumber": "2024001"
        },
        "sessionStartTime": "2026-04-14T10:31:00Z",
        "totalDurationSeconds": 850,
        "lastPingTime": "2026-04-14T10:45:00Z",
        "status": "ACTIVE"
      }
    ]
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### GET /api/sessions/:sessionId/report

**Description:** Get attendance report for ended session

**Request:**
```
GET /api/sessions/sess-456/report
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Report generated",
  "data": {
    "session": {
      "id": "sess-456",
      "courseName": "Data Structures",
      "sessionStartTime": "2026-04-14T10:30:45Z",
      "sessionEndTime": "2026-04-14T11:30:45Z"
    },
    "report": {
      "totalEnrolled": 45,
      "attended": 42,
      "absent": 3,
      "attendancePercentage": 93.3,
      "averageDuration": 3560,
      "shortestDuration": 1800,
      "longestDuration": 3600,
      "students": [
        {
          "studentId": "student-1",
          "name": "Arjun Sharma",
          "rollNumber": "2024001",
          "attended": true,
          "durationSeconds": 3600
        }
      ]
    }
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

---

## Admin Endpoints

### GET /api/admin/sessions/active

**Description:** Get all active sessions across system

**Request:**
```
GET /api/admin/sessions/active
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Active sessions fetched",
  "data": {
    "activeSessions": [
      {
        "id": "sess-456",
        "courseId": "course-1",
        "courseName": "Data Structures",
        "professorName": "Dr. Sharma",
        "sessionStartTime": "2026-04-14T10:30:45Z",
        "enrolledStudents": 45,
        "presentCount": 42,
        "absentCount": 3
      }
    ],
    "total": 5
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### GET /api/admin/mqtt-logs

**Description:** Get MQTT event logs

**Request:**
```
GET /api/admin/mqtt-logs?limit=100&offset=0
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "MQTT logs fetched",
  "data": {
    "logs": [
      {
        "id": "log-1",
        "deviceId": "device-001",
        "eventType": "AUTH",
        "studentId": "student-1",
        "confidence": 98.5,
        "timestamp": "2026-04-14T10:45:00Z",
        "processed": true
      },
      {
        "id": "log-2",
        "deviceId": "device-001",
        "eventType": "PING",
        "sessionId": "sess-456",
        "timestamp": "2026-04-14T10:45:15Z",
        "processed": true
      }
    ],
    "total": 1250,
    "limit": 100,
    "offset": 0
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### GET /api/admin/anomalies

**Description:** Get detected anomalies/alerts

**Request:**
```
GET /api/admin/anomalies?limit=50
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Anomalies fetched",
  "data": {
    "anomalies": [
      {
        "id": "anom-1",
        "type": "DUPLICATE_AUTH",
        "severity": "MEDIUM",
        "description": "Student device-001 authenticated twice in 5 seconds",
        "deviceId": "device-001",
        "studentId": "student-1",
        "sessionId": "sess-456",
        "timestamp": "2026-04-14T10:45:30Z"
      },
      {
        "id": "anom-2",
        "type": "DEVICE_MISMATCH",
        "severity": "HIGH",
        "description": "Device device-002 bound to student-5 but student-7 authenticated",
        "deviceId": "device-002",
        "timestamp": "2026-04-14T10:46:00Z"
      }
    ],
    "total": 15
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

### GET /api/admin/devices

**Description:** Get all device registry

**Request:**
```
GET /api/admin/devices
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Devices fetched",
  "data": {
    "devices": [
      {
        "id": "device-001",
        "deviceId": "WRISTBAND_001",
        "status": "ACTIVE",
        "studentId": "student-1",
        "studentName": "Arjun Sharma",
        "batteryLevel": 85,
        "lastActiveTime": "2026-04-14T10:45:30Z"
      }
    ],
    "total": 120
  },
  "timestamp": "2026-04-14T10:30:45.123Z"
}
```

---

## Important Notes for Implementation

### Dev A (Backend):

1. **Token Format:** Follow standard JWT format with payload containing `userId`, `role`, `email`
2. **Timestamps:** Always use ISO 8601 format with Z suffix (UTC)
3. **UUIDs:** Use `uuid()` for all IDs
4. **Error Handling:** Return appropriate HTTP status codes
5. **CORS:** Enable CORS for `http://localhost:5173` (Dev B's frontend)

### Dev B (Frontend):

1. **Token Storage:** Store JWT in `localStorage` with key `authToken`
2. **API Client:** Use axios with interceptor to add Authorization header
3. **Mock Data:** Until Dev A API is ready, use mock responses in same format
4. **Error Display:** Show user-friendly error messages from `message` field

---

## Testing the API

**With curl:**
```bash
# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@campusync.com","password":"student123"}'

# Current session (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/attendance/current
```

**With Postman:**
1. Import collection from QUICK_REFERENCE.md
2. Set {{baseUrl}} to `http://localhost:5000`
3. Set {{token}} after login

---

**Version Control:** This contract is locked for Day 0-1. Changes after Day 1 require mutual agreement. Update timestamp with any modifications.

