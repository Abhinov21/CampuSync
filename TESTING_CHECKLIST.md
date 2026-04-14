# 🧪 COMPREHENSIVE TESTING CHECKLIST - Day 6

**Status:** ✅ READY FOR TESTING  
**Backend:** ✅ Running on http://localhost:5000  
**Frontend:** ✅ Running on http://localhost:5173  
**Date:** April 14, 2026

---

## 📋 TEST SEQUENCE

### PART 1: LOGIN & AUTHENTICATION (All Roles)

#### Test 1.1: Bad Credentials
- [ ] Open http://localhost:5173/login
- [ ] Enter: `invalid@test.com` / `wrongpassword`
- [ ] Click "Login"
- [ ] **Expected:** Red error toast: "Login failed"
- [ ] **Console Check:** Look for error message in F12 Console
- [ ] **Note:** If error toast doesn't appear, report it

#### Test 1.2: Login as STUDENT
- [ ] Email: `student1@campusync.com`
- [ ] Password: `student123`
- [ ] Click "Login"
- [ ] **Expected:** 
  - Green toast: "Login successful!"
  - Redirect to `/student/dashboard`
  - Dashboard loads without errors
- [ ] **Console Check:** Press F12, check for red errors

#### Test 1.3: Login as PROFESSOR
- [ ] Logout first (click Logout button)
- [ ] Email: `prof1@campusync.com`
- [ ] Password: `prof123`
- [ ] Click "Login"
- [ ] **Expected:**
  - Green toast: "Login successful!"
  - Redirect to `/professor/courses`
  - Courses page loads (may show "No courses" initially)
- [ ] **Console Check:** Press F12, check for errors

#### Test 1.4: Login as ADMIN
- [ ] Logout first
- [ ] Email: `admin@campusync.com`
- [ ] Password: `admin123`
- [ ] Click "Login"
- [ ] **Expected:**
  - Green toast: "Login successful!"
  - Redirect to `/admin/mqtt-monitor`
  - MQTT Monitor page loads

---

### PART 2: PROFESSOR FLOW - CREATE COURSE

#### Test 2.1: Navigate to Courses (Professor Dashboard)
- [ ] **Status:** Already logged in as professor
- [ ] You should be on `/professor/courses`
- [ ] **Expected:** Page shows "No courses created yet"
- [ ] Click blue "Create Your First Course" button

