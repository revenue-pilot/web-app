const git = require('isomorphic-git');
const fs = require('fs');

const dir = 'D:/Sai saas';

async function main() {
  const matrix = await git.statusMatrix({ fs, dir });
  const changed = matrix.filter(([f, h, w, i]) => w !== i);
  console.log('Changed files:', changed.length);
  changed.forEach(([f]) => console.log(' +', f));
  
  const log = await git.log({ fs, dir, depth: 3 });
  console.log('\nRecent commits:');
  log.forEach(c => console.log(' *', c.oid.slice(0, 8), c.commit.message.split('\n')[0]));
}

main().catch(console.error);
