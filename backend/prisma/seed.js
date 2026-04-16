/**
 * Database Seed Script - CampuSync
 * Populates test data for development (MQTT-based attendance system)
 * Run: npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (order matters due to foreign keys)
  console.log('🗑️  Clearing existing data...');
  await prisma.anomalyLog.deleteMany();
  await prisma.mQTTEventLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.session.deleteMany();
  await prisma.device.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // ========== CREATE STUDENTS ==========
  console.log('👨‍🎓 Creating students...');
  const studentUsers = [];
  const students = [
    {
      email: 'student1@campusync.com',
      rollNumber: '21CS001',
      name: 'Arjun Sharma',
      department: 'CS',
      year: 2,
    },
    {
      email: 'student2@campusync.com',
      rollNumber: '21CS002',
      name: 'Priya Verma',
      department: 'CS',
      year: 2,
    },
    {
      email: 'student3@campusync.com',
      rollNumber: '21ECE001',
      name: 'Rohan Patel',
      department: 'ECE',
      year: 2,
    },
    {
      email: 'student4@campusync.com',
      rollNumber: '21ECE002',
      name: 'Ananya Singh',
      department: 'CS',
      year: 2,
    },
    {
      email: 'student5@campusync.com',
      rollNumber: '21EE001',
      name: 'Vikram Gupta',
      department: 'ECE',
      year: 2,
    },
  ];

  for (const studentData of students) {
    const hashedPassword = await bcrypt.hash('student123', 10);
    const user = await prisma.user.create({
      data: {
        email: studentData.email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber: studentData.rollNumber,
        name: studentData.name,
        department: studentData.department,
        year: studentData.year,
      },
    });

    studentUsers.push({ user, student });
    console.log(`  ✓ Created ${studentData.name}`);
  }

  // ========== CREATE PROFESSORS ==========
  console.log('👨‍🏫 Creating professors...');
  const professorUsers = [];
  const professors = [
    {
      email: 'prof1@campusync.com',
      employeeId: 'EMP001',
      name: 'Dr. Rahul Sharma',
      department: 'CS',
    },
    {
      email: 'prof2@campusync.com',
      employeeId: 'EMP002',
      name: 'Dr. Meera Patel',
      department: 'ECE',
    },
  ];

  for (const profData of professors) {
    const hashedPassword = await bcrypt.hash('prof123', 10);
    const user = await prisma.user.create({
      data: {
        email: profData.email,
        password: hashedPassword,
        role: 'PROFESSOR',
      },
    });

    const professor = await prisma.professor.create({
      data: {
        userId: user.id,
        employeeId: profData.employeeId,
        name: profData.name,
        department: profData.department,
      },
    });

    professorUsers.push({ user, professor });
    console.log(`  ✓ Created ${profData.name}`);
  }

  // ========== CREATE ADMIN ==========
  console.log('👨‍💼 Creating admin...');
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campusync.com',
      password: adminHashedPassword,
      role: 'ADMIN',
    },
  });

  const admin = await prisma.admin.create({
    data: {
      userId: adminUser.id,
      name: 'Admin User',
    },
  });
  console.log('  ✓ Created Admin User');

  // ========== CREATE COURSES ==========
  console.log('📚 Creating courses...');
  const courses = [
    {
      code: 'CS101',
      name: 'Data Structures',
      description: 'Fundamentals of data structures',
      credits: 3,
      semester: '4',
      professorId: professorUsers[0].professor.id,
    },
    {
      code: 'ECE101',
      name: 'Digital Systems',
      description: 'Digital circuit design',
      credits: 4,
      semester: '4',
      professorId: professorUsers[1].professor.id,
    },
  ];

  const createdCourses = [];
  for (const courseData of courses) {
    const course = await prisma.course.create({
      data: courseData,
    });
    createdCourses.push(course);
    console.log(`  ✓ Created ${course.name}`);
  }

  // ========== ENROLL STUDENTS IN COURSES ==========
  console.log('📝 Creating enrollments...');
  const enrollments = [
    // CS101 - Students 1, 2, 3, 4, 5
    { studentId: studentUsers[0].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[1].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[2].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[3].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[4].student.id, courseId: createdCourses[0].id },

    // ECE101 - Students 3, 4, 5
    { studentId: studentUsers[2].student.id, courseId: createdCourses[1].id },
    { studentId: studentUsers[3].student.id, courseId: createdCourses[1].id },
    { studentId: studentUsers[4].student.id, courseId: createdCourses[1].id },
  ];

  for (const enrollment of enrollments) {
    await prisma.enrollment.create({
      data: enrollment,
    });
  }
  console.log(`  ✓ Created ${enrollments.length} enrollments`);

  // ========== CREATE DEVICES ==========
  console.log('📱 Creating MQTT wristband devices...');
  const devices = [
    {
      // Real device from actual biometric hardware
      deviceId: '00:70:07:25:B6:88',
      studentId: studentUsers[0].student.id,
      deviceStatus: 'ACTIVE',
      batteryLevel: 85,
    },
    {
      deviceId: '00:70:07:25:B6:89',
      studentId: studentUsers[1].student.id,
      deviceStatus: 'ACTIVE',
      batteryLevel: 78,
    },
    {
      deviceId: '00:70:07:25:B6:8A',
      studentId: studentUsers[2].student.id,
      deviceStatus: 'ACTIVE',
      batteryLevel: 92,
    },
    {
      deviceId: '00:70:07:25:B6:8B',
      studentId: studentUsers[3].student.id,
      deviceStatus: 'ACTIVE',
      batteryLevel: 65,
    },
    {
      deviceId: '00:70:07:25:B6:8C',
      studentId: studentUsers[4].student.id,
      deviceStatus: 'INACTIVE',
      batteryLevel: 15,
    },
  ];

  for (const deviceData of devices) {
    await prisma.device.create({
      data: deviceData,
    });
    console.log(`  ✓ Created ${deviceData.deviceId}`);
  }

  // ========== CREATE TEST SESSIONS ==========
  console.log('🎓 Creating test sessions...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const session1 = await prisma.session.create({
    data: {
      courseId: createdCourses[0].id,
      scheduledStartTime: tomorrow,
      scheduledEndTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
      actualStartTime: null,
      actualEndTime: null,
      sessionStatus: 'SCHEDULED',
    },
  });

  const session2 = await prisma.session.create({
    data: {
      courseId: createdCourses[1].id,
      scheduledStartTime: now,
      scheduledEndTime: new Date(now.getTime() + 60 * 60 * 1000),
      actualStartTime: now,
      actualEndTime: new Date(now.getTime() + 45 * 60 * 1000),
      sessionStatus: 'COMPLETED',
    },
  });

  console.log('  ✓ Created test sessions');

  // ========== SUMMARY ==========
  console.log('\n✨ Seed completed successfully!\n');
  console.log('📋 Test Credentials:');
  console.log('   Admin:    admin@campusync.com / admin123');
  console.log('   Professor: prof1@campusync.com / prof123');
  console.log('   Student:  student1@campusync.com / student123');
  console.log('\n📊 Database Summary:');
  console.log('   ✓ 1 Admin');
  console.log('   ✓ 2 Professors');
  console.log('   ✓ 5 Students');
  console.log('   ✓ 2 Courses');
  console.log('   ✓ 8 Enrollments');
  console.log('   ✓ 5 Devices (MQTT wristbands)');
  console.log('   ✓ 2 Sessions (for testing)');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npx prisma studio');
  console.log('   2. Verify all tables are populated');
  console.log('   3. Test login with credentials above');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
