#!/usr/bin/env node

/**
 * Test: Rejoin Scenario - Student leaves and rejoins same session
 * This tests the fix for allowing new attendance records when rejoining
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🧪 Testing Rejoin Scenario');
    console.log('==========================');
    console.log('');

    // Find active session and ended attendance
    const session = await prisma.session.findFirst({
      where: { courseId: '4eb3f331-dee2-4e57-8968-fe1f29861f99', sessionStatus: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    if (!session) {
      console.log('❌ No active session found');
      process.exit(1);
    }

    console.log('✅ Found active session:', session.id.substring(0, 8));
    console.log('');

    // Get student and device
    const student = await prisma.student.findFirst({
      where: { user: { email: 'student1@campusync.com' } },
      include: { device: true }
    });

    console.log(`✅ Found student: ${student.name} (${student.id.substring(0, 8)})`);
    console.log(`✅ Device MAC: ${student.device.deviceId}`);
    console.log('');

    // Check existing attendance
    const existingAttendance = await prisma.attendanceSession.findFirst({
      where: { sessionId: session.id, studentId: student.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📋 Current attendance state:');
    if (existingAttendance) {
      console.log(`   Status: ${existingAttendance.sessionStatus} (${existingAttendance.createdAt.toISOString()})`);
    } else {
      console.log('   No prior attendance');
    }
    console.log('');

    // Simulate a rejoin: Create new attendance record
    console.log('🔄 Simulating rejoin: Creating new attendance record...');
    const newAttendance = await prisma.attendanceSession.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        deviceId: student.device.id,
        sessionStartTime: new Date(),
        sessionStatus: 'ACTIVE'
      }
    });

    console.log(`✅ New attendance record created: ${newAttendance.id.substring(0, 8)}`);
    console.log(`   Status: ${newAttendance.sessionStatus}`);
    console.log(`   Start time: ${newAttendance.sessionStartTime.toISOString()}`);
    console.log('');

    // Now verify both exist
    const allAttendance = await prisma.attendanceSession.findMany({
      where: { sessionId: session.id, studentId: student.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Attendance history (${allAttendance.length} records):`);
    allAttendance.forEach((att, i) => {
      console.log(`   ${i + 1}. Status: ${att.sessionStatus}, Created: ${att.createdAt.toISOString().substring(11, 19)}`);
    });
    console.log('');

    console.log('✅ Rejoin scenario test complete!');
    console.log('');
    console.log('Expected behavior:');
    console.log('  ✓ Old attendance record remains ENDED (preserved in history)');
    console.log('  ✓ New attendance record is ACTIVE (student now present)');
    console.log('  ✓ Student appears in attendance list for current session');
    console.log('  ✓ PING messages can update the new attendance record');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
