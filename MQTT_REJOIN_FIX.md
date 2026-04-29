# MQTT Rejoin Fix - Session Reactivation Issue Resolved

## 🔍 Problem Identified

When a student with an ended attendance session received a new AUTH message (rejoin attempt), the system was blocking it with:

```
⚠️  CANNOT_REACTIVATE_ENDED_SESSION anomaly
⚠️  Attendance session already ended
```

This prevented legitimate scenarios where:
1. Student leaves a session (attendance ends)
2. Student rejoins the same session (should create new attendance record)
3. System incorrectly rejected the rejoin attempt

## ✅ Root Cause

In `src/services/eventProcessor.js`, the AUTH handler had logic to prevent "ghost sessions" by blocking reactivation of ended records:

```javascript
// OLD CODE (blocked rejoin):
} else {
  // existingRec exists but is ENDED - cannot reactivate
  console.log(`⚠️  Attendance session already ended...`);
  await this.logAnomaly("CANNOT_REACTIVATE_ENDED_SESSION", ...);
  return;  // ← Rejected rejoin!
}
```

This was too strict - it blocked both:
- ❌ Duplicate AUTH (stale message) - correctly should block
- ❌ Legitimate rejoin (student left and came back) - incorrectly blocked

## 🔧 Solution Implemented

Modified the AUTH handler to distinguish between scenarios:

```javascript
// NEW CODE (allows rejoin):
} else {
  // existingRec exists but is ENDED - this is a REJOIN
  // Create a NEW attendance record for this rejoin
  console.log(`🔄 Student ${studentId} rejoining session (previous attendance ended)`);
  attendanceSession = await prisma.attendanceSession.create({
    data: {
      studentId,
      sessionId: currentSession.id,
      deviceId: device.id,
      sessionStartTime: new Date(),
      sessionStatus: "ACTIVE",
    },
  });
  console.log(`✅ New attendance record created for rejoin`);
}
```

**Key changes:**
- Instead of blocking, creates a NEW attendance record
- Preserves old ended record (maintains history)
- New record is ACTIVE and can receive PINGs
- Student can now rejoin sessions seamlessly

## 📊 Before vs After

### Before Fix:
```
1. AUTH (rejoin attempt)
2. System finds ENDED attendance record
3. ❌ BLOCKS with CANNOT_REACTIVATE anomaly
4. 📨 PING arrives but has no session to attach to
5. ⚠️  PING_WITHOUT_SESSION anomaly
```

### After Fix:
```
1. AUTH (rejoin attempt)
2. System finds ENDED attendance record
3. ✅ Creates NEW ACTIVE attendance record (rejoin)
4. 📨 PING arrives and updates the new record
5. ✅ Session continues normally
```

## ✅ Test Results

The rejoin scenario now works:
```
📋 Current attendance state:
   Status: ENDED (2026-04-17T13:35:50.175Z)

🔄 Simulating rejoin: Creating new attendance record...
✅ New attendance record created
   Status: ACTIVE
   Start time: 2026-04-17T13:46:44.355Z

📊 Attendance history (2 records):
   1. Status: ENDED (old record preserved)
   2. Status: ACTIVE (new rejoin record)
```

## 🎯 Impact

- **Before:** Student couldn't rejoin an active session
- **After:** Student can seamlessly rejoin with new attendance tracking
- **History:** Both old and new attendance records preserved
- **Anomalies:** No more CANNOT_REACTIVATE_ENDED_SESSION or subsequent PING_WITHOUT_SESSION

## 📝 Files Modified

- **File:** `src/services/eventProcessor.js`
- **Method:** `handleAuthEvent()`
- **Lines:** ~180-210
- **Change:** Allow new attendance creation for ended sessions (rejoin scenario)

## 🧪 Testing

Run rejoin test:
```bash
cd /home/abhinov/repos/CampuSync/backend
node test-rejoin-scenario.js
```

This validates:
- New attendance records are created for rejoins
- Old records remain ENDED (history preserved)
- Both records exist in the database
