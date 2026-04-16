const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find a student
    const student = await prisma.student.findFirst({ include: { user: true } });
    if (!student) {
      console.log('❌ No students found!');
      process.exit(1);
    }

    const macAddress = '00:70:07:25:B6:88';
    
    // Check if device already exists
    let device = await prisma.device.findFirst({ where: { macAddress } });
    
    if (device) {
      // Update existing device
      device = await prisma.device.update({
        where: { id: device.id },
        data: { studentId: student.id, status: 'ACTIVE' },
      });
      console.log(`✅ Updated device: ${macAddress} → ${student.user.email}`);
    } else {
      // Create new device
      device = await prisma.device.create({
        data: {
          macAddress,
          deviceName: 'Real Biometric Device',
          studentId: student.id,
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Created device: ${macAddress} → ${student.user.email}`);
    }

    console.log(`   Device ID: ${device.id}`);
    console.log(`   Student: ${student.user.email}`);
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
