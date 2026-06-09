const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  validateStatus: () => true
});

async function safeExec(name, fn) {
  console.log(`\n==================================================`);
  console.log(`TEST: ${name}`);
  console.log(`==================================================`);
  try {
    await fn();
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
  let token = null;
  let userId = null;
  let orgId = null;
  let clientId = null;
  let leadId = null;
  let dealId = null;

  const email = `test-${Date.now()}@example.com`;
  const password = `Test1234!`;

  // --- AUTHENTICATION ---
  await safeExec('Authentication - Register', async () => {
    const payload = { email, password, name: 'Test User' };
    console.log('Payload:', payload);
    const res = await api.post('/auth/signup', payload);
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found in DB');
    console.log('DB Row Created:', user.id, user.email);
    userId = user.id;

    // Force verify email so we can login
    await prisma.user.update({ where: { email }, data: { isEmailVerified: true } });
  });

  await safeExec('Authentication - Login', async () => {
    const payload = { email, password };
    const res = await api.post('/auth/login', payload);
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
    
    token = res.data.accessToken;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  });

  await safeExec('Authentication - 2FA Setup', async () => {
    const res = await api.post('/auth/2fa/generate');
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
  });

  // --- ORGANIZATIONS ---
  await safeExec('Organizations - Create', async () => {
    const payload = { name: `Test Org ${Date.now()}` };
    const res = await api.post('/organizations', payload);
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
    
    orgId = res.data.id || (res.data.data && res.data.data.id);
    if(!orgId) throw new Error('No org ID returned');
    
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    console.log('DB Row Created:', org);
    
    api.defaults.headers.common['x-organization-id'] = orgId;
  });

  // --- CRM ---
  await safeExec('CRM - Create Client', async () => {
    if (!orgId) throw new Error('Blocked by Organization creation');
    const payload = { name: 'Acme Corp', industry: 'Tech', website: 'acme.com', status: 'ACTIVE' };
    const res = await api.post('/crm/clients', payload); // Assuming endpoint
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
    clientId = res.data.id;
    console.log('DB Row:', await prisma.client.findUnique({where:{id: clientId}}));
  });

  await safeExec('CRM - Create Lead', async () => {
    const payload = { firstName: 'John', lastName: 'Doe', email: 'john@acme.com', status: 'NEW' };
    const res = await api.post('/crm/leads', payload);
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
    leadId = res.data.id || (res.data.data && res.data.data.id);
    console.log('DB Row:', await prisma.lead.findUnique({where:{id: leadId}}));
  });

  await safeExec('CRM - Create Deal', async () => {
    // Pipeline creation might be needed first, testing endpoint assumption
    const payload = { name: 'Big Deal', amount: 10000, stage: 'PROSPECTING', clientId, leadId };
    const res = await api.post('/crm/pipelines/deal', payload);
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
    dealId = res.data.id || res.data.data?.id;
  });

  // --- ADS OAUTH ---
  await safeExec('Google Ads - OAuth URL', async () => {
    const res = await api.get('/integrations/google/oauth-url');
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
  });

  await safeExec('Meta Ads - OAuth URL', async () => {
    const res = await api.get('/integrations/meta/oauth-url');
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
  });

  // --- AI ---
  await safeExec('AI - Chat Endpoint', async () => {
    const res = await api.post('/ai/chat', { message: 'Hello' });
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
    const log = await prisma.auditLog.findFirst({ orderBy: { createdAt: 'desc' }});
    console.log('Latest Audit Log:', log);
  });

  // --- AUTOMATIONS ---
  await safeExec('Automations - Execute', async () => {
    const payload = { name: 'Test Rule', triggerType: 'LEAD_CREATED', actionType: 'SEND_NOTIFICATION', configJson: { message: "Hello" } };
    const res = await api.post('/automations/rules', payload);
    console.log('Create Rule status:', res.status, res.data);
    
    if (res.data?.id) {
       const exec = await api.post(`/automations/rules/${res.data.id}/execute`);
       console.log('Execute status:', exec.status, exec.data);
    } else {
       throw new Error(JSON.stringify(res.data));
    }
  });

  // --- REPORTING ---
  await safeExec('Reporting - Generate PDF', async () => {
    const payload = { name: 'Monthly', format: 'PDF', type: 'EXECUTIVE', dateRange: { from: '2026-05-01', to: '2026-06-01' } };
    const res = await api.post('/v1/reports/generate', payload);
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
  });

  // --- DASHBOARDS ---
  await safeExec('Dashboards - Executive', async () => {
    const res = await api.get('/v1/reports/dashboards/executive');
    console.log('Response status:', res.status, res.data);
    if (res.status >= 400) throw new Error(JSON.stringify(res.data));
  });

  await prisma.$disconnect();
}

run().catch(console.error);
