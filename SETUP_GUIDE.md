# 🚀 CampuSync Setup Guide - Day 0 Complete

**Status:** April 14, 2026 - Ready for Development Day 1  
**Git Repo:** https://github.com/Abhinov21/CampuSync

---

## 📋 Environment Configuration Status

### ✅ Backend Environment Ready
```bash
cd backend
```
- **Database:** Supabase PostgreSQL (configured via DATABASE_URL)
- **MQTT:** HiveMQ Cloud (credentials set)
- **JWT:** Secret key ready (7d expiry)
- **Port:** 5000 (development)
- **File:** `backend/.env` ← All credentials from Dev A

**Credentials Stored:**
- PostgreSQL connection: Active
- MQTT broker: tcp://5ee5c3a3b3e04d16b95d7f36ddad0c05.s1.eu.hivemq.cloud:1883
- MQTT user: campusync_user
- JWT secret: campusync-super-secret-jwt-key-2026-development-phase

### ✅ Frontend Environment Ready
```bash
cd frontend
```
- **API URL:** http://localhost:5000
- **WebSocket URL:** ws://localhost:5000
- **Port:** 5173 (development)
- **File:** `frontend/.env` ← Configured and ready

---

## 🎯 Current Implementation Status

### Backend (Dev A - DEVELOPER_A_PLAN)
| Task | Status | Notes |
|------|--------|-------|
| Project Setup | ✅ Complete | Express, Prisma, dependencies ready |
| Environment Config | ✅ Complete | All credentials from HiveMQ, Supabase |
| Database Schema | 🔄 In Progress | Day 1 Task A1.1 |
| Seed Data | ⏳ Pending | Day 1 Task A1.2 |
| MQTT Integration | ⏳ Pending | Day 2-3 Tasks |
| REST APIs | ⏳ Pending | Day 4 Task |
| WebSocket | ⏳ Pending | Day 5 Task |

### Frontend (Dev B - DEVELOPER_B_PLAN)
| Task | Status | Notes |
|------|--------|-------|
| React + Vite Setup | ✅ Complete | All dependencies installed (config only) |
| Zustand Stores | ✅ Complete | Auth, Attendance, WebSocket stores |
| API Client | ✅ Complete | Axios with JWT interceptor |
| Custom Hooks | ✅ Complete | useAuth, useAttendance, useWebSocket |
| Auth Pages | ✅ Complete | Login & Register pages |
| Protected Routes | ✅ Complete | Role-based access control |
| Dashboard Pages | ✅ Complete | 10 placeholder pages for Days 2-4 |

---

## ⚙️ Installation Steps

### Backend Installation & Start
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run database migrations (when Dev A completes schema)
npx prisma migrate dev --name "init"

# Seed test data (when Dev A completes seed.js)
npm run db:seed

# Start development server
npm run dev

# Expected output:
# ✅ Connected to HiveMQ
# ✅ Subscribed to fingerprint/match
# 🚀 Server running on http://localhost:5000
# 🔌 WebSocket ready
```

### Frontend Installation & Start
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Expected output:
# VITE v5.0.8  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

---

## 🧪 Testing Checklist (After Both Running)

### Backend Health Check
```bash
# Terminal 1 - Backend
curl http://localhost:5000/health
# Should return: {"status":"OK","timestamp":"2026-04-14T..."}
```

### Frontend Login Test
```bash
# Terminal 2 - Frontend (should be running on 5173)
# Browser: http://localhost:5173/login

# Test Credentials (from backend seed):
Email: student1@campusync.com
Password: student123

# Role: STUDENT → Should redirect to /student/dashboard
```

### Database Verification
```bash
# Check database populated with seed data
npx prisma studio
# Should see: Users, Courses, Devices, etc. at http://localhost:5555
```

### MQTT Connection Check
```bash
# Backend logs should show:
# ✅ Connected to HiveMQ
# ✅ Subscribed to fingerprint/match

