const https = require('https');
const fs = require('fs');
const path = require('path');

const token = process.argv[2];
const owner = 'proresindia-ux';
const repo = 'revenuepilot';
const dir = 'D:/Sai saas';

if (!token) { console.error('Usage: node push-migrations.js <TOKEN>'); process.exit(1); }

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
  if (!fs.existsSync(localPath)) {
    console.log(` ⏭  skip (not found): ${filepath}`);
    return false;
  }
  const content = fs.readFileSync(localPath);
  const base64Content = content.toString('base64');
  const currentSha = await getFileSha(filepath);
  const body = {
    message: `chore: add Prisma baseline migration and migration lock file`,
    content: base64Content,
    branch: 'main',
    committer: { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' },
    author: { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' },
  };
  if (currentSha) body.sha = currentSha;
  const encoded = filepath.replace(/\//g, '%2F');
  const res = await apiRequest('PUT', `/repos/${owner}/${repo}/contents/${encoded}`, body);
  if (res.status === 200 || res.status === 201) {
    console.log(` ✅ ${res.status === 201 ? 'created' : 'updated'}: ${filepath}`);
    return true;
  } else {
    console.error(` ❌ failed (${res.status}): ${filepath} — ${res.body.message || ''}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Pushing Prisma migration files to GitHub...\n');
  const files = [
    'packages/database/prisma/migrations/migration_lock.toml',
    'packages/database/prisma/migrations/0001_baseline_init/migration.sql',
  ];
  let ok = 0;
  for (const f of files) {
    const result = await pushFile(f);
    if (result) ok++;
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`\n📊 Results: ${ok}/${files.length} pushed`);

  // Verify
  const branch = await apiRequest('GET', `/repos/${owner}/${repo}/branches/main`);
  if (branch.status === 200) {
    console.log('\n✅ GitHub main HEAD:', branch.body.commit.sha.slice(0, 8));
    console.log('   Message:', branch.body.commit.commit.message.split('\n')[0]);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
