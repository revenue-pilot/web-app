const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = 'D:/Sai saas';
const token = process.argv[2];

if (!token) {
  console.error('Usage: node force-push-workflow.js <GITHUB_TOKEN>');
  process.exit(1);
}

const author = { name: 'GrowthPilot CI', email: 'ci@growthpilot.com' };
const remoteUrl = 'https://github.com/proresindia-ux/revenuepilot.git';

async function main() {
  // Read the current deploy.yml content from disk
  const workflowPath = '.github/workflows/deploy.yml';
  const absPath = path.join(dir, workflowPath);
  const content = fs.readFileSync(absPath);
  console.log('deploy.yml on disk size:', content.length, 'bytes');
  console.log('First line:', content.toString().split('\n')[0]);

  // Get the blob SHA that git has stored for this file  
  const headCommit = await git.resolveRef({ fs, dir, ref: 'HEAD' });
  const { tree } = await git.readCommit({ fs, dir, oid: headCommit });
  
  // Walk tree to find the workflow file's current blob
  const treeData = await git.readTree({ fs, dir, oid: tree });
  console.log('\nRoot tree entries:', treeData.tree.map(e => e.path));
  
  // Check .github dir
  const githubEntry = treeData.tree.find(e => e.path === '.github');
  if (githubEntry) {
    const githubTree = await git.readTree({ fs, dir, oid: githubEntry.oid });
    console.log('.github entries:', githubTree.tree.map(e => e.path));
    const workflowsEntry = githubTree.tree.find(e => e.path === 'workflows');
    if (workflowsEntry) {
      const workflowsTree = await git.readTree({ fs, dir, oid: workflowsEntry.oid });
      console.log('workflows entries:', workflowsTree.tree.map(e => e.path));
      const deployEntry = workflowsTree.tree.find(e => e.path === 'deploy.yml');
      if (deployEntry) {
        const blob = await git.readBlob({ fs, dir, oid: deployEntry.oid });
        const storedContent = Buffer.from(blob.blob);
        console.log('\nStored in git:', storedContent.length, 'bytes');
        console.log('Disk vs git match:', content.equals(storedContent));
        
        if (content.equals(storedContent)) {
          console.log('\n✅ The workflow file in git already matches disk — nothing to commit!');
          console.log('The updated deploy.yml is already captured in commit b8acb07d.');
          
          // Just verify we are in sync with remote and push if needed
          console.log('\n🚀 Verifying remote is in sync...');
          await git.push({
            fs, http, dir,
            remote: 'origin', ref: 'main',
            onAuth: () => ({ username: token, password: '' }),
            url: remoteUrl,
          });
          console.log('✅ Remote is up to date!');
          return;
        }
      }
    }
  }
  
  // Force-add the workflow file by writing it to git object store directly
  console.log('\n📋 Force-staging deploy.yml...');
  
  // Write blob to object store
  const blobOid = await git.writeBlob({ fs, dir, blob: content });
  console.log('New blob SHA:', blobOid);
  
  // Use git.add which should pick up the diff now
  await git.add({ fs, dir, filepath: workflowPath });
  
  const matrix = await git.statusMatrix({ fs, dir });
  const wf = matrix.find(([f]) => f === workflowPath);
  console.log('After force-add, status:', wf);
  
  if (!wf || (wf[1] === wf[2] && wf[2] === wf[3])) {
    console.log('Still shows as unchanged. The git blob already matches disk content.');
    console.log('This means the workflow was already committed correctly in a prior commit.');
  } else {
    const sha = await git.commit({
      fs, dir, author,
      message: 'ci: fix GitHub Actions - railway up --detach, prisma generate step',
    });
    console.log('🔒 Committed:', sha);
    
    console.log('\n🚀 Pushing...');
    await git.push({
      fs, http, dir,
      remote: 'origin', ref: 'main',
      onAuth: () => ({ username: token, password: '' }),
      url: remoteUrl,
    });
    console.log('✅ Pushed!');
  }
  
  // Show final log
  const log = await git.log({ fs, dir, depth: 3 });
  console.log('\nRecent commits:');
  log.forEach(c => console.log(' *', c.oid.slice(0, 8), c.commit.message.split('\n')[0]));
}

main().catch(err => {
  console.error('\n❌ Error:', err.message || err);
  process.exit(1);
});
