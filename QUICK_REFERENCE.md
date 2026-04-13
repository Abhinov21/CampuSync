# ⚡ Quick Reference Guide

## Command Cheatsheet

### Backend Setup

```bash
# Initial setup (Day 1)
npm install mqtt socket.io bcrypt jsonwebtoken

# Run migrations (Day 2)
npx prisma migrate dev --name "mqtt_attendance_system"

# Seed test data (Day 2)
node prisma/seed.js

# View database GUI (Day 2)
npx prisma studio

# Start dev server (Day 3+)
npm run dev

# Test MQTT connection (Day 3)
mqtt-cli sub -t "fingerprint/match"
```

### Frontend Setup

```bash
# Initial setup (Day 7)
npm create vite frontend -- --template react
cd frontend
npm install react-router-dom axios zustand socket.io-client recharts react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## MQTT Test Messages

### Simulate AUTH Event

```bash
mqtt-cli pub -t "fingerprint/match" -m '{
  "type": "auth",
  "device": "WB_001",
  "id": 5,
  "confidence": 88
}'
```

### Simulate PING Event

```bash
mqtt-cli pub -t "fingerprint/match" -m '{
  "type": "ping",
  "device": "WB_001",
  "id": 5,
  "ts": 1712754123
}'
```

### Simulate SESSION_END Event

```bash
mqtt-cli pub -t "fingerprint/match" -m '{
  "type": "session_end",
  "device": "WB_001",
  "id": 5
}'
```

---

## API Endpoints (Testing with curl)

### Register Student

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "role": "STUDENT",
    "name": "John Doe",
    "rollNumber": "21CS001",
    "department": "Computer Science",
    "year": 3
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

### View Current Session (with token)

```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5000/api/attendance/current \
  -H "Authorization: Bearer $TOKEN"
```

### View Live Attendance (professor)

```bash
curl -X GET http://localhost:5000/api/attendance/course/course-id/live \
  -H "Authorization: Bearer $PROFESSOR_TOKEN"
```

### View Admin MQTT Logs

```bash
curl -X GET http://localhost:5000/api/attendance/admin/mqtt-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Key Files by Phase

### Phase 1 (Days 1-2)

```
✅ prisma/schema.prisma       (Complete schema)
✅ prisma/migrations/         (Migration folder)
✅ prisma/seed.js             (Test data)
```

### Phase 2 (Days 3-6)

```
✅ src/services/mqttService.js        (MQTT connection)
✅ src/services/eventProcessor.js     (Event handling)
✅ src/routes/attendance.js           (REST APIs)
✅ src/services/websocketService.js   (Real-time)
```

### Phase 3 (Days 7-12)

```
✅ frontend/src/store/attendanceStore.js
✅ frontend/src/pages/student/Dashboard.jsx
✅ frontend/src/pages/professor/LiveAttendance.jsx
✅ frontend/src/pages/admin/MQTTMonitor.jsx
✅ frontend/src/components/
```

### Phase 4 (Days 13-15)

```
✅ Tests (Jest/Vitest)
✅ Performance optimization
✅ Bug fixes
```

### Phase 5 (Days 16-18)

```
✅ Backend deployed
✅ Frontend deployed
✅ Monitoring setup
```

---

## Environment Variables

### Backend (.env)

```
# Database
DATABASE_URL="postgresql://user:pass@host/db"

# MQTT
MQTT_BROKER_URL="mqtt://broker.hivemq.cloud"
MQTT_USERNAME="your_username"
MQTT_PASSWORD="your_password"
MQTT_PORT=8883

# Auth
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env)

```
VITE_API_URL="http://localhost:5000"
VITE_MQTT_NAMESPACE="/mqtt-logs"
```

---

## Debugging Tips

### MQTT Not Connecting?

```bash
# Check credentials
echo "username: $(echo $MQTT_USERNAME)"
echo "password: $(echo $MQTT_PASSWORD)"

# Test with mqtt-cli
mqtt-cli con -u username -pw password broker-url

