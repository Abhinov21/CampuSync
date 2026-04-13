# 📅 DAY 0 COORDINATION - Both Developers Setup

**Date:** 14 April 2026  
**Time:** 10:00 AM - 10:30 AM (Coordination Meeting)  
**Attendees:** Developer A (Backend), Developer B (Frontend)

---

## 🎯 AGENDA

1. ✅ Reviewed API_CONTRACT.md together (5 min)
2. ✅ Reviewed WEBSOCKET_SPEC.md together (5 min)
3. ✅ Divided work into parallel tasks (5 min)
4. ✅ Set daily sync time (2 min)
5. ✅ Started local environments (8 min)
6. ✅ Tested integration (5 min)

---

## 📋 DECISIONS MADE TOGETHER

### API Contract Agreement
- ✅ **API Response Format:** All responses use `{ message: string, data: object }`
- ✅ **Error Format:** `{ error: string, statusCode: number }`
- ✅ **Status Codes:** 200 (success), 400 (client error), 401 (not auth), 500 (server error)
- ✅ **Date Format:** ISO 8601 (2026-04-14T10:30:00Z)
- ✅ **JWT Token:** Bearer token in Authorization header

### WebSocket Event Agreement
- ✅ **Connection:** Socket.io on same server (http://localhost:5000)
- ✅ **Events:** Structured as `{ type: string, data: object, timestamp: ISO8601 }`
- ✅ **Topics:** `course-sessions`, `session-event`, `mqtt-log`

### Branching Strategy
- ✅ **Main branch:** Always deployment-ready
- ✅ **Dev A branch:** `dev/backend/mqtt` for backend only
- ✅ **Dev B branch:** `dev/frontend/dashboards` for frontend only
- ✅ **No direct commits to main** - work on your branch, PR when done
- ✅ **Merge after daily review** at end of each day

### Daily Sync Schedule
- ✅ **Time:** 10:00 AM every day (Days 1-6)
- ✅ **Duration:** 15-30 minutes
- ✅ **Format:** Standup (what done, blockers, next)
- ✅ **Communication:** Slack/Discord for async updates

---

## 👨‍💻 DEVELOPER A (Backend) - Setup Complete

### Environment
- ✅ Branch: `dev/backend/mqtt`
- ✅ Machine: Ready for MQTT + Express + Prisma
- ✅ Database: PostgreSQL set up
- ✅ Port: 5000 (Node.js Express)

### What You Have Now
```
backend/
├── .env                    ← Configured
├── package.json            ← All deps installed
├── prisma/
│   ├── schema.prisma       ← Database design
│   └── seed.js             ← Test data ready
├── src/
│   ├── server.js           ← Ready to code
│   ├── routes/
│   │   └── auth.js         ← Auth endpoint starter
│   └── utils/
│       └── auth.js         ← JWT helper starter
└── node_modules/           ← All packages installed
```

### Database Status
- ✅ Schema defined (12 models)
- ✅ Migrations ready
- ✅ Test data seeded:
  - 1 admin user
  - 2 professor users
  - 5 student users
  - 3 courses
  - 15 enrollments
  - Historical session data

### Test Data Available
```
Login:  admin@campusync.com / admin123
        prof1@campusync.com / prof123
        student1@campusync.com / student123
```

### First Task (Day 1)
- Implement Prisma client initialization
- Create auth endpoints (/login, /register)
- Verify JWT token generation

### Integration Point
- Dev B will test login against your endpoints starting Day 1

---

## 👩‍💻 DEVELOPER B (Frontend) - Setup Complete

### Environment
- ✅ Branch: `dev/frontend/dashboards`
- ✅ Machine: Ready for React + Vite
- ✅ Port: 5173 (Vite dev server)

### What You Have Now
```
frontend/
├── .env                    ← Configured
├── package.json            ← All deps installed
├── vite.config.js          ← Vite setup
├── tailwind.config.js      ← TailwindCSS ready
├── src/
│   ├── main.jsx            ← App entry
│   ├── App.jsx             ← Routing
│   ├── pages/              ← Empty (ready to fill)
│   ├── components/         ← Empty (ready to fill)
│   ├── store/              ← Zustand setup ready
│   ├── hooks/              ← Custom hooks ready
│   ├── utils/              ← API client ready
│   └── index.css           ← TailwindCSS imported
└── node_modules/           ← All packages installed
```

### Environment Config
- ✅ VITE_API_URL = http://localhost:5000
- ✅ Hot reload enabled
- ✅ TailwindCSS ready

### First Task (Day 1)
- Create React project structure
- Build Login page
- Verify login API call works

### Integration Point
- You'll test against Dev A's backend starting Day 1

---

## 🔄 INTEGRATION WORKFLOW

### Morning (9:45 AM)
1. Dev A: Pull latest code
2. Dev B: Pull latest code
3. Make sure your .env files are up to date

### During Development
1. **Each task:** Work independently on your branch
2. **If API changes needed:** Tell other dev 10 min before commit
3. **Before committing:** Verify your code doesn't break things
4. **After committing:** Push to your branch (no PR yet)

### Daily Sync (10:00 AM)
1. Dev A: "Completed X, starting Y tomorrow"
2. Dev B: "Completed X, starting Y tomorrow"
3. Quick check: Any API format mismatches?
4. Quick check: Any blocker issues?

### Evening (5:00 PM)
1. Both merge from main to catch any conflicts
2. Both commit final changes of the day
3. Push to respective branches

### Tomorrow (9:00 AM)
1. Review what other dev merged
2. Test integration if APIs changed
3. Start fresh task

---

## ✅ PRE-DAY-1 CHECKLIST

### Developer A
- [ ] Backend running on localhost:5000
- [ ] Database seeded with test users
- [ ] Can login via Postman or curl
- [ ] Read through DEVELOPER_A_PLAN.md
- [ ] Ready to start Task A1.1 tomorrow

### Developer B
- [ ] Frontend running on localhost:5173
- [ ] See login page at http://localhost:5173
- [ ] Can see API_URL in network requests
- [ ] Read through DEVELOPER_B_PLAN.md
- [ ] Ready to start Task B1.1 tomorrow

### Both
- [ ] Calendars updated with 10 AM daily sync
- [ ] Slack/Discord for async comms ready
- [ ] Understand git branch strategy
- [ ] Know who to ask for questions

---

## 🚨 CRITICAL AGREEMENTS

### If API Changes
**Rule:** Tell the other dev BEFORE you commit

Example:
```
Dev A: "FYI - changing login response to include role field"
Dev B: "OK, I'll update my login handling"
Dev A: Commits
Dev B: Updates code
```

### If WebSocket Changes
**Rule:** Tell the other dev BEFORE you emit

Example:
```
Dev A: "Adding new event type: 'student-left'"
Dev B: "Got it, I'll listen for that"
```

### If Database Changes
**Rule:** Update seed.js + notify other dev

Example:
```
Dev A: "Adding emailVerified field to User"
Dev A: Updates schema.prisma + seed.js
Dev A: Runs npm run prisma:migrate && npm run prisma:seed
Dev B: "Ready when you are"
```

### If Build Fails
**Rule:** Fix it immediately, don't commit broken code

Example:
```
Dev A: "I broke the build - hang on, fixing now..."
Dev A: Fixes issue
Dev A: Tests locally
Dev A: Then commits
```

---

## 📞 COMMUNICATION CHANNELS

### Immediate Issues
- Slack/Discord (async)
- 10 AM daily sync (sync)

### Code Reviews (if needed)
- GitHub PR comments
- Or just verbal sync

### Questions About Plan
- Read the docs first
- Ask during 10 AM sync
- Check QUICK_REFERENCE.md for examples

---

## 🎯 SUCCESS CRITERIA FOR DAY 0

✅ **Environment Setup:**
- Both developers have their branch checked out
- Both have dependencies installed
- Both can run dev servers

✅ **Database Ready:**
- Schema in place
- Test data seeded
- Can query users/courses/etc

✅ **Integration Points Agreed:**
- API response format finalized
- WebSocket events finalized
- Both devs understand contract

✅ **Communication Ready:**
- Daily sync scheduled
- Slack/Discord working
- Questions? -> Check docs first

---

## 🚀 READY FOR DAY 1?

**Check:**
- [ ] Dev A: Backend running, database ready
- [ ] Dev B: Frontend running, can see login page
- [ ] Both: Understand API_CONTRACT.md
- [ ] Both: Understand WEBSOCKET_SPEC.md
- [ ] Both: Know your Day 1 tasks
- [ ] Both: Know when the 10 AM sync is

**If all checked ✅ → Ready to start!**

---

## 📚 DOCUMENTATION REFERENCE

| Document | Purpose | Priority |
|----------|---------|----------|
| **DAY_0_QUICK_START.md** | 30-min setup guide | 🔴 READ FIRST |
| **API_CONTRACT.md** | API response formats | 🔴 READ TODAY |
| **WEBSOCKET_SPEC.md** | Real-time events | 🔴 READ TODAY |
| **DEVELOPER_A_PLAN.md** | Dev A 6-day plan | 🟡 Read before Day 1 |
| **DEVELOPER_B_PLAN.md** | Dev B 6-day plan | 🟡 Read before Day 1 |
| **QUICK_REFERENCE.md** | Commands, examples | 🟢 Keep handy |
| **PHASE_CHECKLIST.md** | Overall progress | 🟢 Reference |
| **COMPLETE_ROADMAP.md** | Full project spec | 🟢 Reference |

---

## 🎉 LET'S BUILD!

Everything is ready. Both developers have:
- ✅ Clear tasks for next 6 days
- ✅ Pre-approved contracts to avoid rework
- ✅ Independent branches to avoid conflicts
- ✅ Test data to work with
- ✅ Daily sync to catch issues early

**See you tomorrow at 10 AM for Day 1 standup! 🚀**
