# Testing Guide for Analytics Fixes

## Overview
Three critical bugs have been fixed in the manual attendance marking system:
1. **Attendance Calculation**: Now shows "4/5" instead of "4/4" when 4 of 5 students marked
2. **Duration Display**: Now shows actual session runtime instead of hardcoded "60m"
3. **Missing Endpoint**: Added `/api/sessions/all-active` endpoint that was returning 404

## Changes Made

### Backend Changes
**File**: `backend/src/routes/attendance.js`
- Modified `/api/attendance/course/:courseId/report` endpoint
- Added `totalEnrolledCount` query from Enrollment table (gets ACTUAL total enrolled)
- Changed all denominator calculations from `session.attendanceSessions.length` to `totalEnrolledCount`
- Added `sessionDurationSeconds` calculation (actual runtime, not hardcoded)
- Fixed absent count: `totalEnrolledCount - attendanceCount`

**File**: `backend/src/routes/sessions.js`
- Added new `/api/sessions/all-active` endpoint
- Returns all currently active sessions across professor's courses
- Includes present count and total enrolled per session

### Frontend Changes
**File**: `frontend/src/pages/professor/Analytics.jsx`
- Line 442: Changed from `session.avgDuration` to `session.sessionDurationSeconds`
- Line 430: Updated attendance display to use `session.totalEnrolled` instead of `stats.totalStudents`

## Step-by-Step Testing

### Test 1: Verify Endpoint Updates
1. Open browser DevTools → Console
2. Look for any 404 errors for `/api/sessions/all-active`
3. Expected: No 404 errors should appear

### Test 2: Manual Marking Flow
1. Navigate to professor dashboard
2. Click "Start Session" for a course
3. Click "📋 Manual Marking" button
4. Mark 3-4 students as "Present"
5. Click "End Session"
6. Navigate to Analytics for that course
7. Find the session in "Session History" table

**Expected Results for Test 2:**
- Attendance column should show: `3/5` (not `3/3` or `4/4`)
- Percentage should show: `60%` (not `100%`)
- Duration should show: actual runtime (e.g., `2m 15s`, not `60m`)

### Test 3: Multiple Manual Markings
1. In a new session, mark 2 students as present
2. End session
3. Start another session (same course)
4. Mark 4 students as present
5. End session
6. Navigate to Analytics

**Expected Results for Test 3:**
- First session: `2/5 (40%)`
- Second session: `4/5 (80%)`
- Each session should show its actual duration (not all 60m)

### Test 4: Analytics Page Verification
1. Go to Analytics page for any course
2. Check "Session History" table:
   - Date & Time: Should display session start time
   - Duration: Should show actual runtime (e.g., `5m 30s`) ✅ FIX #2
   - Attendance: Should show `attended/total_enrolled` ✅ FIX #1
   - Attendance Rate: Should calculate based on total enrolled ✅ FIX #1

3. Check summary statistics:
   - "Average Attendance": Should be average of manual marks
   - "Avg Duration": Should calculate from actual session durations
   - "Total Students": Should show actual enrolled count

### Test 5: Edge Cases
1. **Empty Session** (no students marked):
   - Attendance should show: `0/5`
   - Percentage: `0%`

2. **All Students Marked**:
   - Attendance should show: `5/5`
   - Percentage: `100%`

3. **Mixed Sessions** (some MQTT, some manual):
   - Manual marked students should count toward total
   - MQTT device students should count toward total
   - Total should include both

## Rollback Plan
If issues are found:
1. Revert changes in `backend/src/routes/attendance.js`
2. Revert changes in `backend/src/routes/sessions.js`
3. Revert changes in `frontend/src/pages/professor/Analytics.jsx`
4. Restart backend server

## Success Criteria
✅ All tests pass without errors
✅ Attendance shows correct ratio (attended/total_enrolled)
✅ Duration shows actual session runtime
✅ No 404 errors in console
✅ Analytics page loads without errors
✅ Manual marking works end-to-end

## Debugging Tips
If tests fail:
1. Check browser console for errors
2. Check backend logs for database query errors
3. Verify Enrollment table has correct data: `SELECT COUNT(*) FROM enrollment WHERE courseId = 'X';`
4. Verify Session table has correct status values
5. Check AttendanceSession records are created properly

## API Endpoints to Test
1. `GET /api/sessions/all-active` - Should return all active sessions
2. `GET /api/attendance/course/:courseId/report` - Should include sessionDurationSeconds
3. `POST /api/sessions/:sessionId/mark-attendance` - Should create attendance records properly

## Files Modified
- ✅ backend/src/routes/attendance.js
- ✅ backend/src/routes/sessions.js
- ✅ frontend/src/pages/professor/Analytics.jsx

## Expected Behavior Changes
**Before Fix:**
- Manually marking 4 of 5 students → Shows "4/4 (100%)"
- Session duration → Always shows "60m"
- `/api/sessions/all-active` → Returns 404

**After Fix:**
- Manually marking 4 of 5 students → Shows "4/5 (80%)" ✅
- Session duration → Shows actual runtime (e.g., "2m 15s") ✅
- `/api/sessions/all-active` → Returns all active sessions ✅