# Optionally publish test message:
mqtt-cli pub -t "fingerprint/match" -m '{
  "type":"auth",
  "device":"WB_001",
  "id":5,
  "confidence":88
}' -u campusync_user -pw CampuSync@2026Device -h 5ee5c3a3b3e04d16b95d7f36ddad0c05.s1.eu.hivemq.cloud
```

---

## 📁 Project Structure

```
CampuSync/
├── backend/                           # Dev A - REST APIs, MQTT, WebSocket
│   ├── .env                           # ✅ Credentials ready
│   ├── package.json                   # Express, Prisma, MQTT packages
│   ├── src/
│   │   ├── server.js                  # Basic setup, needs expansion
│   │   ├── routes/auth.js             # Partial implementation
│   │   ├── services/                  # To be created (Days 2-4)
│   │   └── utils/auth.js              # JWT & bcrypt utilities
│   └── prisma/
│       ├── schema.prisma              # To be completed (Day 1)
│       └── seed.js                    # To be created (Day 1)
│
├── frontend/                          # Dev B - React UI, Real-time Dashboards
│   ├── .env                           # ✅ URLs configured
│   ├── package.json                   # React, Router, Zustand, Socket.io
│   ├── src/
│   │   ├── App.jsx                    # ✅ Routing with protected routes
│   │   ├── store/                     # ✅ Auth, Attendance, WebSocket stores
│   │   ├── hooks/                     # ✅ useAuth, useAttendance, useWebSocket
│   │   ├── utils/                     # ✅ API client, formatters
│   │   ├── pages/
│   │   │   ├── auth/                  # ✅ Login, Register
│   │   │   ├── student/               # ✅ 3 pages (Days 2-4 content)
│   │   │   ├── professor/             # ✅ 3 pages (Days 2-4 content)
│   │   │   └── admin/                 # ✅ 4 pages (Days 2-4 content)
│   │   └── components/                # To be created (Days 2-5)
│   └── tailwind.config.js             # ✅ Configured
│
├── API_CONTRACT.md                    # ✅ Endpoint specifications agreed
├── WEBSOCKET_SPEC.md                  # ✅ Real-time event formats agreed
├── DEVELOPER_A_PLAN.md                # Dev A's 6-day plan
├── DEVELOPER_B_PLAN.md                # Dev B's 6-day plan
└── TEST_CREDENTIALS.md                # Test user credentials
```

---

## 🔄 Coordination Points (Day 1)

### Dev A Must Complete (Day 1)
1. ✅ Setup `.env` (DONE - provided to Dev B)
2. 🔄 **Database Schema** - Prisma schema with 12 entities
3. 🔄 **Seed Script** - Create test users, courses, devices
4. 📢 **Notify Dev B** when backend is running with test users

### Dev B Must Complete (Day 1)
1. ✅ React project setup (DONE)
2. ✅ Zustand stores (DONE)
3. ✅ API client & hooks (DONE)
4. ✅ Auth pages & routing (DONE)
5. 📢 **Ready to test** when backend provides test credentials

### Integration Test (Day 1 End)
```
Frontend (5173) ←→ Backend (5000) ←→ PostgreSQL
         ↓
    Login works with test credentials
         ↓
    Token stored, user redirects to dashboard
         ↓
    API calls succeed (once endpoints ready)
```

---

## ⚠️ Important Notes

### DO NOT COMMIT/PUSH YET
- All work is local only
- Wait for both developers to complete their respective tasks
- Create separate git branches: `dev/backend/mqtt-integration`, `dev/frontend/dashboards`
- Merge only after integration testing on Day 6

### Environment Files
- `backend/.env` - Contains sensitive credentials (never commit)
- `frontend/.env` - Contains non-sensitive URLs (can commit but use template)
- Both marked in `.gitignore`

### Database Schema
- Must be approved by both developers before migration
- Review: [COMPLETE_ROADMAP.md → Data Model section]
- All 12 entities required for MQTT → Database integration

### API Contract
- Both contracts (API_CONTRACT.md, WEBSOCKET_SPEC.md) are final
- Any deviation requires 10-minute daily sync
- Frontend can build with mock data until backend ready

---

## 📞 Communication Schedule

| Time | Activity | Participants |
|------|----------|---------------|
| **Today (Day 0)** | Environment setup | Dev A ← → Dev B |
| **Tomorrow (Day 1)** | 10 min morning sync | Dev A ← → Dev B |
| **After each phase** | Integration check | Dev A ← → Dev B |

---

## 🎯 Success Metrics (By Day 6 End)

- ✅ Both branches merged to `main`
- ✅ Full MQTT → Database → WebSocket → Frontend flow working
- ✅ All 3 dashboards (Student, Professor, Admin) functional
- ✅ Real-time attendance tracking operational
- ✅ Zero merge conflicts
- ✅ Deployment-ready code

---

**Ready to proceed? Both developers run npm install in their directories!** 🚀

Last Updated: 14 April 2026  
Config by: Dev B & Dev A Coordination
