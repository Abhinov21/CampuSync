/**
 * Database Seed Script - CampuSync
 * Populates test data for development
 * Run: npx prisma db seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
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
      rollNumber: '2024001',
      name: 'Arjun Sharma',
      department: 'CS',
      year: 2,
      rfidTag: 'RFID_001',
    },
    {
      email: 'student2@campusync.com',
      rollNumber: '2024002',
      name: 'Priya Verma',
      department: 'CS',
      year: 2,
      rfidTag: 'RFID_002',
    },
    {
      email: 'student3@campusync.com',
      rollNumber: '2024003',
      name: 'Rohan Patel',
      department: 'ECE',
      year: 2,
      rfidTag: 'RFID_003',
    },
    {
      email: 'student4@campusync.com',
      rollNumber: '2024004',
      name: 'Ananya Singh',
      department: 'CS',
      year: 2,
      rfidTag: 'RFID_004',
    },
    {
      email: 'student5@campusync.com',
      rollNumber: '2024005',
      name: 'Vikram Gupta',
      department: 'ECE',
      year: 2,
      rfidTag: 'RFID_005',
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
        rfidTag: studentData.rfidTag,
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
    {
      email: 'prof3@campusync.com',
      employeeId: 'EMP003',
      name: 'Dr. Arun Kumar',
      department: 'CS',
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
      code: 'CS102',
      name: 'Algorithms',
      description: 'Algorithm design and analysis',
      credits: 3,
      semester: '4',
      professorId: professorUsers[0].professor.id,
    },
    {
      code: 'ECE201',
      name: 'Digital Systems',
      description: 'Digital circuit design',
      credits: 4,
      semester: '4',
      professorId: professorUsers[1].professor.id,
    },
    {
      code: 'CS103',
      name: 'Database Systems',
      description: 'Database design and SQL',
      credits: 3,
      semester: '4',
      professorId: professorUsers[2].professor.id,
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
    // CS101 - All students
    { studentId: studentUsers[0].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[1].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[2].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[3].student.id, courseId: createdCourses[0].id },
    { studentId: studentUsers[4].student.id, courseId: createdCourses[0].id },

    // CS102 - CS students
    { studentId: studentUsers[0].student.id, courseId: createdCourses[1].id },
    { studentId: studentUsers[1].student.id, courseId: createdCourses[1].id },
    { studentId: studentUsers[3].student.id, courseId: createdCourses[1].id },

    // ECE201 - ECE students
    { studentId: studentUsers[2].student.id, courseId: createdCourses[2].id },
    { studentId: studentUsers[4].student.id, courseId: createdCourses[2].id },

    // CS103 - All students
    { studentId: studentUsers[0].student.id, courseId: createdCourses[3].id },
    { studentId: studentUsers[1].student.id, courseId: createdCourses[3].id },
    { studentId: studentUsers[2].student.id, courseId: createdCourses[3].id },
    { studentId: studentUsers[3].student.id, courseId: createdCourses[3].id },
    { studentId: studentUsers[4].student.id, courseId: createdCourses[3].id },
  ];

  for (const enrollment of enrollments) {
    await prisma.enrollment.create({
      data: enrollment,
    });
  }
  console.log(`  ✓ Created ${enrollments.length} enrollments`);

  // ========== CREATE DEVICES ==========
  console.log('📱 Creating devices...');
  const devices = [
    {
      deviceId: 'WRISTBAND_001',
      studentId: studentUsers[0].student.id,
      status: 'ACTIVE',
      batteryLevel: 85,
    },
    {
      deviceId: 'WRISTBAND_002',
      studentId: studentUsers[1].student.id,
      status: 'ACTIVE',
      batteryLevel: 78,
    },
    {
      deviceId: 'WRISTBAND_003',
      studentId: studentUsers[2].student.id,
      status: 'ACTIVE',
      batteryLevel: 92,
    },
    {
      deviceId: 'WRISTBAND_004',
      studentId: studentUsers[3].student.id,
      status: 'ACTIVE',
      batteryLevel: 65,
    },
    {
      deviceId: 'WRISTBAND_005',
      studentId: studentUsers[4].student.id,
      status: 'INACTIVE',
      batteryLevel: 15,
    },
  ];

  for (const deviceData of devices) {
    await prisma.device.create({
      data: deviceData,
    });
    console.log(`  ✓ Created ${deviceData.deviceId}`);
  }

  // ========== CREATE TEST SESSION ==========
  console.log('🎓 Creating test sessions...');
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const session1 = await prisma.session.create({
    data: {
      courseId: createdCourses[0].id,
      sessionStartTime: now,
      sessionStatus: 'ACTIVE',
    },
  });

  const session2 = await prisma.session.create({
    data: {
      courseId: createdCourses[1].id,
      sessionStartTime: yesterday,
      sessionEndTime: new Date(yesterday.getTime() + 60 * 60 * 1000),
      sessionStatus: 'ENDED',
    },
  });

  console.log('  ✓ Created test sessions');

  // ========== CREATE ATTENDANCE SESSIONS ==========
  console.log('✅ Creating attendance sessions...');
  await prisma.attendanceSession.create({
    data: {
      sessionId: session1.id,
      studentId: studentUsers[0].student.id,
      deviceId: (await prisma.device.findFirst({ where: { studentId: studentUsers[0].student.id } })).id,
      sessionStartTime: now,
      totalDurationSeconds: 0,
      sessionStatus: 'ACTIVE',
    },
  });

  console.log('  ✓ Created attendance sessions');

  console.log('✨ Seed completed successfully!\n');
  console.log('📋 Test Credentials:');
  console.log('   Student: student1@campusync.com / student123');
  console.log('   Professor: prof1@campusync.com / prof123');
  console.log('   Admin: admin@campusync.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
