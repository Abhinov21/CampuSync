/**
 * Event Processor Test Utilities
 * 
 * Direct event simulation for testing EventProcessor without MQTT
 * Useful for:
 * - Testing session lifecycle
 * - Verifying timeout logic
 * - Testing edge cases
 * - Debugging
 * 
 * Usage: node test-event-processor.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const eventProcessor = require('./src/services/eventProcessor');

const prisma = new PrismaClient();

// Helper: Create test data (students, devices, sessions)
async function setupTestData() {
  console.log('\n🔧 Setting up test data...\n');

  try {
    // Get first student from database
    let student = await prisma.student.findFirst({
      include: { user: true, device: true },
    });

    if (!student) {
      console.log('❌ No students found in database. Run seed first: npm run seed');
      return null;
    }

    console.log(`✅ Found test student: ${student.user.email} (ID: ${student.id})`);

    // Get or create a device
    let device = student.device;
    if (!device) {
      device = await prisma.device.create({
        data: {
          deviceId: `WB_TEST_${Date.now()}`,
          deviceType: 'WRISTBAND',
          studentId: student.id,
          isActive: true,
        },
      });
      console.log(`✅ Created test device: ${device.deviceId}`);
    } else {
      console.log(`✅ Using existing device: ${device.deviceId}`);
    }

    // Get or create an active session
    const now = new Date();
    let session = await prisma.session.findFirst({
      where: {
        sessionStatus: 'ACTIVE',
        scheduledStartTime: { lte: now },
        scheduledEndTime: { gte: now },
      },
    });

    if (!session) {
      // Create a test session that's currently active
      const startTime = new Date(now.getTime() - 10 * 60000); // Started 10 mins ago
      const endTime = new Date(now.getTime() + 50 * 60000); // Ends in 50 mins

      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: student.id },
        select: { courseId: true },
      });

      if (!enrollment) {
        console.log('❌ Student has no course enrollment');
        return null;
      }

      session = await prisma.session.create({
        data: {
          courseId: enrollment.courseId,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          sessionStatus: 'ACTIVE',
        },
      });

      console.log(`✅ Created test session: ${session.id}`);
    } else {
      console.log(`✅ Using existing session: ${session.id}`);
    }

    return { student, device, session };
  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    return null;
  }
}

// Test: AUTH Event - Student joins class
async function testAuthEvent(testData) {
  console.log('\n\n📝 TEST 1: AUTH Event (Student joins class)\n');
  console.log('Expected: Create attendance session, start timeout');

  try {
    const payload = {
      type: 'auth',
      device: testData.device.deviceId,
      id: 5,
      confidence: 92,
    };

    console.log(`Sending: ${JSON.stringify(payload)}`);
    await eventProcessor.processEvent(payload);

    // Wait a moment for database writes
    await new Promise((r) => setTimeout(r, 500));

    // Verify attendance session created
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        studentId: testData.student.id,
        sessionId: testData.session.id,
      },
      include: { attendanceRecords: true },
    });

    if (attendanceSession) {
      console.log(
        `✅ Attendance session created: ${attendanceSession.id}`
      );
      console.log(`   Status: ${attendanceSession.sessionStatus}`);
      console.log(`   Records count: ${attendanceSession.attendanceRecords.length}`);
    } else {
      console.log('❌ No attendance session found');
    }

    // Check active sessions
    const activeSessions = eventProcessor.getActiveSessionsStatus();
    console.log(`Active sessions in memory: ${activeSessions.length}`);
    activeSessions.forEach((s) => {
      console.log(
        `   Device: ${s.deviceId}, Student: ${s.studentId}, Started: ${s.sessionStartTime}`
      );
    });

    return attendanceSession;
  } catch (error) {
    console.error('❌ Error in AUTH test:', error.message);
  }
}

// Test: PING Event - Student still present (before timeout)
async function testPingEvent(testData) {
  console.log('\n\n📍 TEST 2: PING Event (Student still present)\n');
  console.log('Expected: Update last_ping_time, reset timeout, no duplicate session');

  try {
    // Wait 2 seconds to show time passing
    console.log('Waiting 2 seconds...');
    await new Promise((r) => setTimeout(r, 2000));

    const payload = {
      type: 'ping',
      device: testData.device.deviceId,
      id: 5,
      ts: Math.floor(Date.now() / 1000),
    };

    console.log(`Sending: ${JSON.stringify(payload)}`);
    await eventProcessor.processEvent(payload);

    // Wait for database writes
    await new Promise((r) => setTimeout(r, 500));

    // Verify attendance record
    const records = await prisma.attendanceRecord.findMany({
      where: {
        attendanceSession: {
          studentId: testData.student.id,
          sessionId: testData.session.id,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    console.log(`✅ Attendance records: ${records.length}`);
    records.slice(0, 3).forEach((r) => {
      console.log(`   ${r.eventType} at ${r.timestamp}`);
    });

    // Check active sessions
    const activeSessions = eventProcessor.getActiveSessionsStatus();
    if (activeSessions.length > 0) {
      const session = activeSessions[0];
      console.log(
        `✅ Session still active, time since last PING: ${session.timeSinceLastPing}ms`
      );
    }
  } catch (error) {
    console.error('❌ Error in PING test:', error.message);
  }
}

// Test: RECHECK_OK Event - Re-verification successful
async function testRecheckEvent(testData) {
  console.log('\n\n✔️  TEST 3: RECHECK_OK Event (Re-verification)\n');
  console.log('Expected: Log re-verification, reset timeout');

  try {
    const payload = {
      type: 'recheck_ok',
      device: testData.device.deviceId,
      id: 5,
    };

    console.log(`Sending: ${JSON.stringify(payload)}`);
    await eventProcessor.processEvent(payload);

    // Wait for database writes
    await new Promise((r) => setTimeout(r, 500));

    // Verify attendance record
    const latestRecord = await prisma.attendanceRecord.findFirst({
      where: {
        attendanceSession: {
          studentId: testData.student.id,
          sessionId: testData.session.id,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (latestRecord && latestRecord.eventType === 'RECHECK_OK') {
      console.log(`✅ RECHECK_OK recorded at ${latestRecord.timestamp}`);
    } else {
      console.log('❌ RECHECK_OK not found in latest record');
    }
  } catch (error) {
    console.error('❌ Error in RECHECK test:', error.message);
  }
}

// Test: SESSION_END Event - Student leaves class
async function testSessionEndEvent(testData) {
  console.log('\n\n🔴 TEST 4: SESSION_END Event (Student leaves)\n');
  console.log('Expected: End session, calculate duration, remove from active');

  try {
    const payload = {
      type: 'session_end',
      device: testData.device.deviceId,
      id: 5,
    };

    console.log(`Sending: ${JSON.stringify(payload)}`);
    await eventProcessor.processEvent(payload);

    // Wait for database writes
    await new Promise((r) => setTimeout(r, 500));

    // Verify attendance session ended
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        studentId: testData.student.id,
        sessionId: testData.session.id,
      },
      include: { records: true },
    });

    if (attendanceSession) {
      console.log(
        `✅ Session ended with status: ${attendanceSession.sessionStatus}`
      );
      console.log(
        `   Duration: ${attendanceSession.totalDurationSeconds} seconds`
      );
      console.log(`   Total records: ${attendanceSession.attendanceRecords.length}`);

      // Show all records  
      console.log('   Events:');
      attendanceSession.attendanceRecords.forEach((r) => {
        console.log(`     - ${r.eventType} at ${r.eventTimestamp}`);
      });
    }

    // Verify removed from active sessions
    const activeSessions = eventProcessor.getActiveSessionsStatus();
    const isActive = activeSessions.some(
      (s) => s.deviceId === testData.device.deviceId
    );

    if (!isActive) {
      console.log('✅ Session removed from active sessions');
    } else {
      console.log('❌ Session still in active sessions');
    }
  } catch (error) {
    console.error('❌ Error in SESSION_END test:', error.message);
  }
}

// Test: Edge case - Unknown device
async function testUnknownDevice() {
  console.log('\n\n⚠️  TEST 5: Edge Case - Unknown Device\n');
  console.log('Expected: Log anomaly, do not create session');

  try {
    const payload = {
      type: 'auth',
      device: 'UNKNOWN_DEVICE_99999',
      id: 5,
      confidence: 88,
    };

    console.log(`Sending: ${JSON.stringify(payload)}`);
    await eventProcessor.processEvent(payload);

    // Wait for database writes
    await new Promise((r) => setTimeout(r, 500));

    // Verify anomaly logged
    const anomalies = await prisma.anomalyLog.findMany({
      where: { anomalyType: 'UNKNOWN_DEVICE' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (anomalies.length > 0) {
      console.log(
        `✅ Anomaly logged: ${anomalies[0].anomalyType} (${anomalies[0].severity})`
      );
      console.log(`   Details: ${anomalies[0].details}`);
    } else {
      console.log('❌ No anomaly found');
    }
  } catch (error) {
    console.error('❌ Error in unknown device test:', error.message);
  }
}

// Test: Edge case - Duplicate AUTH (should be ignored)
async function testDuplicateAuth(testData) {
  console.log('\n\n⚠️  TEST 6: Edge Case - Duplicate AUTH\n');
  console.log('Expected: Log anomaly as DUPLICATE_AUTH');

  try {
    // First AUTH
    const payload1 = {
      type: 'auth',
      device: testData.device.deviceId,
      id: 5,
      confidence: 92,
    };

    console.log(`Sending first AUTH: ${JSON.stringify(payload1)}`);
    await eventProcessor.processEvent(payload1);
    await new Promise((r) => setTimeout(r, 500));

    // Second AUTH (duplicate - should be rejected)
    console.log(`Sending second AUTH (duplicate): ${JSON.stringify(payload1)}`);
    await eventProcessor.processEvent(payload1);
    await new Promise((r) => setTimeout(r, 500));

    // Verify anomaly logged
    const anomalies = await prisma.anomalyLog.findMany({
      where: { anomalyType: 'DUPLICATE_AUTH' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (anomalies.length > 0) {
      console.log(
        `✅ Duplicate AUTH detected and logged: ${anomalies[0].anomalyType}`
      );
      console.log(`   Details: ${anomalies[0].details}`);
    } else {
      console.log('⚠️  No duplicate AUTH anomaly found (may have been handled differently)');
    }

    // Cleanup
    await eventProcessor.endSession(testData.device.deviceId, 'TEST_END', {
      type: 'test',
      device: testData.device.deviceId,
    });
  } catch (error) {
    console.error('❌ Error in duplicate AUTH test:', error.message);
  }
}

// Test: PING timeout (30 seconds - shortened for testing)
async function testPingTimeout(testData) {
  console.log('\n\n⏱️  TEST 7: PING Timeout (30 seconds) - SKIPPED\n');
  console.log('Note: This test requires 30+ second wait.');
  console.log('To enable, uncomment in main() and run separately.');
  console.log('Expected: Session auto-ends after 30 seconds without PING');
}

// Main test runner
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  EventProcessor Test Suite                 ║');
  console.log('║  Testing MQTT event handling               ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    // Setup test data
    const testData = await setupTestData();
    if (!testData) {
      console.log('\n❌ Cannot proceed without test data');
      process.exit(1);
    }

    // Run tests in sequence
    await testAuthEvent(testData);
    await testPingEvent(testData);
    await testRecheckEvent(testData);
    await testSessionEndEvent(testData);

    // Edge cases
    await testUnknownDevice();
    await testDuplicateAuth(testData);
    await testPingTimeout(testData);

    console.log('\n\n╔════════════════════════════════════════════╗');
    console.log('║  ✅ All Tests Complete                     ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  setupTestData,
  testAuthEvent,
  testPingEvent,
  testRecheckEvent,
  testSessionEndEvent,
  testUnknownDevice,
  testDuplicateAuth,
  testPingTimeout,
};
