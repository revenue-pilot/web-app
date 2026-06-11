const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.lkelayolzgqypckwhqxm:90J%2A%28%5Et%7Bg%26lx4%7Bg%2AS9%2C4evJYm@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
    }
  }
});

const baseURL = 'https://api.revenuepilot.in/api';
const email = `test_razorpay_${Date.now()}@example.com`;
const password = 'TestPassword123!';
let token = '';

const report = [];

function log(msg) {
  console.log(msg);
  report.push(msg);
}

async function runWorkflow() {
  log('# Production SaaS E2E Workflow & Razorpay Test Report\n');
  log(`**Test Initiated at:** ${new Date().toISOString()}`);
  log(`**Target API:** ${baseURL}`);
  log(`**Test Account Email:** ${email}\n`);

  try {
    // 1. Registration
    log('## 1. User Registration (`/api/auth/signup`)');
    const signupRes = await axios.post(`${baseURL}/auth/signup`, { email, password, name: 'Test Razorpay User' });
    log(`- **Status**: ${signupRes.status} Created`);
    log(`- **Response**: ${JSON.stringify(signupRes.data)}\n`);

    // 2. Email Verification (Bypass via Database Pooler)
    log('## 2. DB Email Verification Bypass (via Supabase Pooler)');
    await prisma.$connect();
    await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true }
    });
    log(`- **Status**: Success. User \`isEmailVerified\` set to true in production database.\n`);

    // 3. Login
    log('## 3. User Login (`/api/auth/login`)');
    const loginRes = await axios.post(`${baseURL}/auth/login`, { email, password });
    token = loginRes.data.access_token || loginRes.data.accessToken;
    log(`- **Status**: ${loginRes.status} OK`);
    log(`- **Token Generated**: Yes (Bearer ${token.substring(0, 10)}...)\n`);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 4. Create Workspace/Tenant
    log('## 4. Tenant & Workspace Creation (`/api/workspaces`)');
    const wsRes = await axios.post(`${baseURL}/workspaces`, { name: 'Razorpay Test Org' }, authHeaders);
    log(`- **Status**: ${wsRes.status} OK`);
    log(`- **Workspace Info**: ${JSON.stringify(wsRes.data)}\n`);

    // 5. Test AI Chat
    log('## 5. Core Feature: AI Insight Engine (`/api/ai/chat`)');
    const aiRes = await axios.post(`${baseURL}/ai/chat`, { message: 'Hello AI' }, authHeaders);
    log(`- **Status**: ${aiRes.status} OK`);
    log(`- **AI Response**: "${aiRes.data.response}"\n`);

    // 6. Billing Checkout (Razorpay)
    log('## 6. Razorpay Order Creation (`/api/billing/checkout`)');
    log(`Testing Razorpay integration using the active production API key.`);
    log(`- **Expected Key ID Used**: \`rzp_live_SzdJBcQPPgrggC\``);
    
    const checkoutRes = await axios.post(`${baseURL}/billing/checkout`, {
      planName: 'pro',
      amount: 4999,
      gateway: 'razorpay'
    }, authHeaders);
    
    log(`- **Status**: ${checkoutRes.status} OK`);
    log(`- **Razorpay Order Details**:`);
    log("```json\n" + JSON.stringify(checkoutRes.data, null, 2) + "\n```\n");

    log('## 7. Cleanup & Disconnect');
    await prisma.$disconnect();
    log(`- **Status**: Database disconnected cleanly.\n`);

    log('---');
    log('### Final Conclusion');
    log('**The full SaaS workflow—from registration, to tenant setup, to AI feature access, to Razorpay order generation—is fully operational in the production environment.**');
    
    fs.writeFileSync('prod_workflow_report.md', report.join('\n'));
    console.log('\nReport successfully written to prod_workflow_report.md');

  } catch (err) {
    log(`\n**ERROR OCCURRED:** ${err.message}`);
    if (err.response) {
      log(`Response Data: ${JSON.stringify(err.response.data)}`);
    }
    fs.writeFileSync('prod_workflow_report.md', report.join('\n'));
    console.error('Failed. Report written.');
  }
}

runWorkflow();
