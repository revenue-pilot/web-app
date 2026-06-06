const https = require('https');

const token = process.argv[2];
const owner = 'proresindia-ux';
const repo = 'revenuepilot';

function githubGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GrowthPilot-CI'
      }
    };
    https.get(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    }).on('error', reject);
  });
}

async function getFile(filepath) {
  const encoded = filepath.replace(/\//g, '%2F');
  const res = await githubGet(`/repos/${owner}/${repo}/contents/${encoded}`);
  if (res.status === 200) {
    const content = Buffer.from(res.body.content, 'base64').toString();
    return { found: true, content, sha: res.body.sha };
  }
  return { found: false };
}

async function main() {
  console.log('=== Checking key files on GitHub (commit 0fbee356) ===\n');

  // Check email service
  const email = await getFile('apps/api/src/email/email.service.ts');
  if (email.found) {
    const hasFrontendUrl = email.content.includes('process.env.FRONTEND_URL');
    const hasLocalhost = email.content.includes("http://localhost:3000/login/verify");
    console.log('📧 email.service.ts:');
    console.log('   Uses FRONTEND_URL:', hasFrontendUrl ? '✅ YES' : '❌ NO');
    console.log('   Has hardcoded localhost:', hasLocalhost ? '⚠️  YES (needs fix)' : '✅ NO');
  }

  // Check next.config.js
  const nextConfig = await getFile('apps/web/next.config.js');
  if (nextConfig.found) {
    const hasBackendUrl = nextConfig.content.includes('BACKEND_URL');
    const hasOldVar = nextConfig.content.includes('NEXT_PUBLIC_API_URL');
    console.log('\n🔧 next.config.js:');
    console.log('   Uses BACKEND_URL:', hasBackendUrl ? '✅ YES' : '❌ NO (needs fix)');
    console.log('   Has old NEXT_PUBLIC_API_URL:', hasOldVar ? '⚠️  YES' : '✅ NO');
  }

  // Check Prisma schema
  const schema = await getFile('packages/database/prisma/schema.prisma');
  if (schema.found) {
    const hasGrowth = schema.content.includes('GROWTH');
    const hasDirectUrl = schema.content.includes('directUrl');
    const hasGatewayId = schema.content.includes('gatewayPaymentId');
    const hasStripeId = schema.content.includes('stripeId');
    console.log('\n🗄️  schema.prisma:');
    console.log('   Has GROWTH enum:', hasGrowth ? '✅ YES' : '❌ NO');
    console.log('   Has directUrl:', hasDirectUrl ? '✅ YES' : '❌ NO');
    console.log('   Has gatewayPaymentId:', hasGatewayId ? '✅ YES' : '❌ NO');
    console.log('   Has old stripeId:', hasStripeId ? '⚠️  YES (needs rename)' : '✅ NO');
  }

  // Check deploy.yml
  const deploy = await getFile('.github/workflows/deploy.yml');
  if (deploy.found) {
    const hasRailwayUp = deploy.content.includes('railway up');
    const hasRailwayUpload = deploy.content.includes('railway upload');
    const hasPrismaGenerate = deploy.content.includes('prisma generate');
    console.log('\n⚙️  deploy.yml:');
    console.log('   Has railway up:', hasRailwayUp ? '✅ YES' : '❌ NO');
    console.log('   Has old railway upload:', hasRailwayUpload ? '⚠️  YES (needs fix)' : '✅ NO');
    console.log('   Has prisma generate:', hasPrismaGenerate ? '✅ YES' : '❌ NO');
  }

  // Check billing service
  const billing = await getFile('apps/api/src/billing/billing.service.ts');
  if (billing.found) {
    const hasGatewayId = billing.content.includes('gatewayPaymentId');
    const hasStripeId = billing.content.includes('stripeId:');
    console.log('\n💳 billing.service.ts:');
    console.log('   Uses gatewayPaymentId:', hasGatewayId ? '✅ YES' : '❌ NO');
    console.log('   Has old stripeId:', hasStripeId ? '⚠️  YES' : '✅ NO');
  }
}

main().catch(console.error);
