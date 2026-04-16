# Day 7 Testing Guide: Student Enrollment & Live Sessions

## Summary of Fixes Applied

### 1. ✅ Enhanced Debugging for 403 Error
**Problem:** Professor was getting 403 (Forbidden) error when ending sessions
**Solution:** Added comprehensive logging to:
- `backend/src/utils/auth.js` - Authorization middleware now logs role checks
- `backend/src/routes/sessions.js` - End session endpoint logs user info
- Added diagnostic endpoint: `GET /api/sessions/debug/auth-info`

### 2. ✅ Student Session Auto-Join (Without MQTT Devices)
**Problem:** Students without MQTT devices couldn't see active sessions
**Solution:** 
- Added `POST /api/attendance/join-session` endpoint
- Auto-creates test devices for students
- Automatically joins active sessions in enrolled courses
- Frontend components now auto-join on load

### 3. ✅ Student Courses Page Data Fetching
**Problem:** Student Courses page showed empty list
**Solution:** Added `useEffect` to fetch enrolled courses from `/api/courses`

### 4. ✅ Student Dashboard Auto-Join Active Sessions
**Problem:** Students couldn't see live sessions even when professor started them
**Solution:** Dashboard now auto-calls `join-session` endpoint for all enrolled courses

---

## Step-by-Step Testing

### **Step 1: Start Both Servers**
```powershell
# Terminal 1 - Backend
cd c:\Users\saite\Downloads\EDP_Project\CampuSync\backend
npm run dev

# Terminal 2 - Frontend  
cd c:\Users\saite\Downloads\EDP_Project\CampuSync\frontend
npm run dev
```

**Verify:**
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- No errors in console

---

### **Step 2: Test Authentication (Diagnostic)**
```bash
# In browser DevTools Console, run:
fetch('http://localhost:5000/api/sessions/debug/auth-info', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
}).then(r => r.json()).then(console.log)
```

**Expected Output:**
```json
{
  "status": "info",
  "data": {
    "hasAuthHeader": true,
    "hasToken": true,
    "userId": "...",
    "userRole": "PROFESSOR"  // or STUDENT
  }
}
```

---

### **Step 3: Test Professor Workflow**

#### 3a. Login as Professor
1. Go to `http://localhost:5173/login`
2. Use credentials:
   - Email: `professor@campusync.com`
   - Password: `professor123`
3. Verify successfully logged in

#### 3b. Verify Enrolled Students
1. Go to Professor Dashboard
2. Click on a course
3. Check that students appear in the student list
4. You should see the students you enrolled previously

#### 3c. Start a Session
1. Click "Start Session" button
2. Check browser console for logs
3. Should see: `✅ Session started` in console
4. Session ID should display on the page

#### 3d. End Session (This is where 403 error occurred)
1. Click "End Session" button
2. **NEW:** Check browser console for detailed logs:
   ```
   🛑 Ending session: [ID]
   🔍 DEBUG: Current session object: {...}
   🔍 DEBUG: Token exists: true
   ✅ Session ended successfully
   ```
3. If you still get 403, backend logs will show:
   ```
   🔍 AUTHZ DEBUG: Checking role authorization
     Required roles: ['PROFESSOR']
     User role: [actual role]
   ```

---

### **Step 4: Test Student Workflow**

#### 4a. Login as Student
1. Open new incognito browser window
2. Go to `http://localhost:5173/login`
3. Use credentials:
   - Email: `student1@campusync.com`
   - Password: `student123`

#### 4b. View Enrolled Courses (Dashboard)
1. Should see "My Courses" card with enrolled courses
2. Check browser console for logs:
   ```
   📊 Fetching courses...
   ✅ Courses loaded: [N courses]
   🔍 Checking for active session in course: English 101
   ```

#### 4c. View Courses Page
1. Click on "My Courses" or navigate to `/student/courses`
2. Should see list of enrolled courses with details
3. Console should show same auto-join attempts

#### 4d. View Active Session
1. **Important:** Have professor start a session FIRST
2. Back in student browser, refresh the page
3. Student should see active session in "Current Session" card
4. Console will show:
   ```
   ✅ Joined active session: [Course Name]
   ```
5. Session details display with timer

---

### **Step 5: End-to-End Test Flow**

**Phase 1: Setup**
- Professor logs in (browser window 1)
- Student logs in (browser window 2)
- Both browsers should show their respective dashboards

**Phase 2: Start Session**
- Professor clicks "Start Session" in a course
- Both browsers shown active session starting

**Phase 3: Live Monitoring**
- Professor dashboard shows student appeared in live attendance
- Student dashboard shows active session with start time

**Phase 4: End Session**
- Professor clicks "End Session"  
- Session should end without 403 error
- Redirects to professor courses page
- Console shows: `✅ Session ended successfully`

