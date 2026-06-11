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
    if(res && res.status >= 400) {
        console.error(`[FAIL] ${name}`);
        console.error(`Response:`, res.status, res.data);
        return false;
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
  
  // Pipeline Stage setup for Deal
  const orgId = loginRes.data.user.organizationId;
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Default Pipeline',
      organizationId: orgId,
      PipelineStage: {
        create: { name: 'New Stage', order: 1, forecastProbability: 50 }
      }
    },
    include: { PipelineStage: true }
  });
  const stageId = pipeline.PipelineStage[0].id;

  // 1. POST /api/crm/pipelines/deal
  await safeExec('CRM - Create Deal', async () => {
    const payload = { title: 'Big Deal', amount: 50000, stageId };
    console.log('Request Payload:', payload);
    const res = await api.post('/crm/pipelines/deal', payload);
    console.log('Response status:', res.status, res.data);
    
    if (res.status < 400) {
      const deal = await prisma.deal.findUnique({ where: { id: res.data.id || res.data.data?.id || res.data.deal?.id }});
      console.log('DB Row Created:', deal);
    }
    return res;
  });

  // 2. Automations
  await safeExec('Automations - Create Rule', async () => {
    const payload = { 
       name: 'My New Rule', 
       enabled: true,
       version: 1,
       triggerType: 'MANUAL', 
       actionType: 'SEND_NOTIFICATION', 
       configJson: { message: "Hello", title: "Hi", organizationId: loginRes.data.user.organizationId } 
    };
    console.log('Request Payload:', payload);
    const res = await api.post('/v1/automation/rules', payload);
    console.log('Response status:', res.status, res.data);
    
    if (res.data?.id) {
       console.log('DB Row Created:', res.data);
       
       // Execute it
       console.log('\n--- Automations - Execute Rule ---');
       const exec = await api.post(`/v1/automation/rules/${res.data.id}/execute`);
       console.log('Response status:', exec.status, exec.data);
       
       // Verify Execution record and jobs
       const execRec = await prisma.automationExecution.findFirst({ where: { ruleId: res.data.id } });
       console.log('Execution Record:', execRec);
    }
    return res;
  });

  // 3. Reporting
  await safeExec('Reporting - Create', async () => {
    const payload = { name: 'Weekly Report', format: 'PDF', type: 'EXECUTIVE', dateRange: { from: '2026-05-01', to: '2026-06-01' } };
    console.log('Request Payload:', payload);
    const res = await api.post('/v1/reports', payload);
    console.log('Response status:', res.status, res.data);
    
    if (res.status < 400) {
      const rep = await prisma.report.findFirst({ where: { id: res.data.id } });
      console.log('Report DB Record:', rep);
    }
    return res;
  });

  await prisma.$disconnect();
}
run().catch(console.error);
