# 🔧 DEVELOPER A: Backend Implementation Plan

**Role:** Backend Engineer  
**Focus:** MQTT Processing, REST APIs, WebSocket  
**Duration:** 6 days (16 hours)  
**Git Branch:** `dev/backend/mqtt-integration`

---

## Table of Contents

1. [Pre-Development Coordination](#pre-development-coordination)
2. [Day 1: Database Setup](#day-1-database-setup)
3. [Day 2-3: MQTT Integration](#day-2-3-mqtt-integration)
4. [Day 4: REST API Endpoints](#day-4-rest-api-endpoints)
5. [Day 5: WebSocket Real-Time](#day-5-websocket-real-time)
6. [Day 6: Testing & Polish](#day-6-testing--polish)
7. [Integration Points](#integration-points)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Development Coordination

### ⚠️ WAIT FOR COORDINATION PHASE (30 min)

**Before starting Day 1, complete with Developer B:**

- [ ] Both clone repository
- [ ] Both create `.env` file with credentials
- [ ] Both review and approve database schema
- [ ] Both agree on API contract (see API_CONTRACT.md)
- [ ] Both agree on WebSocket event format
- [ ] Both create separate git branches

**Coordination Checklist:**
```bash
# You handle these:
- [ ] Read COMPLETE_ROADMAP.md Data Model section
- [ ] Ensure .env configured with:
  - DATABASE_URL
  - MQTT_BROKER_URL
  - MQTT_USERNAME
  - MQTT_PASSWORD
  - JWT_SECRET
- [ ] Test: npm run dev (should start without errors)
```

---

## Day 1: Database Setup (2 hours)

### Task A1.1: Create Prisma Schema (1.5 hours)

**Objective:** Design and implement complete database schema

**What you'll do:**

1. Open `prisma/schema.prisma`
2. Copy complete schema from [COMPLETE_ROADMAP.md → Data Model section]
3. Include all 12 entities:
   - User + Role enum
   - Student
   - Professor
   - Admin
   - Course
   - Enrollment
   - Device
   - Session
   - AttendanceSession
   - AttendanceRecord
   - MQTTEventLog
   - AnomalyLog

4. Verify schema validity:
   ```bash
   npx prisma validate
   ```

**Expected Output:**
```
✅ Prisma schema is valid
```

**File to Create/Update:**
- `prisma/schema.prisma` (complete, ~300 lines)

**Checklist:**
- [ ] All 12 entities defined
- [ ] All relationships correct
- [ ] All foreign keys defined
- [ ] Indexes present for performance
- [ ] Role enum has STUDENT, PROFESSOR, ADMIN
- [ ] SessionStatus enum defined
- [ ] No validation errors

**Commit:**
```bash
git add prisma/schema.prisma
git commit -m "feat(db): Add complete Prisma schema with 12 entities"
```

**Time Check:** Should take ~1.5 hours. If longer, schema is complex - verify with Dev B.

---

### Task A1.2: Run Migration & Seed Data (0.5 hours)

**Objective:** Create database tables and populate with test data

**What you'll do:**

1. Run migration:
   ```bash
   npx prisma migrate dev --name "mqtt_attendance_system"
   ```

2. Create `prisma/seed.js`:
   ```javascript
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();

   async function main() {
     // 1. Create 1 Admin user
     // 2. Create 2 Professor users
     // 3. Create 5 Student users
     // 4. Create 2 Courses (1 per professor)
     // 5. Create 5 Devices (WB_001 to WB_005)
     // 6. Assign devices to students
     // 7. Enroll students in courses (10 enrollments)
   }

   main()
     .catch(e => console.error(e))
     .finally(async () => await prisma.$disconnect());
   ```

3. Run seed:
   ```bash
   node prisma/seed.js
   ```

4. Verify in Prisma Studio:
   ```bash
   npx prisma studio
   ```
   - [ ] Launch on http://localhost:5555
   - [ ] See all 12 tables created
   - [ ] See test data populated
   - [ ] No foreign key constraint errors

**Files to Create:**
- `prisma/seed.js` (~200 lines)
- `prisma/migrations/[timestamp]_init/migration.sql` (auto-generated)

**Test Data to Create:**

```
Admin:
  email: admin@campusync.com
  password: admin123

Professors:
  1. prof1@campusync.com (CS Department)
  2. prof2@campusync.com (ECE Department)

Students:
  1. student1@campusync.com (21CS001, CS)
  2. student2@campusync.com (21CS002, CS)
  3. student3@campusync.com (21ECE001, ECE)
  4. student4@campusync.com (21ECE002, ECE)
  5. student5@campusync.com (21EE001, EE)

Devices:
  WB_001 → student1
  WB_002 → student2
  WB_003 → student3
  WB_004 → student4
  WB_005 → student5

Courses:
  CS101 (Prof 1) → Students 1,2,3
  ECE101 (Prof 2) → Students 3,4,5

Sessions:
  (will be created dynamically)
```

**Checklist:**
- [ ] Migration runs without errors
- [ ] All 12 tables in PostgreSQL
- [ ] Seed script completes
- [ ] Prisma Studio shows all data
- [ ] Foreign key relationships valid
- [ ] Test user list documented

**Commit:**
```bash
git add prisma/seed.js
git commit -m "feat(db): Database migration and test data seed"
```

**Message to Dev B:**
```
Database is ready! Here are the test credentials:

Admin:
- Email: admin@campusync.com
- Password: admin123

Professor:
- Email: prof1@campusync.com
- Password: prof123

Student:
- Email: student1@campusync.com
- Password: student123

You can use these for frontend testing.
```

**Time Check:** Should complete in 0.5 hours. If migrations fail, check PostgreSQL connection.

---

## Day 2-3: MQTT Integration (6 hours)

### Task A2.1: MQTT Service Setup (2 hours)

**Objective:** Connect to HiveMQ Cloud and subscribe to MQTT topic

**What you'll do:**

1. Install MQTT client:
   ```bash
   npm install mqtt
   ```

2. Create `src/services/mqttService.js`:

   ```javascript
   const mqtt = require('mqtt');

   class MQTTService {
     constructor() {
       this.client = null;
       this.isConnected = false;
     }

     async connect() {
       const options = {
         username: process.env.MQTT_USERNAME,
         password: process.env.MQTT_PASSWORD,
         reconnectPeriod: 1000,
         connectTimeout: 30000,
       };

       this.client = mqtt.connect(
         process.env.MQTT_BROKER_URL,
         options
       );

       this.client.on('connect', () => {
         console.log('✅ Connected to HiveMQ');
         this.isConnected = true;
         this.subscribe();
       });

       this.client.on('message', async (topic, message) => {
         try {
           const payload = JSON.parse(message.toString());
           console.log('📨 MQTT Message:', payload);
           
           // Pass to event processor (Day 2)
           // await eventProcessor.processEvent(payload);
         } catch (error) {
           console.error('❌ MQTT parse error:', error);
         }
       });

       this.client.on('error', (error) => {
         console.error('❌ MQTT error:', error);
         this.isConnected = false;
       });
     }

     subscribe() {
       this.client.subscribe('fingerprint/match', (err) => {
         if (err) {
           console.error('❌ Subscribe error:', err);
         } else {
           console.log('✅ Subscribed to fingerprint/match');
         }
       });
     }

     disconnect() {
       if (this.client) {
         this.client.end();
         this.isConnected = false;
       }
     }
   }

   module.exports = new MQTTService();
   ```

3. Update `src/server.js`:
   ```javascript
   const mqttService = require('./services/mqttService');

   // In startup:
   await mqttService.connect();
   ```

4. Test connection:
   ```bash
   npm run dev
   ```
   - Should see: `✅ Connected to HiveMQ`
   - Should see: `✅ Subscribed to fingerprint/match`

**Files to Create:**
- `src/services/mqttService.js` (~100 lines)

**Verification:**
- [ ] MQTT service imports without errors
- [ ] Connection established on startup
- [ ] Subscription confirmed in console
- [ ] No connection timeout errors
- [ ] `isConnected` flag works

**Environment Variables Required:**
```
MQTT_BROKER_URL=mqtt://broker.hivemq.cloud
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
```

**Test MQTT Message (optional):**
```bash
# In another terminal, subscribe to topic
mqtt-cli sub -t "fingerprint/match" -u username -pw password -h broker.hivemq.cloud

# In another terminal, publish test message
mqtt-cli pub -t "fingerprint/match" -m '{
  "type":"auth",
  "device":"WB_001",
  "id":5,
  "confidence":88
}' -u username -pw password -h broker.hivemq.cloud
```

**Checklist:**
- [ ] mqtt package installed
- [ ] mqttService.js created
- [ ] Connection successful
- [ ] Topic subscribed
- [ ] No console errors
- [ ] Test message received (optional)

**Commit:**
```bash
git add src/services/mqttService.js
git commit -m "feat(mqtt): MQTT service with HiveMQ connection"
```

**Time Check:** Should take 2 hours including testing.

---

### Task A2.2: Event Processor (4 hours)

**Objective:** Process MQTT events and manage session lifecycle

**What you'll do:**

1. Create `src/services/eventProcessor.js`:

   This is the core logic. Reference COMPLETE_ROADMAP.md for complete code.

   Key methods to implement:

   ```javascript
   class EventProcessor {
     // Main entry point
     async processEvent(payload)

     // Event handlers
     async handleAuthEvent(payload)      // Create session
     async handlePingEvent(payload)      // Update duration
     async handleRecheckEvent(payload)   // Log re-verification
     async handleSessionEndEvent(payload) // End session

     // Helpers
     async recordAttendanceEvent()       // Log event
     async logMQTTEvent()                // Log MQTT message
     async logAnomaly()                  // Log suspicious activity
     setPingTimeout()                    // Auto-end on timeout
     findCurrentSessionForStudent()      // Find active class
   }
   ```

2. Implement each handler with edge case detection:

   **handleAuthEvent:**
   - Validate payload structure
   - Find device in DB
   - Verify device-student binding
   - Check for duplicate auth (session already active)
   - Find current active session for student's course
   - Create AttendanceSession
   - Record AUTH event
   - Set 30s ping timeout

   **handlePingEvent:**
   - Find active attendance session for device
   - Update lastPingTime
   - Record PING event
   - Reset timeout

   **handleRecheckEvent:**
   - Find active session
   - Record re-verification success
   - Continue session

   **handleSessionEndEvent:**
   - Find active session for device
   - Calculate total duration
   - Update session status to "ended"
   - Record SESSION_END event
   - Clear any pending timeouts

3. Error handling:
   - Unknown device → log anomaly
   - Device-student mismatch → log anomaly
   - Duplicate AUTH → ignore with warning
   - Missing fields → log error

4. Integration with mqttService:
   ```javascript
   // In mqttService message handler:
   const { eventProcessor } = require('./eventProcessor');
   await eventProcessor.processEvent(payload);
   ```

**Files to Create:**
- `src/services/eventProcessor.js` (~400 lines)

**Database Features:**
- [ ] Sessions created correctly
- [ ] Duration calculated properly
- [ ] Anomalies logged
- [ ] Timeouts working
- [ ] Edge cases handled

**Testing Commands:**

```bash
# Publish AUTH event
mqtt-cli pub -t "fingerprint/match" -m '{
  "type":"auth",
  "device":"WB_001",
  "id":5,
  "confidence":88
}'

# Check database
npx prisma studio
# See new AttendanceSession created
```

**Edge Cases to Handle:**
- [ ] Duplicate AUTH (session already active)
- [ ] PING without active session
- [ ] Unknown device
- [ ] Device-student mismatch
- [ ] Orphaned sessions (timeout)

**Verification Checklist:**
- [ ] All 4 event types handled
- [ ] Session created/updated correctly
- [ ] Anomalies logged to DB
- [ ] Timeout logic working
- [ ] Duration calculated correctly
- [ ] All edge cases handled
- [ ] No unhandled exceptions

**Commit:**
```bash
git add src/services/eventProcessor.js
git commit -m "feat(mqtt): Event processor with complete session lifecycle"
```

**Message to Dev B:**
```
MQTT backend complete! Device events now create sessions in the database.

Session lifecycle:
AUTH → creates session
PING → updates duration every 10-15 seconds
SESSION_END → completes session

You'll consume this via:
- GET /api/attendance/current (coming tomorrow)
- WebSocket events (coming Day 5)
```

**Time Check:** Should take 4 hours. This is the core logic - take time to get it right.

---

## Day 4: REST API Endpoints (4 hours)

### Task A3.1: Attendance REST Endpoints (2 hours)

**Objective:** Create REST APIs for frontend consumption

**What you'll do:**

1. Create `src/routes/attendance.js`:

   ```javascript
   // Student endpoints
   GET  /api/attendance/current              // My active session
   GET  /api/attendance/course/:courseId     // Stats for course
   GET  /api/attendance/history              // All my sessions

   // Professor endpoints
   GET  /api/attendance/course/:courseId/live        // Live students in class
   POST /api/attendance/course/:courseId/start-session (start class)
   PATCH /api/attendance/course/:courseId/end-session  (end class)
   GET  /api/attendance/course/:courseId/report        (attendance report)

   // Admin endpoints
   GET /api/attendance/admin/active-sessions  (all active now)
   GET /api/attendance/admin/mqtt-logs        (raw MQTT events)
   GET /api/attendance/admin/anomalies        (suspicious activity)
   ```

2. Each endpoint:
   - [ ] Uses `authenticateToken` middleware
   - [ ] Uses `authorizeRoles()` for access control
   - [ ] Returns proper HTTP status codes
   - [ ] Includes error handling
   - [ ] Structured JSON response

3. Response Format:
   ```json
   {
     "message": "Description of response",
     "data": { /* actual data */ },
     "error": null,
     "timestamp": "2026-04-14T10:30:00Z"
   }
   ```

4. Register route in `src/server.js`:
   ```javascript
   app.use('/api/attendance', attendanceRoutes);
   ```

5. Test each endpoint:
   ```bash
   # With curl
   curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/attendance/current
   ```

**Files to Create:**
- `src/routes/attendance.js` (~300 lines)

**Checklist:**
- [ ] All 11 endpoints implemented
- [ ] Auth middleware applied
- [ ] Role-based access control working
- [ ] Error handling comprehensive
- [ ] Response format consistent
- [ ] All endpoints tested

**Commit:**
```bash
git add src/routes/attendance.js
git commit -m "feat(api): Add attendance REST endpoints"
```

**Time Check:** 2 hours

---

### Task A3.2: Courses & Devices CRUD (2 hours)

**Objective:** Create additional resource management endpoints

**What you'll do:**

1. Create `src/routes/courses.js`:
   ```
   POST   /api/courses              (create - professor)
   GET    /api/courses              (list my courses)
   GET    /api/courses/:id          (get course details)
   PATCH  /api/courses/:id          (update - professor)
   DELETE /api/courses/:id          (delete - professor)
   ```

2. Create `src/routes/devices.js`:
   ```
   GET    /api/devices              (list all devices - admin)
   POST   /api/devices              (register device - admin)
   PATCH  /api/devices/:id/assign   (assign to student - admin)
   GET    /api/devices/:id          (device details)
   ```

3. Create `src/routes/enrollment.js`:
   ```
   POST   /api/enrollment           (add student to course - professor)
   DELETE /api/enrollment           (remove student - professor)
   GET    /api/courses/:id/students (list enrolled students - professor)
   ```

4. Register all routes in `src/server.js`:
   ```javascript
   app.use('/api/courses', courseRoutes);
   app.use('/api/devices', deviceRoutes);
   app.use('/api/enrollment', enrollmentRoutes);
   ```

5. Test all endpoints (use Postman or curl)

**Files to Create:**
- `src/routes/courses.js` (~200 lines)
- `src/routes/devices.js` (~150 lines)
- `src/routes/enrollment.js` (~100 lines)

**Checklist:**
- [ ] All CRUD endpoints working
- [ ] Proper auth on all endpoints
- [ ] Database operations correct
- [ ] Error messages clear
- [ ] Status codes appropriate

**Commit:**
```bash
git add src/routes/courses.js src/routes/devices.js src/routes/enrollment.js
git commit -m "feat(api): Add courses, devices, and enrollment CRUD endpoints"
```

**Message to Dev B:**
```
All REST endpoints complete! You can now wire up the frontend.

API Base URL: http://localhost:5000

Key endpoints for integration:
- GET /api/attendance/current (student dashboard)
- GET /api/attendance/course/:courseId/live (professor live view)
- GET /api/courses (list courses)
- POST /api/courses (create course)

See API_CONTRACT.json for full specs.
```

**Time Check:** 2 hours

---

## Day 5: WebSocket Real-Time (2 hours)

### Task A4.1: WebSocket Service (1 hour)

**Objective:** Implement Socket.io for real-time updates

**What you'll do:**

1. Install Socket.io:
   ```bash
   npm install socket.io
   ```

2. Create `src/services/websocketService.js`:

   ```javascript
   const { Server } = require('socket.io');

   class WebSocketService {
     constructor(httpServer) {
       this.io = new Server(httpServer, {
         cors: { origin: process.env.FRONTEND_URL }
       });
       this.setupHandlers();
     }

     setupHandlers() {
       this.io.on('connection', (socket) => {
         console.log('👤 User connected:', socket.id);

         socket.on('join-session', (sessionId) => {
           socket.join(`session-${sessionId}`);
         });

         socket.on('disconnect', () => {
           console.log('👤 User disconnected:', socket.id);
         });
       });
     }

     emitSessionCreated(attendanceSession) {
       this.io.to(`session-${attendanceSession.sessionId}`).emit('session-event', {
         type: 'student-joined',
         data: attendanceSession
       });
     }

     emitPingUpdate(sessionId, durationSeconds) {
       this.io.to(`session-${sessionId}`).emit('session-event', {
         type: 'ping-update',
         durationSeconds
       });
     }

     emitSessionEnded(sessionId) {
       this.io.to(`session-${sessionId}`).emit('session-event', {
         type: 'session-ended'
       });
     }

     emitAnomalyAlert(anomaly) {
       this.io.emit('anomaly-alert', anomaly);
     }
   }

   module.exports = WebSocketService;
   ```

3. Update `src/server.js`:
   ```javascript
   const http = require('http');
   const WebSocketService = require('./services/websocketService');

   const server = http.createServer(app);
   const wsService = new WebSocketService(server);

   // Later in the file:
   server.listen(PORT, () => {
     console.log(`🚀 Server on http://localhost:${PORT}`);
   });

   // Export for eventProcessor
   module.exports = { app, wsService };
   ```

4. Test WebSocket connection:
   ```bash
   # Browser DevTools → Network → WS tab
   # Should see connection to localhost:5000
   ```

**Files to Create:**
- `src/services/websocketService.js` (~150 lines)

**Checklist:**
- [ ] Socket.io initialized
- [ ] WebSocket connection working
- [ ] Rooms functional
- [ ] All emit methods created
- [ ] No console errors

**Commit:**
```bash
git add src/services/websocketService.js
git commit -m "feat(websocket): Socket.io integration for real-time updates"
```

**Time Check:** 1 hour

---

### Task A4.2: Emit Events from Event Processor (1 hour)

**Objective:** Connect event processor to WebSocket

**What you'll do:**

1. Update `src/services/eventProcessor.js`:

   ```javascript
   const wsService = require('./websocketService');

   // In handleAuthEvent:
   wsService.emitSessionCreated(attendanceSession);

   // In handlePingEvent:
   wsService.emitPingUpdate(attendanceSession.sessionId, durationSeconds);

   // In handleSessionEndEvent:
   wsService.emitSessionEnded(attendanceSession.id);

   // For anomalies:
   wsService.emitAnomalyAlert(anomaly);
   ```

2. Test WebSocket events:
   ```bash
   # Publish MQTT message
   mqtt-cli pub -t "fingerprint/match" -m '{...}'

   # Watch browser console for WebSocket message
   ```

3. Verify in browser DevTools:
   - WebSocket frame inspector
   - See message: `{"type":"student-joined",...}`

**Checklist:**
- [ ] Event processor emits WebSocket events
- [ ] Events formatted correctly
- [ ] No errors on emit
- [ ] Events visible in browser DevTools

**Commit:**
```bash
git add src/services/eventProcessor.js
git commit -m "feat(websocket): Emit real-time events from MQTT processor"
```

**Message to Dev B:**
```
Real-time updates now working! Every MQTT event triggers:

1. Database update
2. WebSocket event to clients
3. All in < 100ms

Your frontend should:
- Join room: socket.emit('join-session', sessionId)
- Listen: socket.on('session-event', callback)
```

**Time Check:** 1 hour

---

## Day 6: Testing & Polish (2 hours)

### Task A5.1: Edge Case Testing (1 hour)

**Objective:** Verify all error conditions handled

**What you'll do:**

1. Test duplicate AUTH events:
   ```bash
   # Publish AUTH twice for same device
   # Should ignore second one, log warning
   ```

2. Test missing PING (timeout):
   ```bash
   # Publish AUTH, wait 40 seconds
   # Session should auto-end after 30s
   ```

3. Test device mismatch:
   ```bash
   # Publish AUTH with device WB_001 but id=99 (wrong student)
   # Should log anomaly, reject
   ```

4. Test unknown device:
   ```bash
   # Publish AUTH for non-existent device
   # Should fail gracefully
   ```

5. Verify error messages:
   - [ ] Clear error responses
   - [ ] Logged for debugging
   - [ ] Don't crash server

**Checklist:**
- [ ] Duplicate AUTH ignored
- [ ] Timeout working
- [ ] Mismatches detected
- [ ] Unknown devices rejected
- [ ] All errors logged
- [ ] No unhandled exceptions

**Commit:**
```bash
git add -A
git commit -m "test: Verify edge case handling and error scenarios"
```

**Time Check:** 1 hour

---

### Task A5.2: Optimization & Final Polish (1 hour)

**Objective:** Performance & code quality

**What you'll do:**

1. Add database indexes:
   ```sql
   CREATE INDEX idx_mqtt_device_created ON mqtt_event_log(device_id, created_at);
   CREATE INDEX idx_attendance_status ON attendance_session(session_status);
   CREATE INDEX idx_enrollment_student ON enrollment(student_id);
   ```

2. Review code:
   - [ ] Remove console.logs (use logging)
   - [ ] Add JSDoc comments to key functions
   - [ ] Check for N+1 queries
   - [ ] Verify error handling complete

3. Test performance:
   ```bash
   # Measure MQTT processing time
   # Should be < 50ms per event
   ```

4. Final verification:
   ```bash
   npm run dev
   # Should start with no errors
   # All services ready
   ```

**Checklist:**
- [ ] Indexes added
- [ ] Code clean
- [ ] Comments added
- [ ] Performance acceptable
- [ ] No console warnings
- [ ] Final tests passing

**Commit:**
```bash
git add -A
git commit -m "refactor: Performance optimization and code cleanup

- Add database indexes for query performance
- Remove debug console.logs
- Add JSDoc documentation
- Verify all error handling in place"
```

**Final Status:**
```bash
# Verify backend is production-ready
npm run dev
# Should see:
# ✅ Connected to HiveMQ
# ✅ Subscribed to fingerprint/match
# 🚀 Server running on http://localhost:5000
# 🔌 WebSocket ready
```

**Time Check:** 1 hour

---

## Integration Points

### With Developer B (Frontend)

**What Dev B consumes from you:**

| Feature | When Ready | Dev B Uses |
|---------|-----------|-----------|
| REST APIs | Day 4 | All dashboard pages |
| WebSocket | Day 5 | Real-time updates |
| Test Data | Day 1 | Login credentials |
| API Docs | Day 4 | Integration guide |

### Communication Schedule

**Daily:**
- 10 min sync on Slack with Dev B
- Share any blockers

**After Each Major Phase:**
- Share endpoint list
- Verify format matches expectations
- Test integration

---

## Testing Your Work

### Manual Testing Checklist

```bash
# Day 1: Database
npx prisma studio
# ✅ All 12 tables exist
# ✅ Test data populated

# Day 3: MQTT
npm run dev
# ✅ "Connected to HiveMQ"
# ✅ "Subscribed to fingerprint/match"

# Day 4: APIs
curl http://localhost:5000/health
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/attendance/current

# Day 5: WebSocket
# Browser DevTools → Network → WS
# ✅ Connection to localhost:5000

# Day 6: Edge Cases
mqtt-cli pub -t "fingerprint/match" -m '{"type":"auth","device":"WB_001","id":5}'
# Check: Session created in Prisma Studio
```

---

## Git Workflow

### Before Each Commit

```bash
# See what changed
git status

# Add specific files (not everything)
git add src/services/newFile.js

# Verify changes
git diff --staged

# Commit with descriptive message
git commit -m "feat(scope): Description of change"

# Push to your branch
git push origin dev/backend/mqtt-integration
```

### Commit Message Format

```
feat(mqtt): Description                  ← Features
fix(api): Description                    ← Bug fixes
refactor(db): Description                ← Code improvements
test(events): Description                ← Test additions
docs(readme): Description                ← Documentation
```

---

## Troubleshooting

### MQTT Connection Failed

**Error:** `Connection refused`

**Solutions:**
1. Check MQTT credentials in `.env`
2. Verify broker URL is correct
3. Test with mqtt-cli: `mqtt-cli con -u user -pw pass broker-url`
4. Check firewall/network

### Database Query Errors

**Error:** Foreign key constraint violation

**Solutions:**
1. Verify seed data created successfully: `npx prisma studio`
2. Check relationship definitions in schema
3. Ensure referenced records exist before creating dependent records

### WebSocket Events Not Coming Through

**Error:** Browser doesn't receive socket events

**Solutions:**
1. Verify WebSocket connection in DevTools
2. Check `FRONTEND_URL` in `.env` matches where frontend is running
3. Verify emitSessionCreated() called after session created
4. Check browser console for errors

### Duplicate Sessions Created

**Error:** Multiple AttendanceSession records for same auth

**Solutions:**
1. Check `handleAuthEvent()` queries for existing active session
2. Add `UNIQUE` constraint if needed
3. Test with: publish AUTH → wait → publish AUTH again

---

## Success Criteria

✅ **Day 1:** Database created with all tables  
✅ **Day 2-3:** MQTT events processed into database  
✅ **Day 4:** REST APIs all working  
✅ **Day 5:** WebSocket real-time updates flowing  
✅ **Day 6:** Edge cases handled, code optimized  

**Overall:** Backend ready for frontend integration

---

## Deliverables Summary

By end of Day 6, you'll have:

```
Backend/
├── src/
│   ├── services/
│   │   ├── mqttService.js          ✅
│   │   ├── eventProcessor.js       ✅
│   │   └── websocketService.js     ✅
│   ├── routes/
│   │   ├── attendance.js           ✅
│   │   ├── courses.js              ✅
│   │   ├── devices.js              ✅
│   │   └── enrollment.js           ✅
│   ├── middleware/
│   │   └── auth.js                 ✅ (existing)
│   └── server.js                   ✅ (updated)
├── prisma/
│   ├── schema.prisma               ✅ (complete)
│   ├── seed.js                     ✅
│   └── migrations/                 ✅
└── .env                            ✅ (configured)
```

---

## Next Steps (After Day 6)

1. **Wait for Dev B** to complete frontend (Days 1-6)
2. **Coordinate** with Dev B on integration testing (Days 7-8)
3. **Deploy together** to production (Days 9-11)

---

**Ready to start? Begin with Task A1.1!**

Questions? Check COMPLETE_ROADMAP.md or ask Dev B.

Good luck! 🚀

