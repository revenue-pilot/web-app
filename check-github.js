const https = require('https');

const token = process.argv[2];
const owner = 'proresindia-ux';
const repo = 'revenuepilot';

function githubGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GrowthPilot-CI/1.0',
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Get latest commit
  const branchRes = await githubGet(`/repos/${owner}/${repo}/branches/main`);
  if (branchRes.status !== 200) {
    console.error('Branch check failed:', branchRes.status, JSON.stringify(branchRes.body));
    return;
  }
  
  const latestSha = branchRes.body.commit.sha;
  console.log('Latest commit on GitHub main:', latestSha.slice(0, 8));
  console.log('Commit message:', branchRes.body.commit.commit.message.split('\n')[0]);

  // Check if workflow file exists
  const workflowRes = await githubGet(`/repos/${owner}/${repo}/contents/.github%2Fworkflows%2Fdeploy.yml`);
  console.log('\nWorkflow file status:', workflowRes.status);
  if (workflowRes.status === 200) {
    const content = Buffer.from(workflowRes.body.content, 'base64').toString();
    console.log('Workflow first 3 lines:');
    content.split('\n').slice(0, 3).forEach(l => console.log(' ', l));
    console.log('File size:', workflowRes.body.size, 'bytes');
    
    // Check if it has railway up --detach
    if (content.includes('railway up')) {
      console.log('\n✅ Workflow file IS updated (contains "railway up")');
    } else if (content.includes('railway upload')) {
      console.log('\n⚠️  Workflow file is OLD (still has "railway upload")');
    }
  } else {
    console.log('Workflow file NOT found on GitHub');
  }
  
  // List recent commits
  const commitsRes = await githubGet(`/repos/${owner}/${repo}/commits?per_page=5`);
  console.log('\nRecent commits on GitHub:');
  if (commitsRes.status === 200) {
    commitsRes.body.forEach(c => {
      console.log(' *', c.sha.slice(0, 8), c.commit.message.split('\n')[0]);
    });
  }
}

main().catch(console.error);
