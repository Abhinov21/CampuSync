const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const devices = await prisma.device.findMany();
    const activeSessions = await prisma.session.findMany({ where: { status: 'ACTIVE' } });
    const enrollments = await prisma.enrollment.findMany();
    
    console.log(`Devices: ${devices.length}`);
    console.log(`Active Sessions: ${activeSessions.length}`);  
    console.log(`Enrollments: ${enrollments.length}`);
    
    const mac = '00:70:07:25:B6:88';
    const device = devices.find(d => d.macAddress === mac);
    console.log(`\nDevice ${mac}: ${device ? 'FOUND' : 'NOT FOUND'}`);
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
