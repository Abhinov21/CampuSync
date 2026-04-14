# ⚡ Quick Start - NEXT 24 HOURS

## 🎯 What To Do Now

### For BOTH Developers

#### Step 1: Clone (Already Done)
```bash
# Repository
https://github.com/Abhinov21/CampuSync
```

#### Step 2: Install Dependencies (DO THIS NOW)
```bash
# Terminal 1 - Backend
cd CampuSync/backend
npm install

# Terminal 2 - Frontend
cd CampuSync/frontend
npm install
```

#### Step 3: Verify Installation
```bash
# Backend
cd backend
npm run dev
# Should see: "Server Running on port: 5000"

# Frontend (in another terminal)
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173/"
```

---

## ✅ What's Ready to Use

### Backend Credentials (IN .env)
- ✅ PostgreSQL database configured
- ✅ MQTT broker ready
- ✅ JWT secret configured
- ✅ All CORS settings done

### Frontend Structure (READY TO GO)
- ✅ React project scaffold complete
- ✅ All pages created (10 dashboard pages)
- ✅ Authentication system ready
- ✅ API client configured
- ✅ State management (Zustand) ready

---

## 📅 Day 1 Tasks

### Dev A (Backend)
1. **Database Schema** - Implement 12 entities in `backend/prisma/schema.prisma`
   - User, Student, Professor, Admin, Course, Enrollment
   - Device, Session, AttendanceSession, AttendanceRecord
   - MQTTEventLog, AnomalyLog
   
2. **Seed Data** - Create test users in `backend/prisma/seed.js`
   - 1 Admin, 2 Professors, 5 Students
   - 5 Devices (WB_001 to WB_005)
   - 2 Courses, 10 Enrollments

3. **Run Migrations**
   ```bash
   npx prisma migrate dev --name "init"
   npm run db:seed
   ```

### Dev B (Frontend)
1. **Verify Frontend Runs** - `npm run dev` on port 5173
2. **Wait for Backend** - Test user credentials
3. **Test Login** - Once Dev A provides test users
4. **Prepare for Phase 2** - Dashboard implementation

---

## 🔗 Integration Test (Tomorrow)

### Prerequisites
- Dev A: Backend running on :5000 with test users seeded
- Dev B: Frontend running on :5173

### Test Steps
1. Open http://localhost:5173/login
2. Enter test credentials provided by Dev A
3. Should redirect to dashboard based on role
4. ✅ SUCCESS if login flow works

### Test Credentials (From Dev A - To Be Provided)
```
Student: student@campusync.com / password
Professor: prof@campusync.com / password
Admin: admin@campusync.com / password
```

---

## 📞 Daily Sync (10 minutes)

### Schedule
- **Time:** 10 AM daily
- **Duration:** 10 minutes
- **Participants:** Dev A + Dev B
- **Topics:**
  - What's done?
  - What's blocked?
  - What's next?

---

## 🚨 Important Files

### Don't Forget

#### Backend
- `backend/.env` ← **Keep safe, never commit**
- `backend/prisma/schema.prisma` ← Day 1 work
- `backend/prisma/seed.js` ← Day 1 work

#### Frontend  
- `frontend/.env` ← Already configured
- `frontend/src/App.jsx` ← Main router (don't modify tomorrow)
- `frontend/src/pages/` ← Add dashboard content Days 2-5

### Read These Files
- `API_CONTRACT.md` ← What endpoints look like
- `WEBSOCKET_SPEC.md` ← What events look like
- `DEVELOPER_A_PLAN.md` ← What Dev A is building
- `DEVELOPER_B_PLAN.md` ← What Dev B is building

---

## 🟢 Go/No-Go Checklist

### Before Starting Day 1

#### Dev A
- [ ] Backend .env configured? ✅
- [ ] PostgreSQL credentials work?
- [ ] MQTT credentials work?
- [ ] Can start backend server?
- [ ] Prisma installed and working?

#### Dev B
- [ ] Frontend .env configured? ✅
- [ ] Can run `npm run dev`?
- [ ] Login page rendering at localhost:5173?
- [ ] Console has no errors?
- [ ] All components loading?

#### Both
- [ ] Read DEVELOPER_A/B_PLAN.md?
- [ ] Understood API_CONTRACT.md?
- [ ] Have Dev A's contact info?
- [ ] Ready for daily sync at 10 AM?

---

## ⏱️ Timeline (This Week)

```
Today (April 14)
└─ Setup Complete ✅

Tomorrow (April 15) - Day 1
├─ Dev A: Database + Seed
├─ Dev B: Test login
└─ 10-min sync: Verify working

April 16-19 - Days 2-5
├─ Dev A: MQTT + APIs + WebSocket
├─ Dev B: Dashboard development
└─ Daily syncs

April 19 (Day 6)
├─ Full integration test
├─ Bug fixes
└─ Git merge

April 20+
└─ Production deployment
```

---

## 💬 Communication

### Slack/Email Format
```
[PROJECT] [DEV] [STATUS]
Subject: CampuSync - Dev A - Database Ready

Message:
- Database schema migrated ✅
- Test users seeded ✅
- Backend running on :5000 ✅
- Test credentials: [list]
- Ready for integration test
```

---

## 🎯 Success Checklist

- [ ] Both `npm install` completed
- [ ] Backend runs on :5000
- [ ] Frontend runs on :5173
- [ ] No errors in console
- [ ] Ready for Day 1 coordination sync

---

## 📞 Support

### Issue: npm install fails
```bash
# Try clearing cache
npm cache clean --force
npm install
```

### Issue: Port already in use
```bash
# Kill process on port 5000 or 5173
# Or change port in vite.config.js or .env
```

### Issue: Prisma won't connect
```bash
# Check DATABASE_URL in backend/.env
# Verify PostgreSQL is accessible
npx prisma validate
```

---

## 🚀 Ready?

```bash
# Terminal 1
cd CampuSync/backend && npm install && npm run dev

# Terminal 2
cd CampuSync/frontend && npm install && npm run dev

# Check
# Backend: http://localhost:5000 → {"message":"CampuSync API"}
# Frontend: http://localhost:5173 → Login page appears
```

**Everything looks good?** You're ready for Day 1! 🎉

---

*Last Updated: April 14, 2026*  
*Status: Ready to Proceed*  
*Next: Day 1 Coordination*
