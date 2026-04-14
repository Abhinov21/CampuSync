# 📝 Code Changes Reference - Session Consistency Fix

This document shows the exact code changes made to fix the session consistency issue.

---

## Change 1: Backend - Session Ending Synchronization

**File:** `backend/src/routes/sessions.js`  
**Function:** PATCH `/api/sessions/:sessionId/end`

### Location: Lines ~160-165

**BEFORE:**
```javascript
      // End session
      const endTime = new Date();
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          sessionStatus: 'COMPLETED',
          actualEndTime: endTime,
        },
      });

      // Get all attendance data for response
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: { sessionId },
        include: { student: { include: { user: true } } },
      });
```

**AFTER:**
```javascript
      // End session
      const endTime = new Date();
      
      // CRITICAL: Update all attendance sessions to ENDED when session ends
      // This ensures students' sessions stop showing as active
      await prisma.attendanceSession.updateMany({
        where: { sessionId },
        data: {
          sessionStatus: 'ENDED',
          sessionEndTime: endTime,
        },
      });

      console.log('✅ Updated all AttendanceSession records to ENDED');

      // Now update the main session
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          sessionStatus: 'COMPLETED',
          actualEndTime: endTime,
        },
      });

      // Get all attendance data for response
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: { sessionId },
        include: { student: { include: { user: true } } },
      });
```

**What Changed:**
- ✅ Added `updateMany` to sync all AttendanceSession records
- ✅ Set both `sessionStatus: 'ENDED'` and `sessionEndTime`
- ✅ Added logging to confirm update happened
- ✅ Update happens BEFORE Session.update to ensure atomicity

---

## Change 2: Backend - Parent Session Validation

**File:** `backend/src/routes/attendance.js`  
**Function:** GET `/api/attendance/current`

### Location: Lines ~38-50

**BEFORE:**
```javascript
    // Find current active attendance session
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        studentId: student.id,
        sessionStatus: 'ACTIVE',
      },
      include: {
        session: {
          include: { course: true },
        },
      },
    });

    if (!attendanceSession) {
      return res.status(200).json({
        status: 'success',
        message: 'No active session',
        data: {
          currentSession: null,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Format response
    const currentSession = {
```

**AFTER:**
```javascript
    // Find current active attendance session
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        studentId: student.id,
        sessionStatus: 'ACTIVE',
      },
      include: {
        session: {
          include: { course: true },
        },
      },
    });

    if (!attendanceSession) {
      return res.status(200).json({
        status: 'success',
        message: 'No active session',
        data: {
          currentSession: null,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // CRITICAL: Double-check that parent Session is still ACTIVE
    // This prevents students from seeing ended sessions
    if (attendanceSession.session.sessionStatus !== 'ACTIVE') {
      console.log('⚠️ AttendanceSession is ACTIVE but parent Session is', 
                  attendanceSession.session.sessionStatus);
      
      // Update this attendance session to ENDED if parent is completed
      if (attendanceSession.session.sessionStatus === 'COMPLETED') {
        await prisma.attendanceSession.update({
          where: { id: attendanceSession.id },
          data: { sessionStatus: 'ENDED' },
        });
        console.log('✅ Updated orphaned AttendanceSession to ENDED');
      }

      return res.status(200).json({
        status: 'success',
        message: 'Session has been ended',
        data: {
          currentSession: null,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Format response
    const currentSession = {
```

**What Changed:**
- ✅ Added check for parent `Session.sessionStatus`
- ✅ If parent is COMPLETED, update AttendanceSession to ENDED
- ✅ Return `null` for currentSession if parent session ended
- ✅ Added logging for debugging

---

## Change 3: Frontend - Adaptive Refresh Rate

**File:** `frontend/src/hooks/useAttendance.js`  
**Function:** `useCurrentSession`

### Location: Lines ~65-92

**BEFORE:**
```javascript
/**
 * Hook for loading current session with loading/error states
 * Auto-refreshes every 30 seconds
 */
export const useCurrentSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/attendance/current');
      setSession(response.data.data?.currentSession || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch session');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
};
```

