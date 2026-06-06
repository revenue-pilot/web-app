const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

const dir = 'D:/Sai saas';
const token = process.argv[2];

if (!token) {
  console.error('Usage: node push-workflow.js <GITHUB_TOKEN>');
  process.exit(1);
}

const author = { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' };
const remoteUrl = 'https://github.com/proresindia-ux/revenuepilot.git';

async function main() {
  // Restore the workflow file to the working tree (it was modified locally)
  console.log('📋 Staging .github/workflows/deploy.yml...');
  await git.add({ fs, dir, filepath: '.github/workflows/deploy.yml' });

  // Check if it's actually staged and different
  const matrix = await git.statusMatrix({ fs, dir });
  const workflowStatus = matrix.find(([f]) => f === '.github/workflows/deploy.yml');
  console.log('Workflow file status [head, workdir, index]:', workflowStatus ? workflowStatus.slice(1) : 'not found');

  if (!workflowStatus || workflowStatus[1] === workflowStatus[3]) {
    console.log('Nothing to commit for workflow file.');
  } else {
    const sha = await git.commit({
      fs,
      dir,
      author,
      message: `ci: fix GitHub Actions pipeline - railway up, prisma generate, env vars

- Fix railway command: 'railway upload' -> 'railway up --detach'
- Add 'npx prisma generate' step before running tests
- Add empty DATABASE_URL/DIRECT_URL env vars for CI build phase
- Improve test environment configuration`,
    });
    console.log('🔒 Committed:', sha);
  }

  console.log('\n🚀 Pushing to origin/main...');
  await git.push({
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

  const log = await git.log({ fs, dir, depth: 5 });
  console.log('\nRecent commits on main:');
  log.forEach(c => console.log(' *', c.oid.slice(0, 8), c.commit.message.split('\n')[0]));
}

main().catch(err => {
  console.error('\n❌ Error:', err.message || err);
  process.exit(1);
});
