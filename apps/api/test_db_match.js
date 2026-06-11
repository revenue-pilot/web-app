const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.lkelayolzgqypckwhqxm:90J%2A%28%5Et%7Bg%26lx4%7Bg%2AS9%2C4evJYm@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
    }
  }
});

async function test() {
  const email = `test_razorpay_direct_${Date.now()}@example.com`;
  const password = 'Password123!';
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);

  const org = await prisma.organization.create({
    data: { name: 'Razorpay Test Org' }
  });

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Razorpay',
      lastName: 'Tester',
      isEmailVerified: true,
      role: 'ADMIN',
      organizationId: org.id
    }
  });

  console.log('User created directly in Pooler DB');

  try {
    const res = await axios.post('https://api.revenuepilot.in/api/auth/login', { email, password });
    console.log('Login Success on Prod API:', res.status);
    console.log('Token:', res.data.access_token);
  } catch (e) {
    console.error('Login Failed on Prod API:', e.response ? e.response.status : e.message);
  }

  await prisma.$disconnect();
}

test();
