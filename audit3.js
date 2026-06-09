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
let currentRuleId = '';
let currentReportId = '';

function mask(str) {
  if (!str) return str;
  if (str.length < 10) return '***';
  return str.substring(0, 4) + '...' + str.substring(str.length - 4);
}

const uid = Date.now().toString().slice(-6);
const TEST_USER = {
  email: `audit3_${uid}@test.com`,
  password: 'TestPassword123!',
  name: `Audit Three ${uid}`
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
  
  // 1. AUTH
  await logPhase('AUTH: Signup', async () => {
    const rawRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    const resData = await rawRes.json();
    return { endpoint: '/api/auth/signup', request: mask(TEST_USER.password), responseStatus: rawRes.status, body: resData, status: rawRes.status === 201 ? 'PASS' : 'FAIL' };
  });

  await logPhase('AUTH: Login', async () => {
    const rawRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });
    const resData = await rawRes.json();
    accessToken = resData.access_token;
    return { endpoint: '/api/auth/login', responseStatus: rawRes.status, body: { access_token: mask(resData.access_token) }, status: rawRes.status === 200 ? 'PASS' : 'FAIL' };
  });

  await logPhase('AUTH: Profile (Protected)', async () => {
    const rawRes = await fetch(`${BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profile = await rawRes.json();
    return { endpoint: '/api/user/profile', responseStatus: rawRes.status, body: profile, status: rawRes.status === 200 ? 'PASS' : 'FAIL' };
  });

  // 2. CRM
  await logPhase('CRM: Create Lead', async () => {
    const raw = await fetch(`${BASE_URL}/crm/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ firstName: 'Test', email: 'lead@test.com', status: 'NEW' })
    });
    const resData = await raw.json();
    currentLeadId = resData.id;
    return { endpoint: '/api/crm/leads', responseStatus: raw.status, body: resData, status: raw.status === 201 ? 'PASS' : 'FAIL' };
  });

  await logPhase('CRM: Create Deal', async () => {
    const raw = await fetch(`${BASE_URL}/crm/pipelines/deal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ title: 'Audit Deal', value: 5000, stage: 'PROSPECT', leadId: currentLeadId })
    });
    const resData = await raw.json();
    currentDealId = resData.id;
    return { endpoint: '/api/crm/pipelines/deal', responseStatus: raw.status, body: resData, status: raw.status === 201 ? 'PASS' : 'FAIL' };
  });

  await logPhase('CRM: Move Deal Stage', async () => {
    if (!currentDealId) return { status: 'FAIL', error: 'No Deal ID' };
    const raw = await fetch(`${BASE_URL}/crm/pipelines/deal/${currentDealId}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ stage: 'WON' })
    });
    return { endpoint: `/api/crm/pipelines/deal/:dealId/stage`, responseStatus: raw.status, status: raw.status === 200 ? 'PASS' : 'FAIL' };
  });

  // 3. AI
  await logPhase('AI: Chat endpoint', async () => {
    const raw = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ message: 'Hello AI' })
    });
    return { endpoint: '/api/ai/chat', responseStatus: raw.status, status: raw.status === 201 || raw.status === 200 ? 'PASS' : 'FAIL' };
  });

  await logPhase('AI: Campaign generation', async () => {
    const raw = await fetch(`${BASE_URL}/ai/generate-campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ prompt: 'Generate ad for shoes' })
    });
    return { endpoint: '/api/ai/generate-campaign', responseStatus: raw.status, status: raw.status === 201 || raw.status === 200 ? 'PASS' : 'FAIL' };
  });

  // 4. AUTOMATIONS
  await logPhase('AUTOMATIONS: Create rule', async () => {
    const raw = await fetch(`${BASE_URL}/v1/automation/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ name: 'Audit Rule', trigger: 'LEAD_CREATED', actions: [] })
    });
    const resData = await raw.json();
    currentRuleId = resData.id;
    return { endpoint: '/api/v1/automation/rules', responseStatus: raw.status, body: resData, status: raw.status === 201 ? 'PASS' : 'FAIL' };
  });

  await logPhase('AUTOMATIONS: Execute rule', async () => {
    if(!currentRuleId) return {status: 'FAIL'};
    const raw = await fetch(`${BASE_URL}/v1/automation/rules/${currentRuleId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }
    });
    return { endpoint: '/api/v1/automation/rules/:id/execute', responseStatus: raw.status, status: raw.status === 201 || raw.status === 200 ? 'PASS' : 'FAIL' };
  });

  // 5. REPORTS
  await logPhase('REPORTS: Create report', async () => {
    const raw = await fetch(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ type: 'PERFORMANCE', format: 'PDF' })
    });
    return { endpoint: '/api/reports/generate', responseStatus: raw.status, status: raw.status === 201 ? 'PASS' : 'FAIL' };
  });

  fs.writeFileSync(path.join(__dirname, 'audit_results_3.json'), JSON.stringify(reportData, null, 2));
  console.log("\nSaved Phase 1-Reports to audit_results_3.json");
  await prisma.$disconnect();
}

runAudit();