# Check logs
tail -f logs/mqtt.log
```

### WebSocket Not Updating?

```javascript
// Check in browser console
const socket = io('http://localhost:5000');
socket.on('session-event', (event) => {
  console.log('WebSocket event:', event);
});
```

### Database Query Issues?

```bash
# Connect to Prisma Studio
npx prisma studio

# Run raw query
npx prisma db execute --stdin -- << EOF
SELECT * FROM users;
EOF
```

### JWT Token Invalid?

```bash
# Decode JWT (online: https://jwt.io)
# Verify:
# 1. Token not expired
# 2. Secret matches
# 3. Format: Bearer TOKEN (with space)
```

---

## Daily Checklist

### Day 1
- [ ] Schema designed
- [ ] All 12 entities defined
- [ ] Prisma initialized
- [ ] No TypeScript errors

### Day 2
- [ ] Migration ran successfully
- [ ] Prisma Studio shows all tables
- [ ] Seed data script works
- [ ] Test data visible in Studio

### Day 3
- [ ] MQTT service connected
- [ ] Console shows "Connected to HiveMQ"
- [ ] Subscribed to correct topic
- [ ] Can publish test message

### Day 4
- [ ] Event processor handles all 4 types
- [ ] Sessions created/ended correctly
- [ ] Timeouts working
- [ ] Anomalies logged

### Day 5
- [ ] All REST endpoints working
- [ ] Can fetch with curl
- [ ] Auth middleware working
- [ ] Response format correct

### Day 6
- [ ] WebSocket connected
- [ ] Real-time events flowing
- [ ] Session rooms working
- [ ] No console errors

### Day 7
- [ ] React app runs `npm run dev`
- [ ] Vite server on 5173
- [ ] TailwindCSS working
- [ ] Routing setup

### Day 8-12
- [ ] Each page built & tested
- [ ] Navigation working
- [ ] WebSocket events trigger updates
- [ ] Real-time features working

### Day 13-15
- [ ] E2E flow tested
- [ ] All edge cases handled
- [ ] Performance acceptable
- [ ] No memory leaks

### Day 16-18
- [ ] Backend deployed & working
- [ ] Frontend deployed & working
- [ ] APIs reachable
- [ ] Monitoring setup

---

## Common Errors & Solutions

### "Cannot find module 'mqtt'"

**Solution:** `npm install mqtt`

---

### "DATABASE_URL not found"

**Solution:** Add to .env file and restart server

---

### "Connection refused: MQTT"

**Solution:** 
1. Check MQTT_BROKER_URL is correct
2. Verify username/password
3. Check network/firewall

---

### "JWT token invalid"

**Solution:**
1. Use correct token format: `Bearer <token>`
2. Check token not expired
3. Verify JWT_SECRET matches

---

### "Device not found"

**Solution:**
1. Seed test data: `node prisma/seed.js`
2. Check device ID in database
3. Verify MQTT message has correct device ID

---

### "CORS error"

**Solution:**
1. Add frontend URL to CORS config
2. Ensure `app.use(cors())` in server.js
3. Check credentials in API calls

---

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API Response | < 100ms | DevTools Network tab |
| MQTT Processing | < 50ms | Server logs |
| WebSocket Latency | < 100ms | Browser console |
| Dashboard Load | < 2s | Lighthouse |
| Database Query | < 50ms | Prisma logs |

---

## Useful Links

**MQTT Testing:**
- http://mqtt.fx.org/ (GUI tool)
- https://www.eclipse.org/paho/index.php (mqtt-cli)

**Database:**
- Prisma Studio: `npx prisma studio`

**API Testing:**
- Postman: https://www.postman.com/
- Thunder Client: VS Code extension

**Monitoring:**
- Sentry: https://sentry.io/
- LogRocket: https://logrocket.com/

---

## Success Indicators

✅ **By Day 2:** Database schema complete, all tables created  
✅ **By Day 6:** MQTT messages → Database updates (complete pipeline)  
✅ **By Day 12:** All 3 dashboards working with real-time updates  
✅ **By Day 15:** System tested and optimized  
✅ **By Day 18:** Live in production  

---

**Print this page and keep it handy!**

