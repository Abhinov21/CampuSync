const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestSessions() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Get counts before deletion
    const sessionsBefore = await prisma.session.count();
    const attendanceSessionsBefore = await prisma.attendanceSession.count();
    const attendanceRecordsBefore = await prisma.attendanceRecord.count();
    const mqttLogsBefore = await prisma.mQTTEventLog.count();

    console.log('📊 Before cleanup:');
    console.log(`   Sessions: ${sessionsBefore}`);
    console.log(`   Attendance Sessions: ${attendanceSessionsBefore}`);
    console.log(`   Attendance Records: ${attendanceRecordsBefore}`);
    console.log(`   MQTT Event Logs: ${mqttLogsBefore}\n`);

    console.log('🗑️  Deleting records...');

    // Delete in order of dependencies (children first)
    // 1. AttendanceRecord (no foreign keys pointing here)
    const deletedRecords = await prisma.attendanceRecord.deleteMany({});
    console.log(`   ✅ Deleted ${deletedRecords.count} attendance records`);

    // 2. AttendanceSession (depends on Session, Student, Device)
    const deletedSessions = await prisma.attendanceSession.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSessions.count} attendance sessions`);

    // 3. Session (depends on Course)
    const deletedScheduledSessions = await prisma.session.deleteMany({});
    console.log(`   ✅ Deleted ${deletedScheduledSessions.count} scheduled sessions`);

    // 4. MQTT Event Logs (depends on Device)
    const deletedLogs = await prisma.mQTTEventLog.deleteMany({});
    console.log(`   ✅ Deleted ${deletedLogs.count} MQTT event logs\n`);

    // Get counts after deletion
    const sessionsAfter = await prisma.session.count();
    const attendanceSessionsAfter = await prisma.attendanceSession.count();
    const attendanceRecordsAfter = await prisma.attendanceRecord.count();
    const mqttLogsAfter = await prisma.mQTTEventLog.count();

    // Get structure info (should remain unchanged)
    const courses = await prisma.course.count();
    const enrollments = await prisma.enrollment.count();
    const devices = await prisma.device.count();
    const users = await prisma.user.count();

    console.log('✨ After cleanup:');
    console.log(`   Sessions: ${sessionsAfter}`);
    console.log(`   Attendance Sessions: ${attendanceSessionsAfter}`);
    console.log(`   Attendance Records: ${attendanceRecordsAfter}`);
    console.log(`   MQTT Event Logs: ${mqttLogsAfter}\n`);

    console.log('📋 Database Structure (unchanged):');
    console.log(`   Courses: ${courses}`);
    console.log(`   Enrollments: ${enrollments}`);
    console.log(`   Devices: ${devices}`);
    console.log(`   Users: ${users}\n`);

    console.log('✅ Database cleanup complete!');
    console.log('🎉 Ready for fresh session testing!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestSessions();
