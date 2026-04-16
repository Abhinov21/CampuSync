const axios = require('axios');

const BASE = 'http://localhost:5000';

async function test() {
  try {
    // Login
    const loginRes = await axios.post(`${BASE}/auth/login`, {
      email: 'prof1@campusync.com',
      password: 'prof123'
    });

    const token = loginRes.data.data.token;
    console.log('✅ Login OK');

    // Get courses
    const coursesRes = await axios.get(`${BASE}/api/courses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('\n📚 Professor Prof1 teaches:');
    coursesRes.data.courses?.forEach(c => {
      console.log(`   ${c.code}: ${c.name} (ID: ${c.id})`);
    });

    if (!coursesRes.data.courses?.length) {
      console.log('   ⚠️  No courses assigned to this professor!');
    }
  } catch(e) {
    console.error('❌', e.response?.data || e.message);
  }
}

test();
