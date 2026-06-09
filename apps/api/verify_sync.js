require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  validateStatus: () => true
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const email = `sync-verify-${Date.now()}@example.com`;
  const password = `Test1234!`;
  await api.post('/auth/signup', { email, password, name: 'Sync User' });
  await prisma.user.update({ where: { email }, data: { isEmailVerified: true, role: 'ADMIN' } });
  const loginRes = await api.post('/auth/login', { email, password });
  const token = loginRes.data.access_token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  const orgId = loginRes.data.user.organizationId;

  console.log('=== GOOGLE ADS CALLBACK & SYNC ===');
  const googleRes = await api.post('/v1/integrations/google-ads/callback', { code: 'valid-test-code' });
  console.log('Google Callback Status:', googleRes.status);
  console.log('Google Callback Response:', googleRes.data);
  
  await sleep(2000);
  const googleCreds = await prisma.integrationCredential.count({ where: { organizationId: orgId, provider: 'GOOGLE_ADS' }});
  const googleCampaigns = await prisma.campaign.count({ where: { organizationId: orgId, source: 'GOOGLE_ADS' }});
  console.log('Database evidence (Google):');
  console.log('- IntegrationCredential rows:', googleCreds);
  console.log('- Campaign rows:', googleCampaigns);

  console.log('\n=== META ADS CALLBACK & SYNC ===');
  const metaRes = await api.post('/v1/integrations/meta-ads/callback', { code: 'valid-test-code' });
  console.log('Meta Callback Status:', metaRes.status);
  console.log('Meta Callback Response:', metaRes.data);
  
  await sleep(2000);
  const metaCreds = await prisma.integrationCredential.count({ where: { organizationId: orgId, provider: 'META_ADS' }});
  const metaCampaigns = await prisma.campaign.count({ where: { organizationId: orgId, source: 'META_ADS' }});
  console.log('Database evidence (Meta):');
  console.log('- IntegrationCredential rows:', metaCreds);
  console.log('- Campaign rows:', metaCampaigns);

  await prisma.$disconnect();
}
run().catch(console.error);
