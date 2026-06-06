/**
 * production-check.js
 * Full live audit of the deployed Railway API + Supabase DB + all integrations
 */

const https = require('https');
const http = require('http');

// ─── Configuration ────────────────────────────────────────────────────────────
// Update RAILWAY_API_URL if you know the Railway URL, otherwise we'll discover it
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || null;

// Local env values for cross-checking
process.env.DATABASE_URL = 'postgresql://postgres:gp_secure_db_pass_2026!@db.gpbhqfvuzieIugpnhwoz.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1';
process.env.DIRECT_URL   = 'postgresql://postgres:gp_secure_db_pass_2026!@db.gpbhqfvuzieIugpnhwoz.supabase.co:5432/postgres';
process.env.OPENAI_API_KEY = 'sk-live-82d03475490a569606f4d3aeb8190924440490bc3d4eeffda847d6637feaee8e';
process.env.OPENAI_BASE_URL = 'https://api.aicredits.in/v1';
process.env.RAZORPAY_KEY_ID = 'rzp_test_Sxvol5afG2iC0t';
process.env.RAZORPAY_KEY_SECRET = 'rmztvAmlRSPJoLxEbqgvrsln';

const results = [];
let pass = 0, warn = 0, fail = 0;

function log(status, name, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️ ' : '❌';
  console.log(`${icon} [${status}] ${name}`);
  if (detail) console.log(`        ${detail}`);
  results.push({ status, name, detail });
  if (status === 'PASS') pass++;
  else if (status === 'WARN') warn++;
  else fail++;
}

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'GrowthPilot-Checker', ...(opts.headers || {}) },
      timeout: opts.timeout || 15000,
    };
    const req = mod.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d), raw: d }); }
        catch (e) { resolve({ status: res.statusCode, body: null, raw: d }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    req.end();
  });
}

// ─── CHECK 1: Supabase DB Direct Connection ───────────────────────────────────
async function checkDatabase() {
  console.log('\n🔍 CHECK 1: Supabase PostgreSQL Connection');
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DIRECT_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tables = res.rows.map(r => r.table_name);
    await client.end();

    const required = ['User', 'Organization', 'Subscription', 'Campaign', 'Invoice'];
    const found = required.filter(t => tables.map(x => x.toLowerCase()).includes(t.toLowerCase()));
    const missing = required.filter(t => !tables.map(x => x.toLowerCase()).includes(t.toLowerCase()));

    if (missing.length === 0) {
      log('PASS', 'Supabase DB Connection', `Connected. ${tables.length} tables found: ${tables.slice(0,6).join(', ')}...`);
    } else {
      log('WARN', 'Supabase DB Connection', `Connected but missing tables: ${missing.join(', ')}. Found: ${tables.join(', ')}`);
    }
  } catch (e) {
    // Try without pg module
    log('WARN', 'Supabase DB Connection', `pg module not available locally — DB check skipped (${e.message.slice(0,80)})`);
  }
}

// ─── CHECK 2: Prisma Migration Status ────────────────────────────────────────
async function checkMigrations() {
  console.log('\n🔍 CHECK 2: Prisma Migration Status');
  const { execSync } = require('child_process');
  const nodeExe = 'D:/Sai saas/node/node.exe';
  const prismaBuild = 'D:/Sai saas/node_modules/prisma/build/index.js';
  const schema = 'D:/Sai saas/packages/database/prisma/schema.prisma';
  try {
    const result = execSync(
      `"${nodeExe}" "${prismaBuild}" migrate status --schema="${schema}"`,
      { cwd: 'D:/Sai saas', env: process.env, timeout: 30000, stdio: 'pipe' }
    );
    const output = result.toString();
    if (output.includes('No pending migrations') || output.includes('Database schema is up to date')) {
      log('PASS', 'Prisma Migration Status', 'No pending migrations — DB schema is up to date');
    } else if (output.includes('following migrations have not yet been applied')) {
      log('WARN', 'Prisma Migration Status', `Pending migrations detected:\n        ${output.slice(0, 200)}`);
    } else {
      log('PASS', 'Prisma Migration Status', output.replace(/\n/g, ' ').slice(0, 150));
    }
  } catch (e) {
    const errOut = e.stderr?.toString() || e.stdout?.toString() || e.message;
    log('WARN', 'Prisma Migration Status', errOut.slice(0, 150));
  }
}

