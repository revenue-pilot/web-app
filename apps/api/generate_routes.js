const fs = require('fs');
const path = require('path');

function findControllers(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findControllers(fullPath, fileList);
    } else if (file.endsWith('.controller.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const controllers = findControllers(path.join(__dirname, 'src'));
const routes = [];

controllers.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const controllerMatch = content.match(/@Controller\(['"](.+?)['"]\)/);
  if (!controllerMatch) return;
  const basePath = controllerMatch[1];

  const methodRegex = /@(Get|Post|Put|Patch|Delete)\(['"]?(.*?)['"]?\)/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    let subPath = match[2] || '';
    
    // Sometimes subPath has trailing/leading slashes or none
    let fullPath = `/${basePath}/${subPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
    
    // Replace dynamic params like :id with a placeholder
    fullPath = fullPath.replace(/:[a-zA-Z]+/g, '123');

    routes.push({ method, path: fullPath });
  }
});

fs.writeFileSync('routes.json', JSON.stringify(routes, null, 2));
console.log(`Extracted ${routes.length} routes.`);
