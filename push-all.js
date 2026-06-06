const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = 'D:/Sai saas';
const token = process.argv[2];

if (!token) {
  console.error('Usage: node push-all.js <GITHUB_TOKEN>');
  process.exit(1);
}

const author = { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' };
const remoteUrl = 'https://github.com/proresindia-ux/revenuepilot.git';

async function main() {
  // Get full status matrix
  const matrix = await git.statusMatrix({ fs, dir });
  
  console.log('Full git status:');
  matrix.forEach(([f, head, workdir, index]) => {
    const status = head === 0 ? 'NEW' : workdir === 0 ? 'DEL' : workdir !== index ? 'MOD' : workdir !== head ? 'STAGED' : 'OK';
    if (status !== 'OK') console.log(` [${status}] ${f} (h=${head} w=${workdir} i=${index})`);
  });

  // Stage ALL changed files including workflow
  const toStage = matrix.filter(([f, h, w, i]) => w !== i || w !== h);
  
  if (toStage.length > 0) {
    console.log('\nStaging', toStage.length, 'files...');
    for (const [filepath, head, workdir] of toStage) {
      if (workdir === 0) {
        await git.remove({ fs, dir, filepath });
        console.log(' - removed:', filepath);
      } else {
        await git.add({ fs, dir, filepath });
        console.log(' + added:', filepath);
      }
    }
    
    const sha = await git.commit({
      fs, dir, author,
      message: 'ci: fix GitHub Actions pipeline\n\n- Fix railway upload -> railway up --detach\n- Add prisma generate step\n- Fix env vars for CI build',
    });
    console.log('\n🔒 Committed:', sha);
  } else {
    console.log('\nAll files already committed locally.');
  }

  console.log('\n🚀 Pushing to origin/main...');
  const pushResult = await git.push({
    fs, http, dir,
    remote: 'origin', ref: 'main',
    onAuth: () => ({ username: token, password: '' }),
    url: remoteUrl,
    force: false,
  });
  
  console.log('Push result:', JSON.stringify(pushResult));
  console.log('\n✅ Done!');

  const log = await git.log({ fs, dir, depth: 4 });
  console.log('\nRecent commits on main:');
  log.forEach(c => console.log(' *', c.oid.slice(0, 8), c.commit.message.split('\n')[0]));
}

main().catch(err => {
  console.error('\n❌ Error:', err.message || err);
  process.exit(1);
});
