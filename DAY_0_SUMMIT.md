# 🚀 DAY 0 SUMMIT - Pre-Development Coordination

**Date:** 14 April 2026  
**Duration:** 30 minutes  
**Attendees:** Developer A (Backend), Developer B (Frontend)  
**Status:** Ready to Execute

---

## Meeting Agenda

1. Approve API Contract ✓
2. Approve WebSocket Events ✓
3. Verify Environment Setup ✓
4. Git Branch Strategy ✓
5. Database Initialization ✓
6. Begin Work Distribution ✓

---

## 📋 PHASE 1: Git Setup (Both Developers - 5 min)

### What Changed Since Yesterday

All Day 0 coordination files are now available:

```
✅ API_CONTRACT.md          → Exact API response formats
✅ WEBSOCKET_SPEC.md         → Real-time event specifications  
✅ TEST_CREDENTIALS.md       → Test user accounts
✅ backend/.env              → Database & MQTT configuration
✅ .env.frontend.template    → Frontend environment template
✅ backend/prisma/seed.js    → Test data seed script
✅ Git branches created      → Ready for split development
```

### For Both Developers

**Step 1: Pull Latest Changes**

```bash
# Pull main with all new files
git pull origin main

# Verify you see these new files
ls -la | grep -E "(API_CONTRACT|WEBSOCKET|TEST_CREDENTIALS)"
```

**Step 2: Review Contract & Spec (5 min)**

```bash
# Dev A: Read these first
cat API_CONTRACT.md        # Understand what endpoints you'll build
cat WEBSOCKET_SPEC.md      # Understand real-time events you'll emit

# Dev B: Read these first  
cat API_CONTRACT.md        # Understand what APIs you'll consume
cat WEBSOCKET_SPEC.md      # Understand what listeners you'll add
```

**Critical Agreement:**
- [ ] Dev A: Confirm API response formats match contract
- [ ] Dev B: Confirm API consumption code matches contract
- [ ] **Both:** Confirm WebSocket event names and payloads

If any format needs change → **STOP and discuss immediately**

---

## 🔧 PHASE 2: Environment & Database Setup (Dev A - 10 min)

### Developer A (Backend) Responsibilities

**Step 1: Verify Backend .env File** (2 min)

```bash
cd backend
cat .env
```

Expected output includes:
- ✅ DATABASE_URL (Supabase PostgreSQL)
- ✅ JWT_SECRET for authentication
- ✅ MQTT_BROKER, MQTT_USERNAME, MQTT_PASSWORD
- ✅ FRONTEND_URL=http://localhost:5173
- ✅ PORT=5000

**If DATABASE_URL is empty/wrong:**
```
Contact admin for Supabase credentials
Copy this format:
postgresql://user:password@host:port/database
```

**Step 2: Install Backend Dependencies** (3 min)

```bash
cd backend
npm install
# Should see all packages installed including Socket.io
```

**Verify installations:**
```bash
npm ls | grep -E "(mqtt|socket.io|prisma|bcrypt|jsonwebtoken)"
```

**Step 3: Initialize Database Schema** (3 min)

```bash
# Push schema to database
npx prisma db push

# Expected: ✨ Your database is now in sync with your schema
```

**Step 4: Seed Test Data** (2 min)

```bash
# Populate test users and courses
npx prisma db seed

# Expected output:
# 🌱 Starting database seed...
# ✓ Created Arjun Sharma
# ✓ Created Priya Verma
# ... etc
# ✨ Seed completed successfully!
```

**Verification:**
```bash
# Can connect to Supabase and see seed data
npx prisma studio
# Opens http://localhost:5555 → Verify users and courses table populated
```

**Checkpoint: Confirm with Dev B**
```
✅ Database initialized
✅ Test users created
✅ Ready for backend API development
```

---

## 💻 PHASE 3: Frontend Setup (Dev B - 10 min)

### Developer B (Frontend) Responsibilities

**Step 1: Create Frontend Environment File** (1 min)

```bash
# Copy template to frontend/.env (when frontend folder exists)
cd frontend
cp ../.env.frontend.template .env
cat .env
```

Expected content:
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_ENV=development
```

**Step 2: Git Branch Setup** (2 min)

```bash
# You are currently on main
git branch

# When ready to start Day 1, switch to frontend branch
git checkout dev/frontend/dashboards
git status  # Should show "On branch dev/frontend/dashboards"

# All your Day 1+ work goes on this branch
```

**Step 3: Pre-Day 1 Preparation** (5 min)

You'll create the React project in Task B1.1 tomorrow. For now:

- [ ] Read DEVELOPER_B_PLAN.md completely
- [ ] Understand Task B1.1 (Create React project)
- [ ] Ensure Node.js v18+ installed
  ```bash
  node --version  # Should be v18+
  npm --version   # Should be 9+
  ```

**Checkpoint: Confirm with Dev A**
```
✅ Environment configured
✅ Git branch ready
✅ Ready for frontend development
```

---

## 🗂️ PHASE 4: Contract Agreement (Both - 5 min)

### API Contract Approval

**Dev A Questions to Answer:**
- ✅ Can you provide all endpoints in API_CONTRACT.md exactly as specified?
- ✅ Can you return responses in exact JSON format?
- ✅ Will timestamps always be ISO 8601 with Z suffix?
- ✅ HTTP status codes match the contract?

**Dev A - If cannot comply:**
```
1. State which endpoint/format needs change
2. Propose alternative format
3. Dev B reviews and approves
4. Update API_CONTRACT.md together
5. Both commit updated contract
```

**Dev B Questions to Answer:**
- ✅ Can you consume all APIs in exact format specified?
- ✅ Will you handle all error codes in contract?
- ✅ Can you store JWT token and add to all requests?

**Dev B - If needs clarification:**
```
Ask Dev A before Thursday:
1. What exact error messages will be returned?
2. What happens if user has no active session?
3. What's the max number of sessions the API returns?
```

### WebSocket Contract Approval

**Dev A Questions to Answer:**
- ✅ Can you emit events with exact names and payload structure?
- ✅ Will you join Socket.io rooms as specified?
- ✅ Can you handle `join-session` and `leave-session` client methods?

**Dev B Questions to Answer:**
- ✅ Can you listen to all events specified?
- ✅ Will you handle all event types gracefully?
- ✅ Can you emit `join-session`, `leave-session` methods?

**Signed Agreement (Both Developers):**

```
CONTRACT AGREEMENT - Day 0

