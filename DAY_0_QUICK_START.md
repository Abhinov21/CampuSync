# 🚀 DAY 0 QUICK START GUIDE

**For:** Both Developers  
**Time:** 30 minutes  
**Goal:** Get your environment ready for Day 1

---

## STEP 1: Pull Latest (5 min)

```bash
# Go to project directory
cd CampuSync

# Get all Day 0 setup files
git checkout main
git pull origin main

# Verify you see these files:
ls -la | grep -E "(API_CONTRACT|WEBSOCKET|TEST_CREDENTIALS|DAY_0)"
```

Expected output:
```
API_CONTRACT.md
WEBSOCKET_SPEC.md
TEST_CREDENTIALS.md
DAY_0_COMPLETE.md
DAY_0_SUMMIT.md
DEVELOPER_A_PLAN.md
DEVELOPER_B_PLAN.md
```

---

## STEP 2: Checkout Your Branch (2 min)

### If you're Developer A (Backend):
```bash
git checkout dev/backend/mqtt
git pull origin dev/backend/mqtt
```

### If you're Developer B (Frontend):
```bash
git checkout dev/frontend/dashboards
git pull origin dev/frontend/dashboards
```

Verify:
```bash
git branch
# Should show an asterisk (*) next to your branch name
```

---

## STEP 3: Install Dependencies (10 min)

### Developer A - Backend:
```bash
cd backend
npm install

# Takes ~2-3 minutes
# Should end with: "added XXX packages"
```

### Developer B - Frontend:
```bash
cd frontend
npm install

# Takes ~2-3 minutes
# Should end with: "added XXX packages"
```

---

## STEP 4: Setup & Test (10-15 min)

### Developer A - Backend Database:
```bash
cd backend

# Create database and tables
npm run prisma:migrate

# Seed test data (admin, professors, students, courses)
npm run prisma:seed

# Verify it worked:
# Should see: "✅ Database seed completed successfully!"
```

**Then start backend:**
```bash
npm run dev

# Should show:
# ✅ Server running on http://localhost:5000
```

**Keep this terminal open!**

---

### Developer B - Frontend:
```bash
cd frontend

# Start development server
npm run dev

# Should show:
# ✅ VITE v4.x.x  ready in XXX ms
# ✅ ➜  Local:   http://localhost:5173/
```

**Open http://localhost:5173 in browser**

Should see: CampuSync login page

---

## STEP 5: Test Login (5 min)

### With Backend Running + Frontend Open:

**Test with these credentials:**
```
Email:    student1@campusync.com
Password: student123
```

**Expected behavior:**
- ✅ Click Login
- ✅ Wait for response (~1 second)
- ✅ See success message (or redirect to dashboard)
- ✅ No errors in browser console

**If it doesn't work:**

Check backend logs (in terminal where backend is running):
```
POST /auth/login - should show 200 OK
```

Check browser console (F12 → Console tab):
```
Should NOT see any errors
Should see JWT token in Network tab → Headers
```

---

## 📋 FILES YOU MUST READ TODAY

| File | You | Time |
|------|-----|------|
| **API_CONTRACT.md** | Both | 10 min |
| **WEBSOCKET_SPEC.md** | Both | 10 min |
| **TEST_CREDENTIALS.md** | Both | 5 min |
| **DEVELOPER_A_PLAN.md** | Dev A only | 15 min |
| **DEVELOPER_B_PLAN.md** | Dev B only | 15 min |

Total reading time: **30-50 minutes**

---

## 🎯 By End of Day 0, You Should Have:

- [ ] Repository cloned
- [ ] Your development branch checked out
- [ ] npm dependencies installed
- [ ] Backend running on localhost:5000
- [ ] Frontend running on localhost:5173
- [ ] Login test successful
- [ ] All required documents read
- [ ] Environment files (.env) verified

---

## ⚠️ TROUBLESHOOTING

### "Port 5000 already in use"
```bash
# Kill the process:
lsof -ti:5000 | xargs kill -9

# Or use different port in backend/.env:
PORT=5001
```

### "npm install fails"
```bash
# Update npm first:
npm install -g npm@latest

# Clear cache:
npm cache clean --force

# Try install again:
npm install
```

### "Database connection failed"
```bash
# Check DATABASE_URL in backend/.env
cat backend/.env | grep DATABASE_URL

# If using local PostgreSQL, start it:
sudo systemctl start postgresql

# Or use Supabase URL if available
```

### "VITE_API_URL is undefined"
```bash
# Make sure frontend/.env exists:
ls -la frontend/.env

# If missing, update it with:
VITE_API_URL=http://localhost:5000
```

---

## 📞 WHO TO CONTACT

- **Questions about backend setup?** → Check DEVELOPER_A_PLAN.md
- **Questions about frontend setup?** → Check DEVELOPER_B_PLAN.md
- **API format questions?** → Read API_CONTRACT.md
- **WebSocket questions?** → Read WEBSOCKET_SPEC.md

---

## ✨ YOU'RE READY!

After completing this guide, you're ready for Day 1.

**Developer A:** Start with Task A1.1 (Prisma schema)  
**Developer B:** Start with Task B1.1 (React project)

**Questions?** Check DAY_0_COMPLETE.md for detailed setup info.

**Good luck! 🚀**
