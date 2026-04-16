const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Checking database setup...\n');
    
    // Get a student
    const student = await prisma.student.findFirst({ include: { user: true } });
    console.log(`✅ Found student: ${student.user.email}`);
    
    // Register device
    const macAddress = '00:70:07:25:B6:88';
    let device = await prisma.device.findFirst({ where: { macAddress } });
    
    if (device) {
      device = await prisma.device.update({
        where: { id: device.id },
        data: { studentId: student.id, status: 'ACTIVE' },
      });
      console.log(`✅ Updated device MAC ${macAddress}`);
    } else {
      device = await prisma.device.create({
        data: {
          macAddress,
          deviceName: 'Real Biometric Wristband',
          deviceType: 'WRISTBAND',
          studentId: student.id,
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Created device MAC ${macAddress}`);
    }
    
    // Get course with enrollments
    const course = await prisma.course.findFirst({ 
      include: { 
        professor: { include: { user: true } },
        _count: { select: { enrollments: true } }
      } 
    });
    
    console.log(`✅ Found course: ${course.name} (${course._count.enrollments} students enrolled)`);
    console.log(`   Taught by: ${course.professor.user.email}`);
    
    // Check that our student is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, courseId: course.id }
    });
    
    if (enrollment) {
      console.log(`✅ Student IS enrolled in this course`);
    } else {
      console.log(`⚠️  Student NOT enrolled in this course`);
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Device: ${macAddress}`);
    console.log(`   Student: ${student.user.email}`);
    console.log(`   Course: ${course.name}`);
    console.log(`   Enrollment: ${enrollment ? 'YES' : 'NO'}`);
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