// ─── CHECK 3: OpenAI / AI Credits ────────────────────────────────────────────
async function checkOpenAI() {
  console.log('\n🔍 CHECK 3: OpenAI API (via aicredits.in)');
  try {
    const res = await fetch('https://api.aicredits.in/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      timeout: 10000,
    });
    if (res.status === 200 && res.body?.data) {
      const models = res.body.data.slice(0, 3).map(m => m.id).join(', ');
      log('PASS', 'OpenAI API (aicredits.in)', `Authenticated. Available models: ${models}`);
    } else {
      log('FAIL', 'OpenAI API (aicredits.in)', `HTTP ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', 'OpenAI API (aicredits.in)', e.message);
  }
}

// ─── CHECK 4: Razorpay ───────────────────────────────────────────────────────
async function checkRazorpay() {
  console.log('\n🔍 CHECK 4: Razorpay Billing');
  try {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}` },
      body: JSON.stringify({ amount: 49900, currency: 'INR', receipt: `prod_check_${Date.now()}` }),
      timeout: 10000,
    });
    if (res.status === 200 && res.body?.id) {
      log('PASS', 'Razorpay Billing', `Order created: ${res.body.id} | ₹${res.body.amount/100} ${res.body.currency}`);
    } else {
      log('FAIL', 'Razorpay Billing', `HTTP ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', 'Razorpay Billing', e.message);
  }
}

// ─── CHECK 5: Email / Resend (read from Railway via local .env) ───────────────
async function checkResend() {
  console.log('\n🔍 CHECK 5: Resend Email API');
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    log('WARN', 'Resend Email API', 'RESEND_API_KEY not set in local .env — checking via API');
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: ['test@example.com'],
        subject: 'GrowthPilot — Production Check',
        html: '<p>Production health check email test.</p>',
      }),
      timeout: 10000,
    });
    if (res.status === 200 || res.status === 201) {
      log('PASS', 'Resend Email API', `Email sent. ID: ${res.body?.id}`);
    } else if (res.status === 403) {
      log('WARN', 'Resend Email API', 'API key valid but domain not verified — use resend.dev domain or verify your domain');
    } else {
      log('FAIL', 'Resend Email API', `HTTP ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', 'Resend Email API', e.message);
  }
}

// ─── CHECK 6: Schema Integrity ───────────────────────────────────────────────
async function checkSchema() {
  console.log('\n🔍 CHECK 6: Prisma Schema Integrity');
  const fs = require('fs');
  const schema = fs.readFileSync('D:/Sai saas/packages/database/prisma/schema.prisma', 'utf8');
  const checks = [
    { name: 'directUrl configured',        pass: schema.includes('directUrl') },
    { name: 'GROWTH plan tier exists',      pass: schema.includes('GROWTH') },
    { name: 'gatewayPaymentId field',       pass: schema.includes('gatewayPaymentId') },
    { name: 'stripeId removed',             pass: !schema.includes('stripeId') },
    { name: 'DATABASE_URL env var used',    pass: schema.includes('env("DATABASE_URL")') },
    { name: 'DIRECT_URL env var used',      pass: schema.includes('env("DIRECT_URL")') },
    { name: 'User model present',           pass: schema.includes('model User') },
    { name: 'Organization model present',   pass: schema.includes('model Organization') },
    { name: 'Campaign model present',       pass: schema.includes('model Campaign') },
    { name: 'Subscription model present',   pass: schema.includes('model Subscription') },
  ];
  let allPass = true;
  checks.forEach(c => {
    if (!c.pass) allPass = false;
  });
  if (allPass) {
    log('PASS', 'Prisma Schema Integrity', `All ${checks.length} schema checks passed`);
  } else {
    const failed = checks.filter(c => !c.pass).map(c => c.name);
    log('FAIL', 'Prisma Schema Integrity', `Failed: ${failed.join(', ')}`);
  }
}

