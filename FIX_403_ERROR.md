# 🔴 403 (Forbidden) Error - Quick Diagnosis

## What You're Experiencing

When professor clicks "End Session" button:
```
❌ Error ending session: Object
Failed to load resource: the server responded with a status of 403 (Forbidden)
```

---

## Root Cause Analysis

### Why 403 Happens
The `403 (Forbidden)` error comes from the authorization middleware checking:
1. **Is the token valid?** (expires after 7 days)
2. **Does the user have PROFESSOR role?** (not STUDENT or ADMIN)
3. **Does the professor own this course?** (course belongs to their ID)

### Most Common Causes (In Order of Likelihood)

| # | Cause | How to Check | How to Fix |
|---|-------|------------|-----------|
| 1 | **Token Expired** | Check if you've been logged in > 7 days | Logout + Login again |
| 2 | **Incorrect User Role** | Check `req.user.role` in backend | Verify user in database has `role = 'PROFESSOR'` |
| 3 | **Course Ownership** | Backend checks course.professorId | Don't try to end another professor's session |
| 4 | **Token Not Being Sent** | Check Authorization header | Make sure localStorage has authToken |
| 5 | **CORS Headers Issue** | Browser security setting | Restart browser, clear cache |

---

## Solutions Applied (Check These First!)

### 1. Enhanced Error Logging ✅
Backend now logs detailed authorization info when 403 occurs:

**In Backend Console, you'll see:**
```
🔍 AUTHZ DEBUG: Checking role authorization
  Required roles: ['PROFESSOR']
  User role: STUDENT  ← If you see STUDENT, you login as wrong account!
  Has access: false
❌ AUTHZ FAILED: Role mismatch
```

### 2. Better Frontend Error Details ✅
Browser console now shows complete error info:
```javascript
// In browser console when error occurs:
Error ending session - Full error object: {...}
  Status: 403
  Status Text: Forbidden
  Data: {
    "status": "error",
    "message": "Insufficient permissions",
    "userRole": "STUDENT",  ← Your actual role
    "requiredRoles": ["PROFESSOR"]
  }
```

### 3. Diagnostic Endpoint Added ✅
Run this in browser console to check your auth:
```javascript
fetch('http://localhost:5000/api/sessions/debug/auth-info', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
}).then(r => r.json()).then(console.log)
```

Expected output:
```json
{
  "status": "info",
  "data": {
    "hasAuthHeader": true,
    "hasToken": true,
    "userId": "user-id-here",
    "userRole": "PROFESSOR"  ← Should be PROFESSOR
  }
}
```

---

## Step-by-Step Troubleshooting

### Step 1: Verify You're Logged In as Professor
```javascript
// In browser console:
console.log('Current user:', localStorage.getItem('user'));
console.log('Has token:', !!localStorage.getItem('authToken'));
```

Expected:
```
Current user: {"id": "...", "email": "professor@campusync.com", "role": "PROFESSOR"}
Has token: true
```

### Step 2: Use Diagnostic Endpoint
```javascript
// Also in browser console:
fetch('http://localhost:5000/api/sessions/debug/auth-info', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
}).then(r => r.json()).then(d => {
  console.log('Role:', d.data.userRole);
  console.log('Has Token:', d.data.hasToken);
  console.log('User ID:', d.data.userId);
})
```

### Step 3: Check Backend Logs
When you try to end session, look for:
```
🔍 DEBUG: End session request
  Session ID: 83474158-5f17-4d59-aa6b-8e8329a99b5d
  User ID: prof-user-id
  User Role: PROFESSOR
  Full User Object: {...}
```

If you see `User Role: STUDENT` → You logged in as student, not professor!  
If you see `User ID: undefined` → Token is invalid!

### Step 4: Verify Token is Valid
```javascript
// Decode your token to see expiration:
const token = localStorage.getItem('authToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
console.log('Current time:', new Date());
console.log('Token valid:', payload.exp * 1000 > Date.now());
```

### Step 5: Nuclear Option - Fresh Login
```javascript
// Clear everything and restart
localStorage.clear();
sessionStorage.clear();
// Then go to http://localhost:5173/login and login again
```

---

## Complete 403 Error Diagnosis Checklist

- [ ] Check browser console for detailed error message
- [ ] Verify you're logged in as PROFESSOR (not STUDENT)
- [ ] Run diagnostic endpoint: `/api/sessions/debug/auth-info`
- [ ] Check token exists: `localStorage.getItem('authToken')`
- [ ] Check user role: `localStorage.getItem('user')`
- [ ] Verify token hasn't expired (7-day expiration)
- [ ] Try logging out and logging back in
- [ ] Clear browser cache: `Ctrl+Shift+Delete`
- [ ] Restart both servers
- [ ] Check backend logs for auth failure details
- [ ] Verify course belongs to your professor account

---

## If Problem Persists

### Enable Maximum Debugging
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to end session
4. Look for failed request to `/api/sessions/[id]/end`
5. Click on it, check:
   - **Request Headers** → Should have `Authorization: Bearer ...`
   - **Response** → Should show error message with `userRole`

### Check Backend for Auth Issues
Backend console should show:
```
🔍 DEBUG: End session request
  Session ID: ...
  User ID: ...
  User Role: PROFESSOR ← Must be this!

🔍 AUTHZ DEBUG: Checking role authorization
  Required roles: ['PROFESSOR']
  User role: PROFESSOR
  Has access: true ← Must be TRUE!
```

If `Has access: false`, then the issue is your role doesn't match `['PROFESSOR']`

---

## What Each Part Does

### Authorization Flow:
```
1. Frontend: `api.patch('/api/sessions/[id]/end')`
   ↓
2. Frontend adds header: `Authorization: Bearer eyJhbGc...`
   ↓
3. Backend middleware `authenticateToken`:
   - Extracts token
   - Verifies JWT signature
   - Decodes to get `userId`, `email`, `role`
   - Stores in `req.user`
   → Returns 403 if token invalid/expired
   ↓
4. Backend middleware `authorizeRole(['PROFESSOR'])`:
   - Checks `req.user.role`
   - Compares against allowed roles
   → Returns 403 if role not in list
   ↓
5. If both pass → Handler executes:
   - Verifies professor owns the course
   - Updates session status
   - Returns 200 Success
```

### Where 403 Can Come From:
```
authenticateToken middleware:
  ❌ No token provided → 401
  ❌ Invalid/expired token → 403
  ✅ Valid token → continue

authorizeRole(['PROFESSOR']):
  ❌ User role is STUDENT → 403
  ❌ User role is ADMIN → 403
  ✅ User role is PROFESSOR → continue

Handler code:
  ❌ Course not owned by professor → 404 (not 403)
  ✅ Everything OK → Session ends, 200
```

---

## After Fixing 403

Once you resolve the 403 error and session ends successfully, you should see:
```javascript
// Browser console:
🛑 Ending session: [session-id]
✅ Session ended successfully: {...}

// Browser:
Alert: "Session ended successfully!"
// Redirects to professor courses page after 2 seconds
```

---

**Remember:** Most 403 errors are because:
1. You're logged in as STUDENT instead of PROFESSOR
2. Your token expired
3. Token isn't being sent (CORS issue)

Check these three things first! ✅
