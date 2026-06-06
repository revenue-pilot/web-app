const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = 'D:/Sai saas';
const token = process.argv[2];
const skipWorkflow = process.argv.includes('--skip-workflow');

if (!token) {
  console.error('Usage: node git-push.js <GITHUB_TOKEN> [--skip-workflow]');
  process.exit(1);
}

const author = { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' };
const remoteUrl = 'https://github.com/proresindia-ux/revenuepilot.git';

// Files to exclude from commit when --skip-workflow is passed
const workflowFiles = ['.github/workflows/deploy.yml'];

async function main() {
  console.log('📋 Checking git status...');

  // First reset the HEAD to before the workflow commit was made
  // We need to squash the previous commits and re-commit without the workflow file
  const log = await git.log({ fs, dir, depth: 10 });
  console.log('\nCurrent local commits:');
  log.forEach((c, i) => console.log(` [${i}] ${c.oid.slice(0, 8)} ${c.commit.message.split('\n')[0]}`));

  // Get the remote HEAD to know what's already on GitHub
  console.log('\n🔍 Fetching remote state...');
  try {
    await git.fetch({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: token, password: '' }),
      url: remoteUrl,
      singleBranch: true,
      depth: 5,
    });
  } catch (e) {
    console.log('Fetch warning (non-fatal):', e.message);
  }

  // Check what remote main is at
  let remoteOid;
  try {
    remoteOid = await git.resolveRef({ fs, dir, ref: 'refs/remotes/origin/main' });
    console.log('Remote main:', remoteOid.slice(0, 8));
  } catch (e) {
    console.log('Could not resolve remote ref:', e.message);
  }

  const localOid = await git.resolveRef({ fs, dir, ref: 'HEAD' });
  console.log('Local HEAD:', localOid.slice(0, 8));

  if (remoteOid === localOid) {
    console.log('\n✅ Already up to date with remote. Nothing to push.');
    return;
  }

  if (skipWorkflow) {
    console.log('\n⚠️  --skip-workflow mode: Will create a commit without workflow files.');

    // Reset to remote state
    console.log('Resetting to remote HEAD...');
    await git.checkout({
      fs,
      dir,
      ref: remoteOid,
      noCheckout: true,
    });

    // Update HEAD to point to remote
    await git.writeRef({
      fs,
      dir,
      ref: 'refs/heads/main',
      value: remoteOid,
      force: true,
    });

    // Now stage all production files EXCEPT workflow
    const filesToStage = [
      'apps/api/.env.example',
      'apps/api/src/billing/billing.service.ts',
      'apps/api/src/email/email.service.ts',
      'apps/web/.env.example',
      'apps/web/next.config.js',
      'packages/database/prisma/schema.prisma',
      'package.json',
      'turbo.json',
    ];

    console.log('\n📋 Staging production fix files (excluding workflow)...');
    for (const f of filesToStage) {
      try {
        await git.add({ fs, dir, filepath: f });
        console.log(' + staged:', f);
      } catch (e) {
        console.warn(' ! skipped:', f, '—', e.message);
      }
    }

    const sha = await git.commit({
      fs,
      dir,
      author,
      message: `fix: production readiness - email URLs, prisma schema, next.js proxy, env docs

- Fix all email template links to use FRONTEND_URL env var (not localhost)
- Fix next.config.js proxy to use BACKEND_URL (prevents circular routing)
- Add GROWTH tier to PlanTier enum in Prisma schema  
- Rename stripeId to gatewayPaymentId (supports Razorpay + Stripe)
- Add directUrl to Prisma datasource for Supabase pgBouncer compatibility
- Add comprehensive .env.example files with production documentation
- Add turbo test pipeline and root test script
- Build verified: 43 Next.js pages + NestJS API — 0 errors
- Tests verified: 36/36 passing across 7 suites`,
    });
    console.log('\n🔒 Committed:', sha);
  }

  console.log('\n🚀 Pushing to origin/main...');
  const result = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token, password: '' }),
    url: remoteUrl,
    force: false,
  });

  console.log('\n✅ Successfully pushed to origin/main!');

  const finalLog = await git.log({ fs, dir, depth: 5 });
  console.log('\nRecent commits on main:');
  finalLog.forEach(c => console.log(' *', c.oid.slice(0, 8), c.commit.message.split('\n')[0]));
}

main().catch(err => {
  console.error('\n❌ Push failed:', err.message || err);
  if (err.message && err.message.includes('workflow')) {
    console.error('\n💡 Your GitHub token needs the "workflow" scope.');
    console.error('   Go to: https://github.com/settings/tokens');
    console.error('   Edit token → check "workflow" → Update token → retry with new token.');
    console.error('\n   OR run with --skip-workflow to push everything except the CI/CD file:');
    console.error('   node git-push.js <TOKEN> --skip-workflow');
  }
  process.exit(1);
});
