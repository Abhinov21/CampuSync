const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findMany().then(users => {
  console.log('Users:', users.map(u => `${u.email}(${u.role})`));
  return prisma.$disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
