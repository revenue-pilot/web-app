const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.lkelayolzgqypckwhqxm:90J%2A%28%5Et%7Bg%26lx4%7Bg%2AS9%2C4evJYm@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
    }
  }
});
prisma.$connect()
  .then(() => {
    console.log('Prisma connected to Pooler!');
    return prisma.user.findFirst();
  })
  .then(user => {
    console.log('Found user:', user ? user.email : 'None');
    prisma.$disconnect();
  })
  .catch(e => {
    console.error('Error:', e.message);
    prisma.$disconnect();
  });
