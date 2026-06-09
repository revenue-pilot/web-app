const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api';

const reportData = [];
let accessToken = '';
let currentOrgId = '';
let currentLeadId = '';
let currentDealId = '';

function mask(str) {
  if (!str) return str;
  if (str.length < 10) return '***';
  return str.substring(0, 4) + '...' + str.substring(str.length - 4);
}

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
    console.log(`✅ ${result.status || 'PASS'}: ${phaseName}`);
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
  console.log("Connected to Database.");

  // PHASE 1 & 2
  const rawRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });
  const resData = await rawRes.json();
  
  const rawLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
  });
  const loginData = await rawLogin.json();
  accessToken = loginData.access_token;
  
  const userRow = await prisma.user.findUnique({ where: { email: TEST_USER.email } });
  currentOrgId = userRow.organizationId;
  
  console.log("Setup complete, user and org created.");

  // PHASE 3: USER PROFILE
  await logPhase('PHASE 3: USER PROFILE', async () => {
    const raw = await fetch(`${BASE_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profile = await raw.json();
    return {
      endpoint: 'GET /api/users/profile',
      responseStatus: raw.status,
      responseBody: profile,
      status: (raw.status === 200 && profile.email === TEST_USER.email) ? 'PASS' : 'FAIL'
    };
  });

  // PHASE 4: ORGANIZATION (Usually handled in signup, let's test if we can update or view it)
  await logPhase('PHASE 4: ORGANIZATION', async () => {
    const org = await prisma.organization.findUnique({ where: { id: currentOrgId } });
    return {
      endpoint: 'POST /api/auth/signup (Implicit Org Creation)',
      dbRowsCreated: { organization: org },
      status: org ? 'PASS' : 'FAIL'
    };
  });

  // PHASE 5: CRM LEAD CREATION
  await logPhase('PHASE 5: CRM LEAD CREATION', async () => {
    const raw = await fetch(`${BASE_URL}/crm/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Lead',
        email: 'testlead@test.com',
        source: 'AUDIT',
        status: 'NEW'
      })
    });
    const leadRes = await raw.json();
    currentLeadId = leadRes.id || (await prisma.lead.findFirst({ where: { organizationId: currentOrgId } }))?.id;

    return {
      endpoint: 'POST /api/crm/leads',
      responseStatus: raw.status,
      responseBody: leadRes,
      status: currentLeadId ? 'PASS' : 'FAIL'
    };
  });

  // PHASE 6: CRM DEAL CREATION
  await logPhase('PHASE 6: CRM DEAL CREATION', async () => {
    const raw = await fetch(`${BASE_URL}/crm/deals`, { // Assuming path
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        title: 'Audit Deal',
        value: 5000,
        stage: 'PROSPECT',
        leadId: currentLeadId
      })
    });
    const dealRes = await raw.json();
    currentDealId = dealRes.id || (await prisma.deal.findFirst({ where: { organizationId: currentOrgId } }))?.id;

    return {
      endpoint: 'POST /api/crm/deals',
      responseStatus: raw.status,
      responseBody: dealRes,
      status: raw.status === 201 || currentDealId ? 'PASS' : 'FAIL'
    };
  });

  fs.writeFileSync(path.join(__dirname, 'audit_results_2.json'), JSON.stringify(reportData, null, 2));
  console.log("\nSaved Phase 3-6 to audit_results_2.json");
  await prisma.$disconnect();
}

runAudit();
