// 🧪 SESSION CONSISTENCY TEST - Run in Browser Console (F12)

console.log('🧪 Starting Session Consistency Verification...\n');

// Test 1: Check if backend is running
console.log('📡 Test 1: Backend Connectivity');
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Backend is running');
    console.log('   Status:', data.status);
    console.log('   Database:', data.database);
    console.log('   WebSocket:', data.mqtt);
  })
  .catch(e => console.log('❌ Backend not responding:', e.message));

// Test 2: Check authentication
setTimeout(() => {
  console.log('\n🔐 Test 2: Authentication');
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (token && user.id) {
    console.log('✅ Authenticated');
    console.log('   User:', user.email);
    console.log('   Role:', user.role);
    console.log('   Token:', token.substring(0, 20) + '...');
  } else {
    console.log('❌ Not authenticated');
  }
}, 500);

// Test 3: Check current session
setTimeout(() => {
  console.log('\n📊 Test 3: Current Session Status');
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.log('⚠️  No token, skipping session check');
    return;
  }
  
  fetch('http://localhost:5000/api/attendance/current', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      if (data.data?.currentSession) {
        console.log('✅ Active session found');
        console.log('   Course:', data.data.currentSession.courseName);
        console.log('   Status:', data.data.currentSession.sessionStatus);
        console.log('   Started:', new Date(data.data.currentSession.sessionStartTime).toLocaleTimeString());
      } else {
        console.log('ℹ️ No active session (expected if not started yet)');
      }
    })
    .catch(e => console.log('❌ Error fetching session:', e.message));
}, 1000);

// Test 4: Check enrolled courses
setTimeout(() => {
  console.log('\n📚 Test 4: Enrolled Courses');
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.log('⚠️  No token, skipping courses check');
    return;
  }
  
  fetch('http://localhost:5000/api/courses', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      if (data.data?.courses?.length > 0) {
        console.log(`✅ Found ${data.data.courses.length} courses`);
        data.data.courses.forEach(c => {
          console.log(`   • ${c.name} (${c.code})`);
        });
      } else {
        console.log('ℹ️ No courses enrolled yet');
      }
    })
    .catch(e => console.log('❌ Error fetching courses:', e.message));
}, 1500);

// Test 5: Watch for console logs
setTimeout(() => {
  console.log('\n👀 Test 5: Session Change Detection');
  console.log('ℹ️ Watch for these logs in console:');
  console.log('   🟢 "New session started" = Professor started session');
  console.log('   🔴 "Session ended detected" = Professor ended session');
  console.log('   ✅ "Joined active session" = Student joined session');
}, 2000);

console.log('\n✅ Verification tests started. Check console for results.\n');
