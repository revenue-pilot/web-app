require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const Redis = require('ioredis');

const prisma = new PrismaClient();
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  validateStatus: () => true
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('--- RUNTIME VERIFICATION ---');

  // Login to get token and org
  const email = `test-verify-${Date.now()}@example.com`;
  const password = `Test1234!`;
  await api.post('/auth/signup', { email, password, name: 'Verify User' });
  await prisma.user.update({ where: { email }, data: { isEmailVerified: true, role: 'ADMIN' } });
  const loginRes = await api.post('/auth/login', { email, password });
  const token = loginRes.data.access_token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  const orgId = loginRes.data.user.organizationId;
  const clientId = (await prisma.client.create({ data: { organizationId: orgId, name: 'Verify Client' } })).id;

  console.log('\n--- 1. REPORT GENERATION ---');
  // 1. Create a report through the API
  const reportPayload = { name: 'Verify Report', format: 'PDF', type: 'EXECUTIVE', dateRange: { from: '2026-05-01', to: '2026-06-01' } };
  const reportRes = await api.post('/v1/reports', reportPayload);
  console.log('API Response:', reportRes.data);
  const reportId = reportRes.data.id;

  // Wait for worker
  console.log('Waiting 10s for BullMQ to process Report...');
  await sleep(10000);

  // 5. Confirm Report DB Record
  const rep = await prisma.report.findUnique({ where: { id: reportId }});
  console.log('Report DB Record after queue:', { id: rep.id, status: rep.status, url: rep.url, format: rep.format });

  console.log('\n--- 2. AUTOMATION EXECUTION ---');
  // 6. Create Automation Rule
  const rulePayload = { 
    name: 'Verify Rule', 
    enabled: true,
    version: 1,
    triggerType: 'MANUAL', 
    actionType: 'SEND_NOTIFICATION', 
    configJson: { message: "Verify Automation Notification", title: "Verify Automation", organizationId: orgId } 
  };
  const ruleRes = await api.post('/v1/automation/rules', rulePayload);
  console.log('Create Rule API Response:', ruleRes.data);
  const ruleId = ruleRes.data.id;

  // 7. Execute Rule
  const execRes = await api.post(`/v1/automation/rules/${ruleId}/execute`);
  console.log('Execute Rule API Response:', execRes.data);
  
  console.log('Waiting 5s for Automation Worker...');
  await sleep(5000);

  // 8. Confirm AutomationExecution Record
  const execRecord = await prisma.automationExecution.findFirst({ where: { ruleId }, orderBy: { startedAt: 'desc' } });
  console.log('AutomationExecution Record:', execRecord ? { id: execRecord.id, status: execRecord.status } : 'Not Found');

  // 9. Confirm Notification Record
  const notifRecord = await prisma.notification.findFirst({ where: { message: "Verify Automation Notification" } });
  console.log('Notification Record:', notifRecord ? { id: notifRecord.id, title: notifRecord.title } : 'Not Found');

  console.log('\n--- 3. REDIS KEYS IN USE ---');
  const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
  const keys = await redis.keys('*');
  console.log(`Found ${keys.length} keys in Redis`);
  console.log(keys.filter(k => !k.includes('bull:background-jobs:repeat')).slice(0, 20), '... (and repeatable jobs)');
  redis.disconnect();

  console.log('\n--- 4. FILES IN UPLOADS ---');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fsSync.existsSync(uploadsDir)) {
      const walk = async (dir) => {
        let results = [];
        const list = await fs.readdir(dir);
        for (let file of list) {
            file = path.join(dir, file);
            const stat = await fs.stat(file);
            if (stat && stat.isDirectory()) results = results.concat(await walk(file));
            else results.push(file.replace(uploadsDir, ''));
        }
        return results;
      };
      const files = await walk(uploadsDir);
      console.log('Files created in uploads/ :');
      files.forEach(f => console.log(f));
  } else {
      console.log('No uploads folder found.');
  }

  await prisma.$disconnect();
}

run().catch(err => {
    console.error('RUNTIME EXCEPTION:', err);
});
