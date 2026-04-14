# 🎯 DAY 2: DEVELOPER_B GOALS & OUTCOMES

**Date:** April 14, 2026  
**Developer:** Developer B (Frontend)  
**Duration:** ~5 hours  
**Status:** ⏳ In Progress

---

## 📋 Day 2 Overview

**Objective:** Build the complete Student Dashboard with real-time session tracking and attendance history.

**Key Achievement:** Student can log in and immediately see:
1. Current active attendance session (if any)
2. Real-time session duration counter
3. Complete attendance history with filters
4. Course enrollment information

---

## 👥 ROLE-BASED FUNCTIONALITY MATRIX

### 🎓 STUDENT (After Day 2)

#### Can NOW Do:
- ✅ **Login with credentials**
  - Uses: Email + Password
  - Gets: JWT token + User profile
  - Redirects: Student Dashboard

- ✅ **View Current Session**
  - Shows course name & session duration
  - Real-time countdown timer (updates every second)
  - Session status badge (ACTIVE / NO ACTIVE SESSION)
  - Display format:
    ```
    📚 Current Session
    Course: Data Structures
    Duration: 45 mins 23 secs
    Status: Active
    ```

- ✅ **View Attendance History**
  - List of all past sessions
  - Pagination (20 sessions per page)
  - Sortable by date (newest first)
  - Display fields:
    - Course Name
    - Date & Time
    - Duration
    - Attendance Status (Present/Absent)
  - Filter by course (dropdown)

- ✅ **Quick Stats Card**
  - Total classes attended
  - Total attendance percentage
  - Current streak (consecutive attended)

- ✅ **Course Enrollment View**
  - List of enrolled courses
  - Course code, professor name, department
  - Clickable to see detailed attendance per course

#### Cannot Yet Do (Waiting for Dev A Day 3+):
- ❌ Mark attendance manually
- ❌ Real-time WebSocket updates (coming Day 3)
- ❌ Exit session option (MQTT device required)

---

### 👨‍🏫 PROFESSOR (After Day 2)

#### Can NOW Do:
- ✅ **Login with professor credentials**
  - Email: prof1@campusync.com
  - Redirects: Professor Course Management page

- ✅ **View My Courses**
  - List: Course code, name, department, student count
  - Start Session button (currently disabled - needs backend)

- ✅ **View Course Details**
  - Enrolled students list
  - Class schedule
  - General course information

#### Cannot Yet Do (Waiting for Dev A Day 4+):
- ❌ Start/End attendance session (backend endpoint missing)
- ❌ Live attendance board (needs WebSocket)
- ❌ Real-time analytics

---

### 🔐 ADMIN (After Day 2)

#### Can NOW Do:
- ✅ **Login with admin credentials**
  - Email: admin@campusync.com
  - Redirects: Admin Dashboard

- ✅ **View Active Sessions Dashboard**
  - Count of currently active sessions
  - Quick stats cards:
    - Total students in classes now
    - Total classes running now
    - Average class size

- ✅ **View Device Registry (Placeholder)**
  - Show available devices (from seed data)
  - Device status (placeholder)

#### Cannot Yet Do (Waiting for Dev A Day 5+):
- ❌ Real-time MQTT event monitoring (needs WebSocket)
- ❌ Anomaly detection logs
- ❌ Live attendance analytics

---

## 🎯 SPECIFIC FUNCTIONALITY TARGETS

### Task B2.1: Current Session Display Component ✅

**What gets built:**
```
┌─────────────────────────────────────────┐
│  📚 Current Session                     │
├─────────────────────────────────────────┤
│  Course: Data Structures (CS101)        │
│  Professor: Dr. Sharma                  │
│  Location: Lab 5                        │
│  Started at: 10:00 AM                   │
│  Duration: 00:45:23 (live timer)       │
│  Status: ✅ ACTIVE                      │
│                                         │
│  [ Exit Session ]                       │
└─────────────────────────────────────────┘

OR (if no active session):

┌─────────────────────────────────────────┐
│  📚 Current Session                     │
├─────────────────────────────────────────┤
│  No active session at the moment        │
│  Next class: 11:30 AM (Data Structures) │
└─────────────────────────────────────────┘
```

**Technical requirements:**
- Fetch from: `GET /api/attendance/current`
- Real-time timer using `setInterval()` every 1 second
- Display format: `MM:SS` or `HH:MM:SS`
- Error handling: Show "Session unavailable" if API returns 500
- Refresh: Polls API every 30 seconds for changes

---

### Task B2.2: Attendance History & Stats ✅

**What gets built:**
```
┌──────────────────────────────────────────────────┐
│  📊 Attendance Statistics                        │
├──────────────────────────────────────────────────┤
│  Total Classes: 45    │   Attended: 42           │
│  Attendance %: 93.3%  │   Streak: 12 days       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  📋 Attendance History                           │
├──────────────────────────────────────────────────┤
│  [Filter by: All Courses ▼]                      │
├──────────────────────────────────────────────────┤
│  Date        | Course    | Duration | Status     │
│  14 Apr 2026 | DS (CS101)| 45 mins  | ✅ Present │
│  13 Apr 2026 | DB (CS201)| 50 mins  | ✅ Present │
│  13 Apr 2026 | Web (CS301)| —       | ❌ Absent  │
│  12 Apr 2026 | DS (CS101)| 48 mins  | ✅ Present │
│  ...         | ...       | ...      | ...        │
│                                                   │
│  [← Previous] Page 1 of 5 [Next →]               │
└──────────────────────────────────────────────────┘
```

