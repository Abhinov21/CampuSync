const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== ANALYZING RECENT SESSIONS ===\n');

    // Get the student record
    const user = await prisma.user.findFirst({
      where: { email: 'student1@campusync.com' }
    });

    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    });

    console.log('Student ID:', student.id);
    console.log('Student Email:', user.email);

    // Check all attendance sessions
    const allRecords = await prisma.attendanceSession.findMany({
      where: { studentId: student.id },
      include: {
        session: {
          select: {
            id: true,
            scheduledStartTime: true,
            scheduledEndTime: true,
            actualStartTime: true,
            actualEndTime: true,
            course: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\nTotal AttendanceSession Records:', allRecords.length);
    console.log('\n=== DETAILED BREAKDOWN ===\n');

    allRecords.forEach((record, i) => {
      const sessionDuration = Math.floor(
        (new Date(record.session.scheduledEndTime) - new Date(record.session.scheduledStartTime)) / 1000
      );
      const threshold = Math.ceil(sessionDuration * 0.65);
      const isAttended = record.totalDurationSeconds >= threshold;

      console.log(`Record ${i + 1}:`);
      console.log(`  Course: ${record.session.course.name}`);
      console.log(`  Status: ${record.sessionStatus}`);
      console.log(`  Duration: ${record.totalDurationSeconds}s / ${sessionDuration}s`);
      console.log(`  Threshold: ${threshold}s`);
      console.log(`  Attended: ${isAttended ? 'YES' : 'NO'}`);
      console.log(`  Session Start: ${record.session.scheduledStartTime}`);
      console.log(`  Created At: ${record.createdAt}`);
      console.log('');
    });

    // Check Session table for ACTIVE sessions
    console.log('=== ACTIVE SESSIONS IN DATABASE ===\n');
    const activeSessions = await prisma.session.findMany({
      where: { sessionStatus: 'ACTIVE' },
      include: { course: { select: { name: true } } }
    });

    console.log('Total ACTIVE sessions:', activeSessions.length);
    activeSessions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.course.name} - Start: ${s.scheduledStartTime}`);
    });

    // Check ENDED sessions
    console.log('\n=== ENDED SESSIONS IN DATABASE ===\n');
    const endedSessions = await prisma.session.findMany({
      where: { sessionStatus: 'ENDED' },
      include: { course: { select: { name: true } } },
      orderBy: { scheduledEndTime: 'desc' },
      take: 10
    });

    console.log('Total ENDED sessions (showing last 10):', endedSessions.length);
    endedSessions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.course.name} - Start: ${s.scheduledStartTime}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