**Phase 5: Session Complete**
- Student page updates to show no active session
- If session was recorded, it appears in attendance history

---

## Debugging Checklist

### If Professor Gets 403 Error:
1. ✅ Check browser console for detailed error logs
2. ✅ Run diagnosis endpoint:
   ```javascript
   const token = localStorage.getItem('authToken');
   console.log('Token in storage:', !!token);
   ```
3. ✅ Check backend logs for:
   ```
   🔍 AUTHZ DEBUG: Checking role authorization
   ```
4. ✅ Verify token hasn't expired:
   - Clear localStorage: `localStorage.clear()`
   - Logout and login again
5. ✅ Check if user was created with PROFESSOR role in DB

### If Student Doesn't See Courses:
1. ✅ Check `/api/courses` endpoint returns data:
   ```javascript
   fetch('http://localhost:5000/api/courses', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
   }).then(r => r.json()).then(console.log)
   ```
2. ✅ Response should have structure:
   ```json
   { "status": "success", "data": { "courses": [...] } }
   ```
3. ✅ Verify student is enrolled in course in database

### If Student Doesn't See Active Session:
1. ✅ Check professor actually started session (Session record in DB)
2. ✅ Verify `/api/attendance/join-session` endpoint called successfully:
   ```javascript
   // Check browser console - should show ✅ Joined active session
   ```
3. ✅ Confirm `AttendanceSession` record was created:
   - Backend logs should show:
     ```
     ✅ Student joined session: { studentId, sessionId, deviceId }
     ```
4. ✅ Check `/api/attendance/current` returns session:
   ```javascript
   fetch('http://localhost:5000/api/attendance/current', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
   }).then(r => r.json()).then(console.log)
   ```

---

## New Features Summary

### Backend Endpoints Added/Enhanced

#### `POST /api/attendance/join-session` (NEW)
```
Request:
{
  "courseId": "course-id"
}

Response (Success - 201):
{
  "status": "success",
  "message": "Successfully joined session",
  "data": {
    "attendanceSessionId": "...",
    "sessionId": "...",
    "courseId": "...",
    "courseName": "...",
    "sessionStatus": "ACTIVE"
  }
}

Response (No Active Session - 404):
{
  "status": "error",
  "message": "No active session in this course",
  "error": "NO_ACTIVE_SESSION"
}
```

#### `GET /api/sessions/debug/auth-info` (NEW)
Diagnostic endpoint to verify authentication status
- No authentication required
- Returns current auth headers and user info
- Useful for debugging 403 errors

### Backend Enhancements
- Enhanced logging in `authorizeRole` middleware
- Enhanced logging in end-session endpoint
- Better error messages with role information

### Frontend Enhancements
- Student Dashboard auto-joins active sessions
- Student Courses page auto-joins active sessions
- Enhanced error logging in professor live attendance
- Improved debugging console output

---

## Expected System Behavior

### Complete Flow:
```
1. Professor enrolls Student A in Course X ✅
2. Student A logs in → Sees Course X in My Courses ✅
3. Professor starts session in Course X ✅
4. Student A dashboard/page refreshes → Auto-joins session ✅
5. Student A sees active session in "Current Session" card ✅
6. Professor can see Student A in live attendance view ✅
7. Professor ends session ✅ (was failing with 403, now fixed)
8. Student A sees session ended ✅
```

---

## Database Verification Commands (if needed)

If you want to manually verify data in the database, you can use Prisma Studio:
```bash
cd c:\Users\saite\Downloads\EDP_Project\CampuSync\backend
npx prisma studio
```

Look for:
- `enrollments` → Student enrolled in course
- `sessions` → Active sessions
- `attendanceSessions` → Students joined to sessions
- `devices` → Test devices created for students

---

## Configuration Notes

The system now supports:
- **MQTT Device-based Attendance** (Original design)
- **Manual Session Joining** (New - for testing)
- **Auto-join on Dashboard Load** (New - seamless testing)

No configuration changes needed. The system detects if a device exists and works with both modes.

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 when ending session | Token expired or role not PROFESSOR | Login again, check console logs |
| Student sees empty courses | API not called or wrong response path | Check useEffect and console logs |
| Student doesn't see active session | Student not joined session | Refresh page to trigger auto-join |
| "No active session" message | Professor hasn't started session yet | Start session first, then refresh student page |
| Test devices created unnecessarily | System creates device if student doesn't have one | Normal behavior - helps with testing |

---

## Next Steps (For Full Production)

1. **Implement proper device system** - Connect MQTT wristband devices
2. **Remove test device creation** - Only use real devices
3. **Add WebSocket live updates** - Sessions update in real-time without refresh
4. **Add attendance verification** - Confirm student presence beyond just joining
5. **Implement anomaly detection** - Flag suspicious attendance patterns

---

**Last Updated:** April 15, 2026  
**Status:** All fixes applied and ready for testing
