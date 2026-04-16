const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log('\n=== CHECKING DATABASE ===\n');

    // Get all users
    const users = await prisma.user.findMany();
    console.log(`\n📌 Total Users: ${users.length}`);
    for (const u of users) {
      console.log(`   ${u.email} (${u.role})`);
    }

    // Get all professors
    const professors = await prisma.professor.findMany({
      include: { User: true }
    });
    console.log(`\n👨‍🏫 Total Professors: ${professors.length}`);
    for (const p of professors) {
      console.log(`   ${p.User?.email} -> Prof ID: ${p.id}`);
    }

    // Get all courses
    const courses = await prisma.course.findMany({
      include: { Professor: true }
    });
    console.log(`\n📚 Total Courses: ${courses.length}`);
    for (const c of courses) {
      console.log(`   ${c.name} (${c.id})`);
      console.log(`      Prof ID: ${c.professorId}`);
      console.log(`      Prof Name: ${c.Professor?.name || 'NULL'}`);
    }

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany();
    console.log(`\n❎ Total Enrollments: ${enrollments.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

check();