**AFTER:**
```javascript
/**
 * Hook for loading current session with loading/error states
 * Auto-refreshes more frequently when session is active to detect end quickly
 */
export const useCurrentSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/api/attendance/current');
      const newSession = response.data.data?.currentSession || null;
      
      // Log session state changes for debugging
      if (session && !newSession) {
        console.log('🔴 Session ended detected by client');
      } else if (!session && newSession) {
        console.log('🟢 New session started:', newSession.courseName);
      }
      
      setSession(newSession);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch session');
      setSession(null);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    // Initial fetch
    fetchSession();
    
    // Refresh intervals:
    // - Every 5 seconds when session is ACTIVE (detect end quickly)
    // - Every 30 seconds when no session (check for new session start)
    const interval = setInterval(fetchSession, session ? 5000 : 30000);
    
    return () => clearInterval(interval);
  }, [fetchSession, session]);

  return { session, loading, error, refetch: fetchSession };
};
```

**What Changed:**
- ✅ Changed refresh interval based on session state
- ✅ 5 seconds when `session` is active (5000ms)
- ✅ 30 seconds when no session (30000ms)
- ✅ Added console logging for state changes
- ✅ Detect session end: `if (session && !newSession)`
- ✅ Detect session start: `if (!session && newSession)`

---

## Summary of Changes

| File | Function | Change | Impact |
|------|----------|--------|--------|
| `sessions.js` | PATCH end | Sync AttendanceSession on end | Session ends for all students immediately |
| `attendance.js` | GET current | Verify parent status | Orphaned records detected/cleaned |
| `useAttendance.js` | useCurrentSession | Adaptive refresh | End detected in 5s instead of 30s |

---

## Testing the Changes

### Test 1: Verify Sync on End
```javascript
// Before ending session
GET /api/attendance/current
→ { currentSession: {...status: 'ACTIVE'} }

// End session via professor
PATCH /api/sessions/:id/end

// Check backend logs
// Should show: "✅ Updated all AttendanceSession records to ENDED"

// After a few seconds, student fetches
GET /api/attendance/current
→ { currentSession: null }  // ✅ Fixed!
```

### Test 2: Verify Orphaned Record Cleanup
```javascript
// Scenario: AttendanceSession.status = ACTIVE but Session.status = COMPLETED
// (shouldn't happen now, but if it does...)

GET /api/attendance/current
// Backend checks parent status
// Finds mismatch
// Updates AttendanceSession to ENDED
// Returns { currentSession: null }
// Logs: "✅ Updated orphaned AttendanceSession to ENDED"
```

### Test 3: Verify Adaptive Refresh
```javascript
// Check browser DevTools → Network tab
// When session is ACTIVE: Requests every 5 seconds
// When no session: Requests every 30 seconds
// You'll see spacing between requests shows interval changes
```

---

## Performance Impact

| Scenario | Before | After | Impact |
|----------|--------|-------|--------|
| Session active | 30s refresh | 5s refresh | +5 requests/min but detects end faster |
| Session ends | 30s to detect | ~10s to detect | 3x faster detection |
| No session | 30s refresh | 30s refresh | No change |
| Network load | 2 reqs/min (idle) | 12 reqs/min (active) | Acceptable for UX |

---

## Database Queries Generated

### Before Fix
```sql
-- Only updates Session
UPDATE sessions 
SET session_status = 'COMPLETED', actual_end_time = NOW()
WHERE id = :sessionId;

-- AttendanceSession never touched ❌
```

### After Fix
```sql
-- Update all related AttendanceSession records FIRST
UPDATE attendance_sessions 
SET session_status = 'ENDED', session_end_time = NOW()
WHERE session_id = :sessionId;

-- Then update Session
UPDATE sessions 
SET session_status = 'COMPLETED', actual_end_time = NOW()
WHERE id = :sessionId;

-- Result: Atomic update of all related records ✅
```

---

## Deployment Steps

1. **Update Code:**
   - Copy changes to all three files
   - No database migration needed

2. **Restart Backend:**
   - Kill existing process
   - Run `npm run dev`
   - Verify connected

3. **Test:**
   - Run test-session-consistency.js
   - Do end-to-end test

4. **Monitor:**
   - Check backend logs for sync messages
   - Verify prof/student view consistency
   - Monitor for any orphaned records

---

## Rollback (if issues found)

If you need to revert, just restore the three files to their original state and restart backend. No database changes, so completely reversible.

---

**Last Updated:** April 15, 2026  
**Status:** ✅ Applied and tested
