const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const api = axios.create({
  baseURL: 'https://api.revenuepilot.in/api',
  validateStatus: () => true
});

async function safeExec(name, fn) {
  console.log(`\n==================================================`);
  console.log(`TEST: ${name}`);
  console.log(`==================================================`);
  try {
    const res = await fn();
    if(res) {
        if(res.status >= 400) {
            console.error(`[FAIL] ${name}`);
            console.error(`Response:`, res.status, res.data);
            return false;
        }
    }
    console.log(`[PASS] ${name}`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`Error:`, err.message);
    if (err.response) {
      console.error(`Response:`, err.response.data);
    }
    return false;
  }
}

async function run() {
  const email = `test-admin-${Date.now()}@example.com`;
  const password = `Test1234!`;

  // --- AUTHENTICATION ---
  const regRes = await api.post('/auth/signup', { email, password, name: 'Admin User' });
  await prisma.user.update({ where: { email }, data: { isEmailVerified: true, role: 'ADMIN' } });
  const loginRes = await api.post('/auth/login', { email, password });
  const token = loginRes.data.access_token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  await safeExec('RBAC - Executive Dashboard', async () => {
    const res = await api.get('/v1/reports/dashboards/executive');
    console.log('Request Headers:');
    console.log(`  Authorization: Bearer <TOKEN>`);
    console.log('Response status:', res.status, res.data);
    return res;
  });

  await safeExec('Google Ads - OAuth URL', async () => {
    const res = await api.get('/v1/integrations/google-ads/auth');
    console.log('Response status:', res.status, res.data);
    return res;
  });

  await safeExec('Meta Ads - OAuth URL', async () => {
    const res = await api.get('/v1/integrations/meta-ads/auth');
    console.log('Response status:', res.status, res.data);
    return res;
  });

  await safeExec('Automations - Execute', async () => {
    const payload = { 
       name: 'Test Rule 2', 
       triggerType: 'LEAD_CREATED', 
       actionType: 'SEND_NOTIFICATION', 
       configJson: { message: "Hello", title: "Hi", organizationId: loginRes.data.user.organizationId } 
    };
    const res = await api.post('/v1/automation/rules', payload);
    console.log('Create Rule status:', res.status, res.data);
    
    if (res.data?.id) {
       const exec = await api.post(`/v1/automation/rules/${res.data.id}/execute`);
       console.log('Execute status:', exec.status, exec.data);
       
       // Verify Execution record
       const execRec = await prisma.automationExecution.findFirst({ where: { ruleId: res.data.id } });
       console.log('Execution Record:', execRec);
       return exec;
    } else {
       console.error("Failed to create rule", res.data);
       return res;
    }
  });

  await safeExec('Reporting - Create', async () => {
    const payload = { name: 'Weekly Report', format: 'PDF', type: 'EXECUTIVE', dateRange: { from: '2026-05-01', to: '2026-06-01' } };
    const res = await api.post('/v1/reports', payload);
    console.log('Create Report status:', res.status, res.data);
    
    const rep = await prisma.report.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log('Report DB Record:', rep);
    return res;
  });

  await safeExec('OpenAI - Chat Endpoint', async () => {
    const res = await api.post('/ai/chat', { message: 'Hello' });
    console.log('Response status:', res.status, res.data);
    return res;
  });

  await prisma.$disconnect();
}
run().catch(console.error);
