const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('═══════════════════════════════════════');
    console.log('DATABASE VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    // Check devices
    const devices = await prisma.device.findMany();
    console.log(`1. DEVICES: ${devices.length}`);
    devices.forEach(d => {
      console.log(`   - MAC: ${d.macAddress}, Student: ${d.studentId}, Status: ${d.status}`);
    });

    // Check students
    const students = await prisma.student.findMany({ include: { user: true } });
    console.log(`\n2. STUDENTS: ${students.length}`);
    students.forEach(s => {
      console.log(`   - ${s.user.email} (ID: ${s.id})`);
    });

    // Check courses
    const courses = await prisma.course.findMany({ include: { professor: { include: { user: true } } } });
    console.log(`\n3. COURSES: ${courses.length}`);
    courses.forEach(c => {
      console.log(`   - ${c.code}: ${c.name} (ID: ${c.id}), Prof: ${c.professor?.user?.email}`);
    });

    // Check enrollments
    const enrollments = await prisma.enrollment.findMany({ include: { student: { include: { user: true } }, course: true } });
    console.log(`\n4. ENROLLMENTS: ${enrollments.length}`);
    enrollments.slice(0, 5).forEach(e => {
      console.log(`   - ${e.student.user.email} → ${e.course.code}`);
    });

    // Check if specific device exists
    const mac = '00:70:07:25:B6:88';
    const specificDevice = await prisma.device.findFirst({ where: { macAddress: mac } });
    console.log(`\n5. DEVICE ${mac}:`);
    if (specificDevice) {
      console.log(`   ✅ FOUND - StudentID: ${specificDevice.studentId}, Status: ${specificDevice.status}`);
    } else {
      console.log(`   ❌ NOT FOUND`);
    }

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
