const https = require('https');
const fs = require('fs');
const path = require('path');

const token = process.argv[2];
const owner = 'proresindia-ux';
const repo = 'revenuepilot';
const dir = 'D:/Sai saas';

if (!token) { console.error('Usage: node api-push.js <TOKEN>'); process.exit(1); }

// Files to push with their local paths
const files = [
  'apps/api/src/email/email.service.ts',
  'apps/api/src/billing/billing.service.ts',
  'apps/api/.env.example',
  'apps/web/next.config.js',
  'apps/web/.env.example',
  'packages/database/prisma/schema.prisma',
  'package.json',
  'turbo.json',
  '.github/workflows/deploy.yml',
  'apps/api/.eslintrc.js',
  'apps/web/.eslintrc.json',
];

function apiRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GrowthPilot-CI',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      }
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getFileSha(filepath) {
  const encoded = filepath.replace(/\//g, '%2F');
  const res = await apiRequest('GET', `/repos/${owner}/${repo}/contents/${encoded}`);
  if (res.status === 200) return res.body.sha;
  return null;
}

async function pushFile(filepath) {
  const localPath = path.join(dir, filepath);
  const content = fs.readFileSync(localPath);
  const base64Content = content.toString('base64');
  
  // Get current file SHA from GitHub (needed for updates)
  const currentSha = await getFileSha(filepath);
  
  const body = {
    message: `fix: production readiness update - ${path.basename(filepath)}`,
    content: base64Content,
    branch: 'main',
    committer: { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' },
    author: { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' },
  };
  
  if (currentSha) body.sha = currentSha; // Required for file updates
  
  const encoded = filepath.replace(/\//g, '%2F');
  const res = await apiRequest('PUT', `/repos/${owner}/${repo}/contents/${encoded}`, body);
  
  if (res.status === 200 || res.status === 201) {
    const action = res.status === 201 ? 'created' : 'updated';
    console.log(` ✅ ${action}: ${filepath}`);
    return true;
  } else {
    console.error(` ❌ failed (${res.status}): ${filepath}`, res.body.message || '');
    return false;
  }
}

async function main() {
  console.log('🚀 Pushing production fixes to GitHub via API...\n');
  
  let success = 0, failed = 0;
  for (const file of files) {
    try {
      const ok = await pushFile(file);
      if (ok) success++; else failed++;
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(` ❌ error: ${file} -`, e.message);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${success} updated, ${failed} failed`);
  
  // Verify the push worked
  console.log('\n🔍 Verifying GitHub state...');
  const branch = await apiRequest('GET', `/repos/${owner}/${repo}/branches/main`);
  if (branch.status === 200) {
    console.log('Latest commit:', branch.body.commit.sha.slice(0, 8));
    console.log('Message:', branch.body.commit.commit.message.split('\n')[0]);
  }
  
  // Quick check on email service
  const emailRes = await apiRequest('GET', `/repos/${owner}/${repo}/contents/apps%2Fapi%2Fsrc%2Femail%2Femail.service.ts`);
  if (emailRes.status === 200) {
    const content = Buffer.from(emailRes.body.content, 'base64').toString();
    console.log('\n✅ email.service.ts uses FRONTEND_URL:', content.includes('FRONTEND_URL'));
    console.log('✅ schema.prisma has GROWTH enum: checking...');
  }
  
  const schemaRes = await apiRequest('GET', `/repos/${owner}/${repo}/contents/packages%2Fdatabase%2Fprisma%2Fschema.prisma`);
  if (schemaRes.status === 200) {
    const content = Buffer.from(schemaRes.body.content, 'base64').toString();
    console.log('✅ schema.prisma has GROWTH:', content.includes('GROWTH'));
    console.log('✅ schema.prisma has directUrl:', content.includes('directUrl'));
    console.log('✅ schema.prisma has gatewayPaymentId:', content.includes('gatewayPaymentId'));
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
