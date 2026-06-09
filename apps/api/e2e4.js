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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const email = `test-e2e4-${Date.now()}@example.com`;
  const password = `Test1234!`;

  // --- AUTHENTICATION ---
  await api.post('/auth/signup', { email, password, name: 'E2E4 User' });
  await prisma.user.update({ where: { email }, data: { isEmailVerified: true, role: 'ADMIN' } });
  const loginRes = await api.post('/auth/login', { email, password });
  const token = loginRes.data.access_token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  const orgId = loginRes.data.user.organizationId;
  
  // 1. REPORT GENERATION
  await safeExec('Report Generation', async () => {
    const payload = { name: 'E2E4 Report', format: 'PDF', type: 'EXECUTIVE', dateRange: { from: '2026-05-01', to: '2026-06-01' } };
    const res = await api.post('/v1/reports', payload);
    console.log('Create Report Status:', res.status);
    if(res.status < 400) {
      const reportId = res.data.id;
      console.log(`Waiting 10 seconds for BullMQ report worker...`);
      await sleep(10000);
      const rep = await prisma.report.findUnique({ where: { id: reportId }});
      console.log('Report After Wait:', { id: rep.id, status: rep.status, url: rep.url, format: rep.format });
      if (rep.status !== 'COMPLETED') {
         console.error('Report did not complete. Status:', rep.status);
      }
    }
    return res;
  });

  // 2. AUTOMATION EXECUTION
  await safeExec('Automation Execution', async () => {
    const payload = { 
       name: 'E2E4 Rule', 
       enabled: true,
       version: 1,
       triggerType: 'MANUAL', 
       actionType: 'SEND_NOTIFICATION', 
       configJson: { message: "Test E2E4 Msg", title: "Test Title", organizationId: orgId } 
    };
    const res = await api.post('/v1/automation/rules', payload);
    console.log('Create Rule Status:', res.status);
    
    if (res.data?.id) {
       console.log('Executing rule...', res.data.id);
       const exec = await api.post(`/v1/automation/rules/${res.data.id}/execute`);
       console.log('Execute Rule Status:', exec.status);
       
       console.log(`Waiting 5 seconds for automation worker...`);
       await sleep(5000);
       
       const execRec = await prisma.automationExecution.findFirst({ where: { ruleId: res.data.id } });
       console.log('Execution Record:', execRec ? `Found (${execRec.status})` : 'Not Found');
       
       const notif = await prisma.notification.findFirst({ where: { message: "Test E2E4 Msg" } });
       console.log('Notification Record:', notif ? `Found (${notif.title})` : 'Not Found');
    }
    return res;
  });

  // 3. GOOGLE ADS FULL FLOW
  await safeExec('Google Ads Flow', async () => {
    const res = await api.post('/v1/integrations/google-ads/callback', { code: 'mock-google-code' });
    console.log('Google Callback Status:', res.status, res.data);
    
    console.log(`Waiting 10 seconds for sync jobs...`);
    await sleep(10000);
    
    const cred = await prisma.integrationCredential.findFirst({ where: { organizationId: orgId, provider: 'GOOGLE_ADS' }});
    console.log('Credential Stored:', cred ? `Yes (Valid: ${cred.isValid})` : 'No');
    
    if (cred) {
       const campaigns = await prisma.campaign.findMany({ where: { source: 'GOOGLE_ADS' }, take: 1 });
       console.log('Campaign Sync:', campaigns.length > 0 ? `Found ${campaigns.length} sample records` : 'No campaigns synced');
       if (campaigns.length > 0) {
         const metrics = await prisma.campaignMetric.findMany({ where: { campaignId: campaigns[0].id } });
         console.log('Metrics Sync:', metrics.length > 0 ? `Found ${metrics.length} metrics` : 'No metrics synced');
       }
    }
    return res;
  });

  // 4. META ADS FULL FLOW
  await safeExec('Meta Ads Flow', async () => {
    const res = await api.post('/v1/integrations/meta-ads/callback', { code: 'mock-meta-code' });
    console.log('Meta Callback Status:', res.status, res.data);
    
    console.log(`Waiting 10 seconds for sync jobs...`);
    await sleep(10000);
    
    const cred = await prisma.integrationCredential.findFirst({ where: { organizationId: orgId, provider: 'META_ADS' }});
    console.log('Credential Stored:', cred ? `Yes (Valid: ${cred.isValid})` : 'No');
    
    if (cred) {
       const campaigns = await prisma.campaign.findMany({ where: { source: 'META_ADS' }, take: 1 });
       console.log('Campaign Sync:', campaigns.length > 0 ? `Found ${campaigns.length} sample records` : 'No campaigns synced');
       if (campaigns.length > 0) {
         const metrics = await prisma.campaignMetric.findMany({ where: { campaignId: campaigns[0].id } });
         console.log('Metrics Sync:', metrics.length > 0 ? `Found ${metrics.length} metrics` : 'No metrics synced');
       }
    }
    return res;
  });

  // 5. AI
  await safeExec('AI', async () => {
    console.log('Calling AI Chat endpoint...');
    const res = await api.post('/ai/chat', { message: 'Analyze this for me.' });
    console.log('AI Chat Status:', res.status);
    console.log('AI Chat Response:', res.data);
    
    // Check if error is specifically openai related
    if (res.status >= 400 && res.data?.message?.includes('Insufficient Balance') || res.data?.response?.includes('Insufficient Balance') || res.data?.response?.includes('402')) {
       console.log('Determined Issue: Account Billing Issue (402 Insufficient Balance)');
    } else if (res.status >= 400 || res.data?.response?.includes('failed')) {
       console.log('Determined Issue: Code or configuration issue');
    } else {
       console.log('Determined Issue: SUCCESS');
    }
    return res;
  });

  await prisma.$disconnect();
}
run().catch(console.error);
