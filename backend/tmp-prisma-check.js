const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('CONNECTED');
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