I, Developer A (Backend):
  ☑ Commit to implementing all APIs exactly as specified in API_CONTRACT.md
  ☑ Commit to emitting WebSocket events per WEBSOCKET_SPEC.md
  ☑ Will notify Dev B immediately if I cannot comply
  Signature: Dev A (Date: 14 April 2026)

I, Developer B (Frontend):
  ☑ Commit to consuming all APIs as specified in API_CONTRACT.md
  ☑ Commit to listening to WebSocket events per WEBSOCKET_SPEC.md
  ☑ Will notify Dev A immediately if I need clarification
  Signature: Dev B (Date: 14 April 2026)
```

---

## 📅 PHASE 5: Work Distribution (Both - 5 min)

### Git Branch Assignment

| Developer | Branch | Work |
|-----------|--------|------|
| **Dev A** | `dev/backend/mqtt` | Days 1-8: Backend APIs, MQTT, Real-time |
| **Dev B** | `dev/frontend/dashboards` | Days 1-8: React UI, Dashboards, Charts |

### Non-Interfering Tasks

**Dev A starts with (Day 1):**
1. Database schema ✅ (already done)
2. Seed script ✅ (already done)
3. MQTT service
4. Event processor
5. REST APIs

**Dev B starts with (Day 1):**
1. React project setup
2. Authentication UI
3. Student dashboard
4. Professor dashboard
5. Admin dashboard

**Blocking Points:**
- Dev B paused at Task B2 until Dev A completes REST APIs (Day 4)
  - **Workaround:** Use mock data from API_CONTRACT.md examples
  - **No actual blocking** - both can work in parallel

---

## ✅ PHASE 6: Daily Sync Schedule

### 10-Minute Daily Sync (9:00 AM)

**What to discuss:**
- [ ] Yesterday's blocker
- [ ] Today's planned tasks
- [ ] Any contract deviations

**Template Message:**

```
Dev A Yesterday: Completed MQTT service, started event processor
Dev A Today: Event processor + first 3 REST endpoints
Dev B Yesterday: React setup + Login page
Dev B Today: Student dashboard pages
Blockers: None yet
Next Sync: Tomorrow 9 AM
```

**Escalation:**
- If blocked → discuss immediately
- If contract deviation needed → approve changes before coding
- If uncertain → ask before committing

---

## 🔐 PHASE 7: Test Credentials Revealed

### Login Test Users

**Student Account:**
```
Email: student1@campusync.com
Password: student123
```

**Professor Account:**
```
Email: prof1@campusync.com
Password: prof123
```

**Admin Account:**
```
Email: admin@campusync.com
Password: admin123
```

See complete list in TEST_CREDENTIALS.md

---

## 🚦 Ready to Begin?

### Checklist Before Day 1 Starts

**Dev A (Backend):**
- [ ] Database initialized with seed data
- [ ] All tables populated (users, courses, devices)
- [ ] Backend .env configured
- [ ] Checked out branch `dev/backend/mqtt`
- [ ] API_CONTRACT.md reviewed and approved
- [ ] WEBSOCKET_SPEC.md reviewed and approved
- [ ] Read DEVELOPER_A_PLAN.md completely
- [ ] Understood Task A1.1 (Prisma schema)

**Dev B (Frontend):**
- [ ] Frontend .env template reviewed
- [ ] Checked out branch `dev/frontend/dashboards`
- [ ] API_CONTRACT.md reviewed and approved
- [ ] WEBSOCKET_SPEC.md reviewed and approved
- [ ] Read DEVELOPER_B_PLAN.md completely
- [ ] Understood Task B1.1 (React setup)
- [ ] Node.js v18+ verified

### Start Day 1

**Dev A** → Run: `npm run dev` in backend folder → Start Task A1.1

**Dev B** → Follow Task B1.1 → Create React project

**Both** → Meet for 10-min sync at 9 AM daily

---

## 📞 Emergency Contacts

**If blocked while working:**
1. Check QUICK_REFERENCE.md troubleshooting section
2. Check DEVELOPER_X_PLAN.md for your lane
3. Message other developer in Slack/Teams
4. If critical: Interrupt daily sync

---

## 🎯 Success Metrics (Day 0)

✅ Both developers understand:
- What APIs will be built (Dev A)
- What APIs will be consumed (Dev B)
- Real-time events structure (both)
- Test user credentials (both)
- Git workflow (both)
- Daily sync schedule (both)

✅ Day 1 can begin immediately without confusion

✅ 0 unexpected API format surprises during integration

---

**Day 0 Complete! ✨**

**Next:** Day 1 Begins Tomorrow at 9 AM

Git branches are ready. Database is seeded. APIs are specified. WebSocket events are documented.

**Let's build CampuSync! 🚀**