**Technical requirements:**
- Fetch from: `GET /api/attendance/history?limit=20&offset=0`
- Pagination: 20 items per page
- Sorting: By date (newest first)
- Filter dropdown: Filter by course
- Status badge: ✅ (present) or ❌ (absent)

---

### Task B2.3: Enrolled Courses View ✅

**What gets built:**
```
┌──────────────────────────────────────────────────┐
│  📚 My Courses                                   │
├──────────────────────────────────────────────────┤
│  [+ Enroll in Course]  [Filter ▼]                │
├──────────────────────────────────────────────────┤
│  Course Code | Course Name      | Professor    │
│  CS101       | Data Structures  | Dr. Sharma   │
│  CS201       | Database Design  | Dr. Patel    │
│  CS301       | Web Development  | Dr. Gupta    │
│                                                   │
│  Click on course for detailed attendance        │
└──────────────────────────────────────────────────┘
```

**Technical requirements:**
- Fetch from: `GET /api/courses`
- Student sees only enrolled courses
- Clickable rows (for future detail view)

---

## 📊 API DEPENDENCIES (From Dev A)

All endpoints below must be complete by Dev A for Day 2 to work:

| Endpoint | Method | Status | Dev A Task |
|----------|--------|--------|-----------|
| `/api/attendance/current` | GET | ✅ Available | Completed |
| `/api/attendance/history` | GET | ✅ Available | Completed |
| `/api/courses` | GET | ✅ Available | Completed |

**Status Check:** Backend has already implemented these (Dev A Days 1-4 DONE)

---

## 🧪 TESTING CHECKLIST (Day 2)

### Unit Tests:
- [ ] Timer increments correctly every second
- [ ] Timer resets when new session is detected
- [ ] Pagination buttons work (next/previous)
- [ ] Course filter dropdown filters correctly
- [ ] API error responses handled gracefully

### Integration Tests:
- [ ] Login → Dashboard redirect works
- [ ] Current session data displays correctly
- [ ] History list populates from API
- [ ] Stats calculations correct
- [ ] Loading states show while fetching

### Manual Testing:
- [ ] Login with `student1@campusync.com`
- [ ] Verify dashboard loads with data
- [ ] Check timer is running
- [ ] Scroll history and test pagination
- [ ] Test course filter
- [ ] Logout and verify redirect to login

---

## 📦 DELIVERABLES (End of Day 2)

### Code Delivered:
1. ✅ `frontend/src/pages/student/Dashboard.jsx` (~400 lines)
   - Current session display
   - Real-time timer
   - Stats cards
   - Course list

2. ✅ `frontend/src/pages/student/Attendance.jsx` (~350 lines)
   - Attendance history table
   - Pagination controls
   - Course filter dropdown
   - Status badges

3. ✅ `frontend/src/components/SessionCard.jsx` (~150 lines)
   - Reusable session display component
   - Timer logic
   - Status indicators

4. ✅ `frontend/src/hooks/useAttendance.js` (Enhanced)
   - `useCurrentSession()` hook
   - `useHistoryList()` hook
   - `useStats()` hook
   - Error handling

### Files Modified:
- `frontend/src/App.jsx` (route registration)
- `frontend/src/store/attendanceStore.js` (new data structure)

### Tests Created:
- `frontend/src/__tests__/SessionCard.test.jsx` (optional Day 2)
- `frontend/src/__tests__/Dashboard.test.jsx` (optional Day 2)

---

## ✅ SUCCESS CRITERIA

After Day 2, **EVERY** student should be able to:

1. ✅ **Access Student Dashboard immediately after login**
   - No errors, page loads within 2 seconds
   - Current session displayed prominently

2. ✅ **See real-time session duration**
   - Timer running and incrementing every second
   - Format is human-readable (MM:SS)

3. ✅ **View complete attendance history**
   - At least 10+ historical records displayed
   - Pagination working (if >20 records)
   - Filter by course functional

4. ✅ **View all enrolled courses**
   - Course list shows all registrations
   - Professor names displayed

5. ✅ **See attendance statistics**
   - Attendance percentage calculated correctly
   - Total attended count accurate
   - Current streak counted correctly

---

## 🚀 Next Steps After Day 2

**Day 3 (Professor Dashboard):**
- Professor can start/end attendance sessions
- Real-time student list with WebSocket
- Live attendance board

**Day 4 (Admin Dashboard):**
- Active sessions monitoring
- MQTT event log viewer (WebSocket)
- Device registry management

**Day 5 (Charts & Analytics):**
- Attendance trend charts (Recharts)
- Department-wide analytics
- Performance metrics

---

## 📝 NOTES

- ⚠️ Some features require Dev A's backend (already completed)
- 🔄 All API responses follow `API_CONTRACT.md` format
- 🎨 UI uses TailwindCSS with dark/light mode support
- ⚡ No external charting libraries needed for Day 2
- 🔒 All endpoints require JWT authentication

---

**Ready to start Building Day 2? ✅**
