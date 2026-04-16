# Professor 403 Authorization Issue - Diagnostic & Recovery Guide

**Issue**: Professor gets 403 "Insufficient permissions" when ending sessions with error showing `userRole: 'STUDENT'` instead of `'PROFESSOR'`

**Status**: FIXED with enhanced diagnostics and validation

---

## Quick Fix (Try This First)

### Step 1: Clear Browser Session
```bash
# In browser console, run:
localStorage.clear()
sessionStorage.clear()
```

### Step 2: Hard Refresh
- Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Close and reopen browser tab

### Step 3: Log Out Completely
- If still logged in, click Logout
- Verify localStorage cleared above

### Step 4: Log Back In
- Login again with professor credentials: **prof1@campusync.com** / **prof123**
- Check that login succeeds (no "Account configuration error")

### Step 5: Test Session End
- Start a session as professor
- End the session
- Should work now!

---

## Diagnostic Mode (If Quick Fix Doesn't Work)

### Step 1: Open Browser Console
- Press `F12` or `Ctrl + Shift + I`
- Go to **Console** tab

### Step 2: Check Authentication Status
```javascript
// Copy and paste into console:
diagnoseAuth();
```

**Look for in output**:
```
✅ If showing:
- tokenDecoded.role: "PROFESSOR"
- localStorage.userRole: "PROFESSOR"  
- serverDiagnostics.roleMatch.tokenRoleMatchesDatabaseRole: true

❌ If showing any of:
- tokenDecoded.role: "STUDENT"
- localStorage.userRole: "STUDENT"
- serverDiagnostics.roleMatch.issue: "TOKEN HAS ROLE=..."
```

### Step 3: Check Server Status
```javascript
// In console, run:
await fetch('http://localhost:5000/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log(d));
```

**Expected response** (for professor):
```json
{
  "status": "success",
  "data": {
    "user": {
      "role": "PROFESSOR",
      ...
    }
  }
}
```

---

## Understanding the Issue

### Root Cause
The JWT token in localStorage has `role: 'STUDENT'` when it should have `role: 'PROFESSOR'`. This happens when:

1. **User is logged in as student** (using student credentials by mistake)
2. **Multiple tabs have conflicting logins** (student tab overwrites professor tab token)
3. **Database corruption** (professor account has wrong role - VERY rare)

### Why It Fails
```
Professor tries to end session →
Frontend sends PATCH /api/sessions/:id/end →
Backend receives token with role: 'STUDENT' →
Authorization middleware checks: 'STUDENT' required role: 'PROFESSOR' →
403 Forbidden: Insufficient permissions
```

---

## Enhanced Error Messages

When you now try to end a session with wrong role, you'll see:

```
⚠️ Permission denied: Your role is "STUDENT" but "PROFESSOR" is required
Diagnosing authentication...
(Shows what's in localStorage, token, and database)

"Would you like to log out and log back in?"
```

This new prompt will help you recover automatically.

---

## Server Logs

### Backend Logs to Check

**Look in backend console for login entry**:
```
✅ Login successful: prof1@campusync.com (role: PROFESSOR)
```

If instead you see:
```
❌ ROLE VALIDATION FAILED: Account has PROFESSOR role but no professor profile exists
```

Then there's a database issue and you need to reseed.

### Frontend Logs to Check

**When ending session, look for**:
```
🔐 Token Debug Info: {
  url: '/api/sessions/d2502baa-56f7-4d30-bd10-61529ad6b79d/end',
  method: 'patch',
  userRole: 'PROFESSOR'  ← Should be PROFESSOR
  ...
}
```

If showing `userRole: 'STUDENT'`, that's the problem.

---

## Recovery Procedures

### **Procedure A: Fresh Login**
1. Open localStorage diagnostic page (console)
2. Run `localStorage.clear()`
3. Refresh page
4. Login as professor again
5. Verify diagnostics show all PROFESSOR roles
6. Try ending session

### **Procedure B: Force Clean Session**
```javascript
// In console:
localStorage.removeItem('authToken');
localStorage.removeItem('user');
window.location.href = '/login';
```

### **Procedure C: Database Reset (If A & B Fail)**
Indicates a database corruption. Contact developers or reseed database:
```bash
cd backend
npm run db:push
npm run db:seed
```

---

## Testing Checklist

After implementing fix, test:

- [ ] Professor can log in successfully
- [ ] Login page shows no "Account configuration error"
- [ ] Opening console and running `diagnoseAuth()` shows all roles as PROFESSOR
- [ ] Professor can start a session
- [ ] Professor can end that session without 403 error
- [ ] Students enrolled in course can see the active session
- [ ] Students see session end when professor ends it

---

## Differences in New Version

### What's New:

1. **Frontend Permission Check**
   - Before making end-session request
   - Shows user their current role
   - Suggests fix if wrong

2. **Token Logging**
   - API interceptor now logs token role for sensitive operations
   - Helpful in debugging frontend-to-backend mismatches

3. **Database Role Validation**
   - Login now validates that role matches profile
   - Prevents corrupted accounts from authenticating

4. **Enhanced Debug Endpoint**
   - `/api/sessions/debug/auth-info` compares token vs. database
   - Shows what profiles user has
   - Highlights mismatches

---

## Common Messages & What They Mean

| Message | Cause | Solution |
|---------|-------|----------|
| "Account has PROFESSOR role but no professor profile exists" | Database corruption | Reseed database |
| "Role mismatch: localStorage has STUDENT but token has PROFESSOR" | Old session data | Clear localStorage and login again |
| "Token is expired or expiring soon" | Old token | Clear localStorage and login again |
| "userRole: 'STUDENT', requiredRoles: ['PROFESSOR']" | Wrong account logged in | Logout and use professor account |

---

## For Developers

### Files Changed:
- `frontend/src/utils/api.js` - Enhanced interceptor
- `frontend/src/utils/authDiagnostics.js` - NEW diagnostic utility
- `frontend/src/pages/professor/LiveAttendance.jsx` - Enhanced error handling
- `backend/src/routes/auth.js` - Enhanced login validation
- `backend/src/routes/sessions.js` - Enhanced debug endpoint

### Testing the Fix:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser console, after professor login:
diagnoseAuth()
```

---

## Getting Help

### If still failing after this guide:

1. **Provide console output from**:
   - `diagnoseAuth()` output
   - Network tab showing `/api/sessions/.../end` request and response
   - Backend console showing the PATCH request

2. **Check**:
   - Are you ACTUALLY using `prof1@campusync.com` credentials?
   - Any other browser tabs logged in?
   - Any errors during login?

3. **Try**:
   - Private/Incognito browser window
   - Different browser
   - Hard browser cache clear

---

## Success Indicators

✅ You'll know it's fixed when:
- `diagnoseAuth()` shows userRole: PROFESSOR everywhere
- No permission errors when ending sessions
- Students see sessions end immediately when professor ends them
- No console errors about role mismatches
