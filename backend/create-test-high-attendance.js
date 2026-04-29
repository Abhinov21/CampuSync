const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get student with specific userId
    const student = await prisma.student.findUnique({
      where: { userId: '9d76dc73-e970-44db-97ba-1bec03506772' }
    });
    
    // Get first course
    const course = await prisma.course.findFirst();
    
    if (!student || !course) {
      console.error('❌ Student or course not found');
      process.exit(1);
    }
    
    console.log(`📝 Creating test session for student: ${student.id}`);
    console.log(`📝 Course: ${course.id}`);
    
    // Create session with 1-hour duration
    const session = await prisma.session.create({
      data: {
        courseId: course.id,
        scheduledStartTime: new Date('2026-04-28T10:00:00Z'),
        scheduledEndTime: new Date('2026-04-28T11:00:00Z'),
        actualStartTime: new Date('2026-04-28T10:00:00Z'),
        actualEndTime: new Date('2026-04-28T11:00:00Z'),
        sessionStatus: 'COMPLETED',
      }
    });
    
    console.log(`✅ Created session: ${session.id}`);
    
    // Create attendance with 80% duration (2880 seconds out of 3600)
    // 65% threshold = 2340 seconds, so 2880 > 2340 = PRESENT
    console.log(`📝 Creating attendance with 80% attendance...`);
    console.log(`   - Session ID: ${session.id}`);
    console.log(`   - Student ID: 8a63f1f4-f3ab-4697-9f9c-3de29a53a3b4`);
    
    try {
      const attendance = await prisma.attendanceSession.create({
        data: {
          studentId: '8a63f1f4-f3ab-4697-9f9c-3de29a53a3b4',
          sessionId: session.id,
          deviceId: 'test-device-high-attendance',
          sessionStartTime: new Date('2026-04-28T10:00:00Z'),
          totalDurationSeconds: 2880,  // 80% of 3600
          sessionStatus: 'ENDED',
        }
      });
      
      console.log(`✅ Created attendance: ${attendance.id}`);
    } catch (innerError) {
      console.error(`❌ Failed to create attendance: ${innerError.message}`);
      console.error(`Full error:`, innerError);
      throw innerError;
    }
    console.log(`   - Total Duration: 2880 seconds (80%)`);
    console.log(`   - 65% Threshold: 2340 seconds`);
    console.log(`   - Expected Status: PRESENT`);
    
    // Test the endpoint
    console.log('\n📡 Testing endpoint response...');
    const response = await fetch('http://localhost:5000/api/attendance/history?limit=1', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ZDc2ZGM3My1lOTcwLTQ0ZGItOTdiYS0xYmVjMDM1MDY3NzIiLCJlbWFpbCI6InN0dWRlbnQxQGNhbXB1c3luYy5jb20iLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTc3NzMyMzg5OSwiZXhwIjoxNzc3OTI4Njk5fQ.kThEKaL6wzXYmTIqBPddzsL7ZJUasJXfMFhB9RvR6vs'
      }
    });
    
    const data = await response.json();
    const newSession = data.data.sessions[0];
    
    console.log(`\n🔍 API Response:`);
    console.log(`   - ID: ${newSession.id}`);
    console.log(`   - Duration: ${newSession.totalDurationSeconds}s`);
    console.log(`   - Attended: ${newSession.attended}`);
    console.log(`   - Status: ${newSession.status}`);
    console.log(`   - Percentage: ${newSession.attendancePercentage}%`);
    
    if (newSession.attended && newSession.status === 'PRESENT') {
      console.log('\n✅ SUCCESS: Logic is working correctly!');
    } else {
      console.log('\n❌ FAILURE: Attended should be true and status should be PRESENT');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
