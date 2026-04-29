const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find student1's user and student record
    const user = await prisma.user.findFirst({
      where: { email: 'student1@campusync.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    });

    console.log('User ID:', user.id);
    console.log('Student ID:', student?.id);

    if (student) {
      // Now check attendance records
      const records = await prisma.attendanceSession.findMany({
        where: { studentId: student.id },
        include: {
          session: { select: { course: { select: { name: true } } } }
        }
      });
      console.log('Attendance records for this student:', records.length);
      records.forEach((r, i) => {
        console.log(`  ${i+1}. ${r.session.course.name} - ${r.totalDurationSeconds}s`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
