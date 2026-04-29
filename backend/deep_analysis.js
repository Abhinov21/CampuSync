const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== DEEP SESSION ANALYSIS ===\n');

    // Check ALL Sessions in the database
    console.log('=== ALL SESSIONS IN DATABASE ===\n');
    const allSessions = await prisma.session.findMany({
      include: { course: { select: { name: true } } },
      orderBy: { scheduledStartTime: 'desc' }
    });

    console.log(`Total sessions: ${allSessions.length}`);
    allSessions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.course.name}`);
      console.log(`   Status: ${s.sessionStatus}`);
      console.log(`   Scheduled: ${s.scheduledStartTime}`);
      console.log(`   ActualStart: ${s.actualStartTime}`);
      console.log(`   ActualEnd: ${s.actualEndTime}`);
      console.log('');
    });

    // Get the most recent session
    const latestSession = allSessions[0];
    console.log('=== LATEST SESSION DETAILS ===\n');
    console.log(`Course: ${latestSession.course.name}`);
    console.log(`Status: ${latestSession.sessionStatus}`);
    console.log(`Scheduled Start: ${latestSession.scheduledStartTime}`);
    console.log(`Scheduled End: ${latestSession.scheduledEndTime}`);
    console.log(`Session ID: ${latestSession.id}`);

    // Get attendance for this session
    if (latestSession) {
      console.log('\n=== ATTENDANCE FOR LATEST SESSION ===\n');
      const attendances = await prisma.attendanceSession.findMany({
        where: { sessionId: latestSession.id },
        include: { student: { select: { name: true } } }
      });

      console.log(`Total attendance records: ${attendances.length}`);
      attendances.forEach((a, i) => {
        console.log(`${i + 1}. ${a.student.name}`);
        console.log(`   Status: ${a.sessionStatus}`);
        console.log(`   Duration: ${a.totalDurationSeconds}s`);
        console.log(`   Created: ${a.createdAt}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
