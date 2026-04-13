# 🎯 DAY 1 Quick Start - Both Developers

**Start Date:** 15 April 2026  
**Duration:** 6 days (Days 1-6 are parallel development)  
**Sync:** 9 AM Daily (10 minutes)

---

## 📋 Developer A (Backend) - Day 1 Start

### Morning (30 min - before you start coding)

```bash
# 1. Pull latest Day 0 setup
cd /home/abhinov/repos/CampuSync
git pull origin main

# 2. Switch to your branch
git checkout dev/backend/mqtt

# 3. Install dependencies
cd backend
npm install

# 4. Verify database was seeded
npx prisma studio
# Opens http://localhost:5555 → Should see:
# ✅ 5 students in "Student" table
# ✅ 3 professors in "Professor" table
# ✅ 1 admin in "Admin" table
# ✅ 4 courses in "Course" table
# If tables are empty → Run: npm run db:seed
```

### Your Task Today: Task A1.1 (1.5 hours)

```bash
# From DEVELOPER_A_PLAN.md
# Task A1.1: Verify Prisma Schema
# - Review schema.prisma (already created)
# - All 12 models defined? ✅
# - All relationships correct? ✅
# Ready to proceed to Task A1.2
```

### Start Coding

```bash
# Estimated: 1.5 hours total
# File: backend/prisma/schema.prisma
# Deliverable: Prisma schema complete and seeded

# When done:
git add backend/
git commit -m "feat(a1.1): Verify and document Prisma schema - Dev A Day 1"
```

### End of Day Checklist

- [ ] Database seeded with test data
- [ ] All schema models present
- [ ] Can see data in Prisma Studio
- [ ] Committed to git branch `dev/backend/mqtt`
- [ ] Ready for Task A1.2 tomorrow (MQTT service)

---

## 💻 Developer B (Frontend) - Day 1 Start

### Morning (30 min - before you start coding)

```bash
# 1. Pull latest Day 0 setup
cd /home/abhinov/repos/CampuSync
git pull origin main

# 2. Switch to your branch
git checkout dev/frontend/dashboards

# 3. Verify Node.js version
node --version  # Should be v18+
npm --version   # Should be 9+
```

### Your Task Today: Task B1.1 (3 hours)

```bash
# From DEVELOPER_B_PLAN.md
# Task B1.1: Create React Project

# Create Vite React app (1 hour)
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies (30 min)
npm install react-router-dom axios zustand socket.io-client recharts react-hot-toast
npm install -D tailwindcss postcss autoprefixer

# Setup Tailwind CSS (30 min)
npx tailwindcss init -p
# Update frontend/src/index.css with tailwind imports

# Verify app runs (15 min)
npm run dev
# Should see: Local: http://localhost:5173/

# Copy environment file
cp ../.env.frontend.template .env
```

### Create .env File

```bash
# frontend/.env
cat > .env << 'EOF'
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_ENV=development
EOF
```

### Commit Your Work

```bash
cd frontend
git add .
git commit -m "feat(b1.1): Initialize React project with Vite and Tailwind - Dev B Day 1"
```

### End of Day Checklist

- [ ] React app created with Vite
- [ ] All npm packages installed
- [ ] TailwindCSS configured
- [ ] Frontend/.env file created
- [ ] App runs on localhost:5173 with no errors
- [ ] Committed to git branch `dev/frontend/dashboards`
- [ ] Ready for Task B1.2 tomorrow (project structure)

---

## 📅 Daily Check-In (9 AM Both Developers)

### Template Message

```
DEVELOPER A STATUS:
Yesterday Completed: Task A1.1 ✅
Today's Task: Task A1.2 (1 hour) - MQTT Service setup
Blockers: None
Commits: 1

DEVELOPER B STATUS:
Yesterday Completed: Task B1.1 ✅
Today's Task: Task B1.2 (1 hour) - Project structure
Blockers: None
Commits: 1

BLOCKERS: None yet

NEXT SYNC: Tomorrow 9 AM
```

---

## 🔗 Essential Reference Files (Keep Open)

1. **Your role-specific plan:**
   - Dev A: [DEVELOPER_A_PLAN.md](DEVELOPER_A_PLAN.md)
   - Dev B: [DEVELOPER_B_PLAN.md](DEVELOPER_B_PLAN.md)

2. **Shared Agreements:**
   - [API_CONTRACT.md](API_CONTRACT.md) - Exact API formats
   - [WEBSOCKET_SPEC.md](WEBSOCKET_SPEC.md) - Real-time events
   - [TEST_CREDENTIALS.md](TEST_CREDENTIALS.md) - Test user accounts

3. **Quick Help:**
   - [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Commands & debugging
   - [COMPLETE_ROADMAP.md](COMPLETE_ROADMAP.md) - Big picture context

---

## ⚠️ Critical Do's and Don'ts

### ✅ DO

- ✅ Follow your DEVELOPER_X_PLAN.md tasks in order
- ✅ Commit after completing each task
- ✅ Notify if deviating from API/WebSocket spec
- ✅ Time-track for accuracy
- ✅ Ask questions in daily sync (don't block silently)
- ✅ Test frequently with test credentials

### ❌ DON'T

- ❌ Skip the 10-minute daily sync
- ❌ Change API format without mutual agreement
- ❌ Push to main branch directly (use your dev branch)
- ❌ Modify API_CONTRACT.md without discussing with other dev
- ❌ Use hardcoded URLs (use .env variables)
- ❌ Assume what the other dev is doing

---

## 🆘 If You Get Stuck

**First:** Check your developer plan troubleshooting section  
**Second:** Check QUICK_REFERENCE.md for that technology  
**Third:** Message other developer  
**Fourth:** Call for emergency sync

---

## 📊 Day 1 Success Looks Like

### Dev A
```
✅ Backend folder has stable structure
✅ npm run dev works without errors
✅ Database seeded and verified
✅ Ready for Task A1.2 (MQTT service)
```

### Dev B
```
✅ Frontend folder created with Vite
✅ npm run dev shows Vite on localhost:5173
✅ TailwindCSS working (styling applied)
✅ Ready for Task B1.2 (project structure)
```

### Both
```
✅ Committed to respective branches
✅ Attended 9 AM daily sync
✅ No blockers identified
✅ On track for schedule
```

---

## 🎯 Timeline Overview (Days 1-6)

| Day | Dev A | Dev B |
|-----|-------|-------|
| **1** | Prisma schema | React setup |
| **2** | MQTT service | Student dashboard |
| **3** | Event processor | Professor dashboard |
| **4** | REST APIs | Admin dashboard |
| **5** | WebSocket service | Charts & analytics |
| **6** | Testing & polish | Testing & responsive |

---

## 🚀 Ready?

**Checklist Before Day 1 Starts:**

- [ ] Pulled latest main branch
- [ ] Checked out your dev branch
- [ ] Read your entire development plan
- [ ] Reviewed API_CONTRACT.md and WEBSOCKET_SPEC.md
- [ ] Verified environment (Node.js, npm, database)
- [ ] Set phone alarm for 9 AM daily sync
- [ ] Have Slack/Teams open for 10-min standup

---

**Good luck! You've got this. 💪**

**See you at 9 AM for the first daily sync.**

Let's build something amazing! 🚀

---

*Generated: 14 April 2026 - Day 0 Complete*
