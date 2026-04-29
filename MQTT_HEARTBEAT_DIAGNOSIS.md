# MQTT Heartbeat & Session Timeout Issue - Diagnosis & Fix

## 🔍 What's Happening

Your logs show this flow:

```
1. ✅ AUTH arrives → Session created
2. ⏰ Timeout set for device (30000ms / 30 seconds)
3. ⏳ System waits for PING within 30 seconds...
4. ❌ NO PING arrives before timeout expires
5. ⏱️  PING timeout fire → Session auto-ends
6. 📨 PING arrives AFTER session ended → ANOMALY: PING_WITHOUT_SESSION
```

## 🎯 Root Cause

The event processor has a **30-second "keep-alive" mechanism**:

- **AUTH** creates an attendance session and starts a 30-second countdown
- **PING** must arrive before the countdown reaches 0, otherwise the session auto-ends
- Your PING messages arrive **after** the 30-second timeout expires

**Location:** `src/services/eventProcessor.js:26`
```javascript
this.sessionTimeout = 30000; // 30 seconds in milliseconds
```

## 📊 Timeline of the Issue

```
Time 0s:    AUTH arrives → Session ACTIVE, timeout starts
Time 0-30s: Waiting for PING...
Time 30s:   ❌ No PING arrived, timeout fires
Time 30s:   Session auto-ends (PING_TIMEOUT reason)
Time 31s+:  Your first PING arrives → But session already dead!
Result:     PING_WITHOUT_SESSION anomaly
```

## ✅ The Solution

**Send PING messages every 8-10 seconds** to reset the timeout before it expires.

### Timing Example (Safe):
```
T=0s:   Send AUTH              (starts 30s countdown)
T=8s:   Send PING              (resets to 30s countdown)
T=16s:  Send PING              (resets to 30s countdown)
T=24s:  Send PING              (resets to 30s countdown)
T=32s:  Send PING              (resets to 30s countdown)
...
```

Each PING before the 30s mark keeps the session alive and resets the timer.

### Timing Example (Will Fail):
```
T=0s:   Send AUTH              (starts 30s countdown)
T=30s:  ❌ Timeout fires, session ends
T=35s:  Send PING              (too late, no active session)
Result: PING_WITHOUT_SESSION anomaly
```

## 🛠️ How to Test

### Option 1: Use the Provided Node.js Script

```bash
cd /home/abhinov/repos/CampuSync/backend
node mqtt-test-heartbeat.js
```

This script:
1. Sends AUTH to start session
2. Automatically sends PING every 8 seconds (5 times total)
3. Keeps session alive for ~40 seconds
4. Shows real-time progress

**Expected Output:**
```
✅ Connected to HiveMQ
📤 1. Sending AUTH (Session Start)
📤 2. Sending PING (Heartbeat 1)
📤 3. Sending PING (Heartbeat 2)
... (continues every 8 seconds)
✅ Test sequence complete!
```

### Option 2: Manual HiveMQ Testing

In HiveMQ UI, publish these messages to topic `fingerprint/match`:

**Message 1 (AUTH) - at 0s:**
```json
{"type":"auth","device_mac":"00:70:07:25:B6:88","user_id":1,"confidence":82}
```

**Message 2 (PING) - at 8s:**
```json
{"type":"ping","device_mac":"00:70:07:25:B6:88","user_id":1,"ts":152342}
```

**Message 3 (PING) - at 16s:**
```json
{"type":"ping","device_mac":"00:70:07:25:B6:88","user_id":1,"ts":152350}
```

**Message 4 (PING) - at 24s:**
```json
{"type":"ping","device_mac":"00:70:07:25:B6:88","user_id":1,"ts":152358}
```

**Keep spacing at 8-second intervals.**

## 📋 What to Observe

After sending AUTH + continuous PINGs:

**Backend Logs Should Show:**
```
✅ Found active session [ID] for student
📝 Recorded AUTH event
✅ Session created for device
✅ PING processed for device, timeout reset
✅ PING processed for device, timeout reset
... (repeats for each PING)
```

**Not:**
```
⏱️  PING timeout for device - auto-ending session
⚠️  ANOMALY: PING_WITHOUT_SESSION
```

**Professor Dashboard Status:**
- Student appears as PRESENT in the attendance list
- Can see in real-time list of attending students
- Duration counter increments with each PING

## 🔧 Why This Design?

The 30-second timeout is a **safety feature**:
- Detects if the device/ESP32 loses connection
- Prevents "zombie" attendance sessions that never end
- If PING stops → Assume student left → Auto-end session

This is correct behavior for a real biometric device. Your test just needs to simulate the continuous PING heartbeat that a real device would send.

## 🎓 Real Device Behavior

A real ESP32 wristband would:
1. Send AUTH when student first scans in
2. Send PING every 3-5 seconds while wearing the device
3. Stop sending PING when device is removed
4. System auto-ends session after 30s of no PING

Your test simulation needs to replicate this behavior with continuous PING messages.