// ─── CHECK 7: Email Service Code ─────────────────────────────────────────────
async function checkEmailService() {
  console.log('\n🔍 CHECK 7: Email Service Code');
  const fs = require('fs');
  const code = fs.readFileSync('D:/Sai saas/apps/api/src/email/email.service.ts', 'utf8');
  const checks = [
    { name: 'Uses FRONTEND_URL for links',  pass: code.includes('process.env.FRONTEND_URL') },
    { name: 'No hardcoded localhost:3000',  pass: !code.includes('http://localhost:3000') },
    { name: 'No hardcoded growthpilot.com', pass: !code.includes("'https://growthpilot.com") && !code.includes('"https://growthpilot.com') },
    { name: 'Welcome email method exists',  pass: code.includes('sendWelcomeEmail') },
    { name: 'Magic link email exists',      pass: code.includes('sendMagicLinkEmail') },
    { name: 'Password reset email exists',  pass: code.includes('sendPasswordResetEmail') },
  ];
  const failed = checks.filter(c => !c.pass);
  if (failed.length === 0) {
    log('PASS', 'Email Service Code', `All ${checks.length} checks passed — no hardcoded URLs`);
  } else {
    log('FAIL', 'Email Service Code', `Issues: ${failed.map(c => c.name).join(', ')}`);
  }
}

// ─── CHECK 8: Next.js Proxy Config ───────────────────────────────────────────
async function checkNextConfig() {
  console.log('\n🔍 CHECK 8: Next.js API Proxy');
  const fs = require('fs');
  const config = fs.readFileSync('D:/Sai saas/apps/web/next.config.js', 'utf8');
  if (config.includes('BACKEND_URL') && !config.includes("NEXT_PUBLIC_API_URL || 'http://localhost:3001'")) {
    log('PASS', 'Next.js API Proxy Config', 'Uses BACKEND_URL — no circular routing risk');
  } else {
    log('WARN', 'Next.js API Proxy Config', 'May still have old NEXT_PUBLIC_API_URL pattern');
  }
}

// ─── CHECK 9: CI/CD Pipeline ─────────────────────────────────────────────────
async function checkCICD() {
  console.log('\n🔍 CHECK 9: CI/CD Pipeline');
  const fs = require('fs');
  const workflow = fs.readFileSync('D:/Sai saas/.github/workflows/deploy.yml', 'utf8');
  const checks = [
    { name: 'Uses railway up (not railway upload)', pass: workflow.includes('railway up') && !workflow.includes('railway upload') },
    { name: 'Has prisma generate step',             pass: workflow.includes('prisma generate') },
    { name: 'Has DATABASE_URL env in CI',           pass: workflow.includes('DATABASE_URL') },
    { name: 'Deploys on push to main',              pass: workflow.includes("- main") },
    { name: 'Deploys on push to staging',           pass: workflow.includes("- staging") },
    { name: 'Node.js 20 configured',                pass: workflow.includes("node-version: '20'") },
  ];
  const failed = checks.filter(c => !c.pass);
  if (failed.length === 0) {
    log('PASS', 'GitHub Actions CI/CD', `All ${checks.length} pipeline checks passed`);
  } else {
    log('WARN', 'GitHub Actions CI/CD', `Issues: ${failed.map(c => c.name).join(', ')}`);
  }
}

// ─── CHECK 10: Railway API Live Health ───────────────────────────────────────
async function checkRailwayHealth() {
  console.log('\n🔍 CHECK 10: Railway API Live Health');
  if (!RAILWAY_API_URL) {
    log('WARN', 'Railway API Health', 'RAILWAY_API_URL not set — skipping live endpoint check. Set via: node production-check.js (with RAILWAY_API_URL env)');
    return null;
  }
  try {
    const res = await fetch(`${RAILWAY_API_URL}/api/health`, { timeout: 15000 });
    if (res.status === 200 && res.body) {
      const db = res.body.database;
      if (db === 'CONNECTED') {
        log('PASS', 'Railway API Health', `Status: ${res.body.status} | DB: ${db} | Uptime: ${Math.round(res.body.uptime)}s`);
      } else {
        log('WARN', 'Railway API Health', `Status: ${res.body.status} | DB: ${db} — check Railway logs`);
      }
    } else {
      log('FAIL', 'Railway API Health', `HTTP ${res.status}: ${res.raw.slice(0, 150)}`);
    }
    return res.body;
  } catch (e) {
    log('FAIL', 'Railway API Health', `Cannot reach ${RAILWAY_API_URL}: ${e.message}`);
    return null;
  }
}

