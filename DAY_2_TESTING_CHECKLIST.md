# DAY 2 Quick Testing Checklist

## 🎯 Test Execution Guide

**Before Testing**:
- [ ] Frontend running on :5173 (`npm run dev`)
- [ ] Backend running on :5000 (`npm start`)
- [ ] Database accessible
- [ ] Logged in as: `student1@campusync.com` / `test123`

---

## Test Suite 1: Dashboard Loading ✓

**Location**: `/student` (after login)

- [ ] Page loads without errors
- [ ] Current session card appears
- [ ] 4 statistics cards visible
- [ ] Courses section loads
- [ ] Logout button works

**Expected Time**: 3-5 minutes

---

## Test Suite 2: Real-time Timer ✓

**Location**: `/student` (dashboard)

- [ ] Timer shows HH:MM:SS format
- [ ] Timer increments every second
- [ ] Can watch timer for 5-10 seconds to verify
- [ ] "No active session" message appears when no session
- [ ] No console errors

**Expected Time**: 10-15 seconds (just watch)

---

## Test Suite 3: Pagination ✓

**Location**: `/student/attendance`

- [ ] First page shows 20 records
- [ ] Shows "1 to 20 of X" indicator
- [ ] Click Next → goes to page 2
- [ ] Click Previous → goes back to page 1
- [ ] Page numbers appear at bottom
- [ ] Last page doesn't have Next button
- [ ] First page doesn't have Previous button

**Expected Time**: 5-10 minutes

---

## Test Suite 4: Filtering ✓

**Location**: `/student/attendance`

- [ ] URL shows `?page=1` (no filter)
- [ ] Click course from dashboard → `?course=ID` in URL
- [ ] Only that course's records show
- [ ] Click "Clear Filter" → back to all courses
- [ ] Filter works with pagination

**Expected Time**: 5-10 minutes

---

## Test Suite 5: Status Badges ✓

**Location**: `/student/attendance`

- [ ] Present records have GREEN badge: `✅ Present`
- [ ] Absent records have RED badge: `❌ Absent`
- [ ] Large emoji indicator matches status (✅ or ❌)
- [ ] Date format: "Mon, Jan 15, 2025 10:30 AM"
- [ ] Duration: "1h 30m" (not milliseconds)

**Expected Time**: 5 minutes

---

## Test Suite 6: Loading States ✓

**Location**: Multiple pages

- [ ] Dashboard shows skeleton loaders initially
- [ ] Attendance history shows animated placeholders
- [ ] Loading states disappear when data loads
- [ ] Smooth transition (no jarring content);

**Expected Time**: 3-5 minutes

---

## Test Suite 7: Error Handling ✓

**Location**: Multiple pages

- [ ] Disconnect backend → see error message
- [ ] Clear browser cache → see loading state
- [ ] Invalid course filter → proper error
- [ ] Network error → error card displays

**Expected Time**: 10 minutes (if testing errors)

---

## Test Suite 8: Links & Navigation ✓

**Location**: Multiple pages

- [ ] "Back to Dashboard" link works
- [ ] Quick link cards navigate correctly
- [ ] Course "View Attendance" link filters correctly
- [ ] Logout redirects to login page

**Expected Time**: 5 minutes

---

## Test Suite 9: Responsive Design ✓

**Location**: All pages

- [ ] **Desktop** (>1024px): 4-column stats, 3-column courses
- [ ] **Tablet** (768-1024px): 2-column stats
- [ ] **Mobile** (<768px): 1-column layout
- [ ] Text readable at all sizes
- [ ] Buttons clickable at all sizes

**Testing**:
```bash
Chrome DevTools: Toggle Device Toolbar (Ctrl+Shift+M)
- Desktop: 1440px
- Tablet: 768px
- Mobile: 375px
```

**Expected Time**: 10 minutes

---

## 🐛 Bug Report Template

**If something fails**:

```
Test Suite: [Number]
Test Case: [Name]
Expected: [What should happen]
Actual: [What actually happened]
Console Errors: [Copy error text]
Screenshots: [Describe visual issue]
Reproduction Steps:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
```

---

## ✅ Success Criteria - Final Check

After all tests pass, verify these final items:

- [ ] No console errors at any point
- [ ] All API calls return 200/success status
- [ ] JWT token is in localStorage
- [ ] Logout clears token
- [ ] Re-login works after logout
- [ ] Mobile view is fully usable
- [ ] Pagination doesn't lose data
- [ ] Timer doesn't freeze

---

## 📊 Test Results Summary

**Date Tested**: _______________

| Suite | Tests | Pass | Fail | Status |
|-------|-------|------|------|--------|
| 1. Dashboard | 5 | ___ | ___ | ⏳ |
| 2. Timer | 3 | ___ | ___ | ⏳ |
| 3. Pagination | 7 | ___ | ___ | ⏳ |
| 4. Filtering | 5 | ___ | ___ | ⏳ |
| 5. Badges | 5 | ___ | ___ | ⏳ |
| 6. Loading | 4 | ___ | ___ | ⏳ |
| 7. Navigation | 4 | ___ | ___ | ⏳ |
| 8. Responsive | 4 | ___ | ___ | ⏳ |
| 9. Data | 4 | ___ | ___ | ⏳ |
| **TOTAL** | **41** | **___** | **___** | **⏳** |

**Overall Status**: ⏳ Pending Testing

---

## 🚀 After Testing Passes

Once all tests pass:

1. **Create git commit**:
   ```bash
   git add .
   git commit -m "feat: DEVELOPER_B Day 2 Complete - Student Dashboard with real-time tracking"
   ```

2. **DO NOT PUSH** (wait for user permission)

3. **Move to Day 3**:
   - Professor Dashboard
   - Start/End Sessions (WebSocket)
   - Live Attendance Board

---

**Ready to start testing? Go to `/student` after login!** 🎓
