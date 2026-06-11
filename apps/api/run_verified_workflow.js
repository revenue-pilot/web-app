const axios = require('axios');
const fs = require('fs');

const baseURL = 'https://api.revenuepilot.in/api';
const password = 'TestPassword123!';
const emailPrefix = `razorpay_${Date.now()}`;
const domain = '1secmail.com';
const email = `${emailPrefix}@${domain}`;

let token = '';
const report = [];

function log(msg) {
  console.log(msg);
  report.push(msg);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWorkflow() {
  log('# Production SaaS & Razorpay Verified Credentials Report\n');
  log(`**Test Initiated at:** ${new Date().toISOString()}`);
  log(`**Target API:** ${baseURL}\n`);

  try {
    // 1. Registration
    log('## 1. User Registration (`/api/auth/signup`)');
    log(`- **Email:** ${email}`);
    log(`- **Password:** ${password}`);
    
    const signupRes = await axios.post(`${baseURL}/auth/signup`, { 
      email, 
      password, 
      firstName: 'Razorpay', 
      lastName: 'Tester',
      companyName: 'Razorpay Review'
    });
    
    log(`- **Status**: ${signupRes.status} Created`);
    log(`- **Message**: ${signupRes.data.message}\n`);

    // 2. Fetch Verification Email
    log('## 2. Email Verification via Temp Mail');
    let verificationToken = null;
    
    for (let i = 0; i < 15; i++) { // Poll for up to 15 seconds
      log(`  - Polling inbox (Attempt ${i + 1})...`);
      const inboxRes = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${emailPrefix}&domain=${domain}`);
      const messages = inboxRes.data;
      
      if (messages && messages.length > 0) {
        const msgId = messages[0].id;
        log(`  - Email received! ID: ${msgId}`);
        
        const mailRes = await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${emailPrefix}&domain=${domain}&id=${msgId}`);
        const html = mailRes.data.htmlBody || mailRes.data.textBody;
        
        // Extract token
        const match = html.match(/token=([a-f0-9]+)/);
        if (match) {
          verificationToken = match[1];
          log(`  - Verification token extracted!`);
          break;
        }
      }
      await sleep(2000);
    }

    if (!verificationToken) {
      throw new Error('Failed to retrieve verification email or token.');
    }

    // 3. Verify Email
    const verifyRes = await axios.post(`${baseURL}/auth/verify-email`, { token: verificationToken });
    log(`- **Verify Status**: ${verifyRes.status} OK`);
    log(`- **Message**: ${verifyRes.data.message}\n`);

    // 4. Login
    log('## 3. User Login (`/api/auth/login`)');
    const loginRes = await axios.post(`${baseURL}/auth/login`, { email, password });
    token = loginRes.data.access_token || loginRes.data.accessToken;
    log(`- **Status**: ${loginRes.status} OK`);
    log(`- **Token Generated**: Yes (Bearer ${token.substring(0, 10)}...)\n`);

    const authHeaders = { headers: { Authorization: `Bearer ${token}`, 'x-user-email': email } };

    // 5. Razorpay Checkout Request
    log('## 4. Razorpay Checkout Generation (`/api/billing/checkout`)');
    const checkoutRes = await axios.post(`${baseURL}/billing/checkout`, {
      planName: 'pro',
      amount: 4999,
      gateway: 'razorpay'
    }, authHeaders);
    
    log(`- **Status**: ${checkoutRes.status} OK`);
    if (checkoutRes.data.order) {
      log(`- **Razorpay Order ID Generated**: \`${checkoutRes.data.order.id}\``);
      log(`- **Order Amount**: ${checkoutRes.data.order.amount / 100} INR`);
    } else {
      log(`- **Response**: ${JSON.stringify(checkoutRes.data)}`);
    }

    log('\n---');
    log('### Credentials for Razorpay Team');
    log('Please provide the following credentials to the Razorpay testing team so they can test the workflow manually on the production dashboard:');
    log(`* **Frontend URL:** https://revenuepilot.in/login`);
    log(`* **Email:** \`${email}\``);
    log(`* **Password:** \`${password}\``);
    
    fs.writeFileSync('razorpay_workflow_report.md', report.join('\n'));
    console.log('\nReport successfully written to razorpay_workflow_report.md');

  } catch (err) {
    log(`\n**ERROR OCCURRED:** ${err.message}`);
    if (err.response) {
      log(`Response Data: ${JSON.stringify(err.response.data)}`);
    }
    fs.writeFileSync('razorpay_workflow_report.md', report.join('\n'));
    console.error('Failed. Report written.');
  }
}

runWorkflow();
