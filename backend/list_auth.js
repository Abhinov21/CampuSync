const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({ where: { role: 'PROFESSOR' } });
    console.log('Professors:', users.map(u => u.email));

    const courses = await prisma.course.findMany({ include: { professor: { include: { user: true } } } });
    console.log('\nCourses:');
    for (const c of courses) {
      console.log(`- ${c.code}: ${c.name} → Prof: ${c.professor?.user?.email || 'N/A'}`);
    }
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();
