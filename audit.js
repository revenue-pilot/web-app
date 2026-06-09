const fs = require('fs');
const path = require('path');
// Import Prisma from the local repo
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api';
let accessToken = '';
let reportData = [];

// Helper to mask secrets
function mask(str) {
  if (!str) return str;
  if (str.length < 10) return '***';
  return str.substring(0, 4) + '...' + str.substring(str.length - 4);
}

// Generate random suffix to avoid unique constraint errors
const uid = Date.now().toString().slice(-6);
const TEST_USER = {
  email: `audit_user_${uid}@test.com`,
  password: 'TestPassword123!',
  name: `Audit User ${uid}`
};

async function logPhase(phaseName, executeFn) {
  console.log(`\n==================================================`);
  console.log(`Executing ${phaseName}...`);
  try {
    const result = await executeFn();
    reportData.push({
      phase: phaseName,
      status: result.status || 'PASS',
      details: result
    });
    console.log(`✅ PASS: ${phaseName}`);
  } catch (err) {
    reportData.push({
      phase: phaseName,
      status: 'FAIL',
      error: err.message,
      stack: err.stack
    });
    console.log(`❌ FAIL: ${phaseName} - ${err.message}`);
  }
}

async function runAudit() {
  await prisma.$connect();
  console.log("Connected to Database. Starting Audit...");

  // Phase 1: User Registration
  await logPhase('PHASE 1: USER REGISTRATION', async () => {
    const rawRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    const resData = await rawRes.json();
    
    const userRow = await prisma.user.findUnique({ where: { email: TEST_USER.email } });
    const orgRow = userRow ? await prisma.organization.findUnique({ where: { id: userRow.organizationId } }) : null;
    const subRow = orgRow ? await prisma.subscription.findFirst({ where: { organizationId: orgRow.id } }) : null;
    const auditRow = orgRow ? await prisma.auditLog.findFirst({ where: { organizationId: orgRow.id } }) : null;

    return {
      endpoint: 'POST /api/auth/signup',
      request: { ...TEST_USER, password: mask(TEST_USER.password) },
      responseStatus: rawRes.status,
      responseBody: { ...resData, access_token: mask(resData.access_token) },
      dbRowsCreated: {
        user: userRow ? { id: userRow.id, email: userRow.email } : null,
        organization: orgRow ? { id: orgRow.id, name: orgRow.name } : null,
        subscription: subRow ? { id: subRow.id, tier: subRow.tier } : null,
        auditLog: auditRow ? { id: auditRow.id, action: auditRow.action } : null,
      },
      status: (rawRes.status === 201 || rawRes.status === 200) && userRow && orgRow ? 'PASS' : 'FAIL'
    };
  });

  // Phase 2: Login
  await logPhase('PHASE 2: LOGIN', async () => {
    const rawRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });
    const resData = await rawRes.json();

    accessToken = resData.access_token;
    
    // Decode JWT roughly
    let decodedJwt = null;
    if (accessToken) {
      try {
        const payload = accessToken.split('.')[1];
        decodedJwt = JSON.parse(Buffer.from(payload, 'base64').toString());
      } catch (e) {}
    }

    return {
      endpoint: 'POST /api/auth/login',
      request: { email: TEST_USER.email, password: mask(TEST_USER.password) },
      responseStatus: rawRes.status,
      responseBody: { ...resData, access_token: mask(resData.access_token) },
      decodedJwt: decodedJwt ? { ...decodedJwt, sub: mask(decodedJwt.sub) } : null,
      status: (rawRes.status === 200 && accessToken) ? 'PASS' : 'FAIL'
    };
  });

  // Export results to JSON
  fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(reportData, null, 2));
  console.log("\nAudit script completed. Results saved to audit_results.json");
  await prisma.$disconnect();
}

runAudit();
