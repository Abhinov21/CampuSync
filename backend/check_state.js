const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('=== DEVICE REGISTRATION CHECK ===\n');
  
  // Check devices
  const devices = await prisma.device.findMany({ 
    include: { student: { include: { user: true } } } 
  });
  console.log('Devices in DB:', devices.length);
  devices.forEach(d => {
    console.log(`  MAC: ${d.macAddress}, Student: ${d.student?.user?.email || 'UNREGISTERED'}, Status: ${d.status}`);
  });
  
  console.log('\n=== COURSE ENROLLMENT CHECK ===\n');
  
  // Get Data Structures course
  const course = await prisma.course.findFirst({ where: { code: 'CS101' } });
  if (!course) {
    console.log('❌ CS101 not found!');
  } else {
    console.log(`✅ Found: ${course.name} (ID: ${course.id})`);
    
    // Check enrollments
    const enrollments = await prisma.enrollment.findMany({ where: { courseId: course.id }, include: { student: { include: { user: true } } } });
    console.log(`   Enrollments: ${enrollments.length}`);
    enrollments.forEach(e => {
      console.log(`     - ${e.student.user.email}`);
    });
  }
  
  console.log('\n=== ACTIVE SESSIONS CHECK ===\n');
  const sessions = await prisma.session.findMany({ 
    where: { status: 'ACTIVE' }, 
    include: { course: true } 
  });
  console.log('Active sessions:', sessions.length);
  sessions.forEach(s => {
    console.log(`  Course: ${s.course.name}, ID: ${s.id}, Created: ${s.createdAt}`);
  });
  
  await prisma.$disconnect();
})();