#### Test 2.2: Course Creation Modal - Form Validation
- [ ] Modal opens with form
- [ ] Leave all fields empty
- [ ] Click "Create"
- [ ] **Expected:** Error toast: "Course name and code are required"
- [ ] Modal stays open (doesn't close on error)

#### Test 2.3: Create Valid Course
- [ ] Fill form:
  - **Course Name:** `Data Structures`
  - **Course Code:** `CS201`
  - **Description:** `Learn fundamental data structures and algorithms`
  - **Credits:** `3` (default is fine)
  - **Semester:** `Spring 2026` (default is fine)
- [ ] Click "Create"
- [ ] **Expected:**
  - Green toast: "Course created successfully!"
  - Modal closes
  - Course appears in list below
  - Course shows: Name, Code, Description, Credits, Student count
- [ ] **Console Check:** No red errors

#### Test 2.4: Verify "Start Session" Button is Visible
- [ ] Look at the course card you just created
- [ ] **Expected:** Two buttons on right side:
  - 📍 "Start Session" (GREEN) ← **THIS WAS HIDDEN BEFORE**
  - 📊 "Analytics" (BLUE)
- [ ] **If button is missing:** REPORT THIS ERROR

#### Test 2.5: Create Duplicate Course Code
- [ ] Click "Create Your First Course" or use modal
- [ ] Try to create another course with code `CS201`
- [ ] **Expected:** Error toast: "Course with this code already exists"
- [ ] Database should NOT have created the duplicate

#### Test 2.6: Create Multiple Valid Courses
- [ ] Create course #2:
  - Name: `Algorithms`
  - Code: `CS301` (different code)
- [ ] Create course #3:
  - Name: `Web Development`
  - Code: `CS401`
- [ ] **Expected:** All 3 courses appear in list
- [ ] All have "Start Session" button visible

---

### PART 3: START ATTENDANCE SESSION

#### Test 3.1: Start Session Button
- [ ] Click "📍 Start Session" on any course
- [ ] **Expected:**
  - Green toast: "Session started successfully!"
  - Page redirects to `/professor/live-attendance`
  - Live attendance page loads
  - (May show "No students" since no students joined yet)
- [ ] **Console Check:** No red errors

#### Test 3.2: Session Details Display
- [ ] On live attendance page, verify:
  - [ ] Course name displayed
  - [ ] Session status shows (should be ACTIVE)
  - [ ] Student list area visible
  - [ ] Real-time updates enabled
- [ ] **Console Check:** Look for WebSocket connection messages

---

### PART 4: PROFESSOR ANALYTICS

#### Test 4.1: Navigate to Analytics
- [ ] Click "📊 Analytics" on any course from courses list
- [ ] **Expected:**
  - Page loads at `/professor/analytics/:courseId`
  - Analytics page displays
  - Charts are visible (may have no data)
- [ ] **Console Check:** No red errors

#### Test 4.2: Analytics Components
- [ ] Verify these sections exist:
  - [ ] Date range selector (All/Week/Month)
  - [ ] Statistics cards (Sessions, Attendance %, etc.)
  - [ ] Charts display
- [ ] No blanks or missing components

---

### PART 5: PROFESSOR COURSES EXPORT

#### Test 5.1: Export Courses to CSV
- [ ] Navigate back to `/professor/courses`
- [ ] Click "📥 Export" button (top right)
- [ ] **Expected:**
  - Green toast: "Courses exported successfully!"
  - CSV file downloads (check Downloads folder)
- [ ] **File Check:** Open CSV, should show:
  - Course Name, Code, Credits, Semester, Students
  - All your created courses in the file

---

### PART 6: STUDENT FLOW

#### Test 6.1: Student Dashboard
- [ ] Logout (if professor still logged in)
- [ ] Login as student: `student1@campusync.com` / `student123`
- [ ] **Expected:** Redirect to `/student/dashboard`
- [ ] Dashboard shows:
  - [ ] Current session card (if professor has one active)
  - [ ] Attendance statistics (0 sessions, 0%, etc.)
  - [ ] Course list area
- [ ] **Console Check:** No red errors

#### Test 6.2: Student Courses Page
- [ ] Click "Courses" page
- [ ] **Expected:** Shows enrolled courses (may be empty initially)
- [ ] No JavaScript errors

#### Test 6.3: Student Attendance Page (if exists)
- [ ] Click "Attendance" page (if link exists)
- [ ] **Expected:** Shows past attendance records (may be empty)

---

### PART 7: ADMIN FLOW

#### Test 7.1: Admin Dashboard
- [ ] Logout (if student still logged in)
- [ ] Login as admin: `admin@campusync.com` / `admin123`
- [ ] **Expected:** Redirect to `/admin/mqtt-monitor`
- [ ] Page loads
- [ ] **Console Check:** No red errors

#### Test 7.2: Admin Pages Navigation
- [ ] Verify sidebar has navigation options:
  - [ ] MQTT Monitor (current page)
  - [ ] Active Sessions
  - [ ] Anomalies
  - [ ] Devices
  - [ ] Analytics
- [ ] Click each page and verify they load

#### Test 7.3: Admin Active Sessions
- [ ] Click "Active Sessions"
- [ ] **Expected:** Page loads, shows any active sessions
- [ ] If professor has session running, it should appear here

#### Test 7.4: Admin Anomalies
- [ ] Click "Anomalies"
- [ ] **Expected:** Page loads, shows alert list
- [ ] May be empty if no anomalies detected

---

### PART 8: ERROR HANDLING & EDGE CASES

#### Test 8.1: Network Error (API Down)
- [ ] Leave frontend running
- [ ] Stop backend server (kill terminal or press Ctrl+C)
- [ ] Professor: Try to create course
- [ ] **Expected:** 
  - Red error toast appears
  - Error message: "Failed to create course" or similar
  - Modal does NOT close (allows retry)
- [ ] Restart backend: Should recover

#### Test 8.2: Missing Fields
- [ ] Create course with ONLY name filled
- [ ] Leave code empty
- [ ] Click "Create"
- [ ] **Expected:** Error toast: "Course name and code are required"

#### Test 8.3: Form State After Cancel
- [ ] Open create course modal
- [ ] Enter some data
- [ ] Click outside modal or find close (X) button
- [ ] Modal closes
- [ ] Open modal again
- [ ] **Expected:** Form is empty (cleared state)

---

### PART 9: RESPONSIVE DESIGN

#### Test 9.1: Desktop View (1920x1080)
- [ ] Press F12 to open DevTools
- [ ] Close DevTools: F12
- [ ] Full screen browser
- [ ] **Expected:**
  - All content fits nicely
  - No horizontal scrolling
  - Buttons are spaced well

#### Test 9.2: Tablet View (768x1024)
- [ ] Press F12 (DevTools)
- [ ] Click device toggle (top left of DevTools)
- [ ] Select iPad
- [ ] **Expected:**
  - Layout adjusts to 2-column grid
  - Text still readable
  - No horizontal scrolling

#### Test 9.3: Mobile View (375x667)
- [ ] In DevTools, select iPhone
- [ ] **Expected:**
  - Everything stacks vertically
  - Buttons are large enough to tap
  - Text is readable
  - No horizontal scrolling

---

### PART 10: BROWSER CONSOLE CHECK

#### Test 10.1: No JavaScript Errors
- [ ] After each major action, press F12
- [ ] Check Console tab
- [ ] **Expected:** No RED errors (warnings in yellow are OK)
- [ ] **If RED errors found:** Screenshot and report

#### Test 10.2: WebSocket Connection
- [ ] In Console, scroll up to find WebSocket messages
- [ ] **Expected:** Messages like:
  - "✅ WebSocket connected"
  - OR "Real-time connection established" (toast)
- [ ] **If missing:** Check Network tab for ws://localhost:5000

#### Test 10.3: API Calls
- [ ] In DevTools, go to Network tab
- [ ] Refresh page
- [ ] Create a course
- [ ] **Expected:** See requests:
  - POST /api/courses
  - Response status: 201 (success)
- [ ] **If 404:** Report this issue

---

## 🚨 ERROR REPORTING FORMAT

If you find an ERROR, please provide:

```
ERROR REPORT:
=============
Test Performed: [Which test above]
Expected: [What should happen]
Actual: [What actually happened]
Console Error: [Copy-paste exact error from F12 console]
Steps to Reproduce: [Clear steps to recreate]
Severity: [CRITICAL/HIGH/MEDIUM/LOW]
```

---

## ✅ SUCCESS INDICATORS

### All Tests Passing When:
- [x] Login works for all 3 roles
- [x] Professor can create courses
- [x] "Start Session" button is visible
- [x] Start session works
- [x] Analytics page loads
- [x] Export works
- [x] Student/Admin pages load
- [x] No red console errors
- [x] Responsive design works
- [x] Error handling shows toasts

---

## 📊 QUICK STATUS CHECK

| Component | Status | Notes |
|-----------|--------|-------|
| Backend | ✅ Running | Port 5000 |
| Frontend | ✅ Running | Port 5173 |
| Database | ✅ Connected | Postgres/MySQL |
| WebSocket | ✅ Ready | ws://localhost:5000 |
| Authentication | ✅ Working | JWT tokens |
| Toast Notifications | ✅ Ready | react-hot-toast |
| Courses API | ✅ Fixed | POST endpoint added |

---

## 🔍 WHERE TO LOOK FOR ERRORS

### Browser Console (F12)
- Click **Console** tab
- Look for RED messages (errors)
- Yellow warnings are OK

### Network Tab (F12)
- Click **Network** tab
- Click a button to trigger API call
- Watch for requests
- Check Status: 200/201 (good), 404/500 (bad)

### Backend Terminal
- Watch for 🔴 red ERROR messages
- Should see ✅ SUCCESS messages for requests

### Frontend Terminal
- Should be quiet after startup
- Only shows Vite compilation messages

---

## 🎬 START TESTING NOW!

**Steps:**
1. Open browser to http://localhost:5173/login
2. Go through testing checklist above ⬆️
3. For EACH error: Note it down with details
4. Report errors in the format above
5. DO NOT PUSH until all critical issues fixed

**When Done:**
- Tell me: "Testing complete, found X issues"
- List all issues found
- I'll fix them one by one
- Then we push to GitHub! 🎉

---

*Testing Checklist v1.0 | April 14, 2026*
