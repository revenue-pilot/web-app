const axios = require('axios');
const fs = require('fs');

const baseURL = 'https://api.revenuepilot.in/api';
const appPassword = 'TestPassword123!';
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
  
  try {
    // 1. Setup Mail.tm Account
    log('## 1. Initializing Temporary Email via Mail.tm');
    const domainsRes = await axios.get('https://api.mail.tm/domains');
    const domain = domainsRes.data['hydra:member'][0].domain;
    
    const emailPrefix = `razorpay_${Date.now()}`;
    const emailAddress = `${emailPrefix}@${domain}`;
    const mailPassword = 'mailpassword123';
    
    await axios.post('https://api.mail.tm/accounts', { address: emailAddress, password: mailPassword });
    const tokenRes = await axios.post('https://api.mail.tm/token', { address: emailAddress, password: mailPassword });
    const mailToken = tokenRes.data.token;
    
    log(`- **Email Address Created:** ${emailAddress}\n`);

    // 2. Registration
    log('## 2. User Registration (`/api/auth/signup`)');
    log(`- **Password:** ${appPassword}`);
    
    const signupRes = await axios.post(`${baseURL}/auth/signup`, { 
      email: emailAddress, 
      password: appPassword, 
      firstName: 'Razorpay', 
      lastName: 'Tester',
      companyName: 'Razorpay Review'
    });
    
    log(`- **Status**: ${signupRes.status} Created`);
    log(`- **Message**: ${signupRes.data.message}\n`);

    // 3. Fetch Verification Email
    log('## 3. Email Verification Polling');
    let verificationToken = null;
    
    for (let i = 0; i < 20; i++) {
      log(`  - Polling inbox (Attempt ${i + 1})...`);
      const inboxRes = await axios.get('https://api.mail.tm/messages', {
        headers: { Authorization: `Bearer ${mailToken}` }
      });
      const messages = inboxRes.data['hydra:member'];
      
      if (messages && messages.length > 0) {
        const msgId = messages[0].id;
        log(`  - Email received! ID: ${msgId}`);
        
        const mailRes = await axios.get(`https://api.mail.tm/messages/${msgId}`, {
          headers: { Authorization: `Bearer ${mailToken}` }
        });
        const html = mailRes.data.html[0] || mailRes.data.text;
        
        // Extract token
        const match = html.match(/token=([a-fA-F0-9]+)/);
        if (match) {
          verificationToken = match[1];
          log(`  - Verification token extracted: ${verificationToken}`);
          break;
        }
      }
      await sleep(2000);
    }

    if (!verificationToken) {
      throw new Error('Failed to retrieve verification email or token.');
    }

    // 4. Verify Email
    const verifyRes = await axios.post(`${baseURL}/auth/verify-email`, { token: verificationToken });
    log(`- **Verify Status**: ${verifyRes.status} OK`);
    log(`- **Message**: ${verifyRes.data.message}\n`);

    // 5. Login
    log('## 4. User Login (`/api/auth/login`)');
    const loginRes = await axios.post(`${baseURL}/auth/login`, { email: emailAddress, password: appPassword });
    const appToken = loginRes.data.access_token || loginRes.data.accessToken;
    log(`- **Status**: ${loginRes.status} OK`);
    log(`- **Token Generated**: Yes (Bearer ${appToken.substring(0, 10)}...)\n`);

    const authHeaders = { headers: { Authorization: `Bearer ${appToken}` } };

    // 6. Razorpay Checkout Request
    log('## 5. Razorpay Checkout Generation (`/api/billing/checkout`)');
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
    log('### Verified Credentials for Razorpay Team');
    log('Please provide the following credentials to the Razorpay testing team so they can test the workflow manually on the production dashboard:');
    log(`* **Frontend URL:** https://revenuepilot.in/login`);
    log(`* **Email:** \`${emailAddress}\``);
    log(`* **Password:** \`${appPassword}\``);
    
    fs.writeFileSync('razorpay_verified_report.md', report.join('\n'));
    console.log('\nReport successfully written to razorpay_verified_report.md');

  } catch (err) {
    log(`\n**ERROR OCCURRED:** ${err.message}`);
    if (err.response) {
      log(`Response Data: ${JSON.stringify(err.response.data)}`);
    }
    fs.writeFileSync('razorpay_verified_report.md', report.join('\n'));
    console.error('Failed. Report written.');
  }
}

runWorkflow();
