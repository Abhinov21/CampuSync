const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const professors = await prisma.professor.findMany({
    include: {
      user: true,
      courses: true
    }
  });

  console.log('\n=== PROFESSORS & THEIR COURSES ===\n');
  
  for (const prof of professors) {
    console.log(`📚 Professor: ${prof.user.email}`);
    console.log(`   Courses (${prof.courses.length}):`);
    for (const course of prof.courses) {
      console.log(`   - ${course.code}: ${course.name} (ID: ${course.id})`);
    }
    console.log();
  }

  await prisma.$disconnect();
}

main().catch(console.error);