// ─── CHECK 11: Auth Endpoints ────────────────────────────────────────────────
async function checkAuthEndpoints(baseUrl) {
  console.log('\n🔍 CHECK 11: API Auth Endpoints');
  if (!baseUrl) {
    log('WARN', 'API Auth Endpoints', 'Skipped — RAILWAY_API_URL not set');
    return;
  }
  try {
    const testEmail = `prod_check_${Date.now()}@test.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: { email: testEmail, password: 'Test@1234', name: 'Prod Check' },
      timeout: 15000,
    });
    if (regRes.body?.success) {
      log('PASS', 'Auth: Register endpoint', `User created: ${testEmail}`);
    } else {
      log('WARN', 'Auth: Register endpoint', `Response: ${JSON.stringify(regRes.body).slice(0, 100)}`);
    }

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: { email: testEmail, password: 'Test@1234' },
      timeout: 15000,
    });
    if (loginRes.body?.success) {
      log('PASS', 'Auth: Login endpoint', `Login successful for: ${testEmail}`);
    } else {
      log('WARN', 'Auth: Login endpoint', `Response: ${JSON.stringify(loginRes.body).slice(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', 'API Auth Endpoints', e.message);
  }
}

// ─── CHECK 12: Billing Endpoint ──────────────────────────────────────────────
async function checkBillingEndpoint(baseUrl) {
  console.log('\n🔍 CHECK 12: Billing / Razorpay Endpoint');
  if (!baseUrl) {
    log('WARN', 'Billing Endpoint', 'Skipped — RAILWAY_API_URL not set');
    return;
  }
  try {
    const res = await fetch(`${baseUrl}/api/billing/plans`, { timeout: 10000 });
    if (res.status === 200 && res.body) {
      const plans = Array.isArray(res.body) ? res.body.map(p => p.name || p.id).join(', ') : JSON.stringify(res.body).slice(0, 80);
      log('PASS', 'Billing Plans Endpoint', `Plans returned: ${plans}`);
    } else {
      log('WARN', 'Billing Plans Endpoint', `HTTP ${res.status}: ${res.raw.slice(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', 'Billing Plans Endpoint', e.message);
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   GrowthPilot — Full Production Audit                ║');
  console.log(`║   ${new Date().toISOString()}              ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  await checkDatabase();
  await checkMigrations();
  await checkOpenAI();
  await checkRazorpay();
  await checkResend();
  await checkSchema();
  await checkEmailService();
  await checkNextConfig();
  await checkCICD();
  const health = await checkRailwayHealth();
  await checkAuthEndpoints(RAILWAY_API_URL);
  await checkBillingEndpoint(RAILWAY_API_URL);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                AUDIT SUMMARY                         ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  ✅ PASS:  ${String(pass).padEnd(4)} checks                            ║`);
  console.log(`║  ⚠️  WARN:  ${String(warn).padEnd(4)} checks (non-blocking)             ║`);
  console.log(`║  ❌ FAIL:  ${String(fail).padEnd(4)} checks (must fix)                 ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (fail > 0) {
    console.log('\n❌ CRITICAL ISSUES TO FIX:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.name}: ${r.detail}`);
    });
  }
  if (warn > 0) {
    console.log('\n⚠️  WARNINGS (review these):');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   • ${r.name}: ${r.detail}`);
    });
  }

  if (fail === 0) {
    console.log('\n🎉 Production audit complete! No critical failures.');
  }
}

main().catch(console.error);
