const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find the student with this email
    const student = await prisma.user.findFirst({
      where: { email: 'student1@campusync.com' }
    });
    
    if (!student) {
      console.log('Student not found');
      return;
    }

    console.log('Student ID:', student.id);
    console.log('Email:', student.email);

    // Now check attendance records for this student
    const records = await prisma.attendanceSession.findMany({
      where: {
        studentId: student.id
      },
      include: {
        session: {
          select: {
            id: true,
            scheduledStartTime: true,
            scheduledEndTime: true,
            course: { select: { id: true, name: true } }
          }
        }
      }
    });

    console.log('\nTotal AttendanceSession records:', records.length);
    
    const grouped = {};
    records.forEach(r => {
      const courseId = r.session.course.id;
      if (!grouped[courseId]) grouped[courseId] = [];
      grouped[courseId].push(r);
    });

    Object.entries(grouped).forEach(([courseId, recs]) => {
      console.log(`\n${recs[0].session.course.name} (ID: ${courseId}): ${recs.length} records`);
      recs.forEach((r, i) => {
        const sessionDuration = Math.floor((r.session.scheduledEndTime - r.session.scheduledStartTime) / 1000);
        const threshold = Math.ceil(sessionDuration * 0.65);
        const isAttended = r.totalDurationSeconds >= threshold;
        console.log(`  ${i+1}. ${r.totalDurationSeconds}s / ${sessionDuration}s (threshold: ${threshold}s) = ${isAttended ? 'PRESENT' : 'ABSENT'}`);
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
