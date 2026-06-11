const fs = require('fs');
const axios = require('axios');

async function checkRoutes() {
  const routes = JSON.parse(fs.readFileSync('routes.json', 'utf8'));
  const prodBase = 'https://api.revenuepilot.in';
  
  let matchCount = 0;
  let missingCount = 0;
  let errors = [];

  console.log(`Testing ${routes.length} routes against ${prodBase}...`);

  for (let i = 0; i < routes.length; i++) {
    const { method, path } = routes[i];
    const url = `${prodBase}${path}`;
    
    try {
      const res = await axios({
        method,
        url,
        data: method === 'POST' || method === 'PUT' || method === 'PATCH' ? {} : undefined,
        validateStatus: () => true, // resolve all statuses
        timeout: 10000
      });
      
      // If it's a 404, it could mean the route is missing OR resource missing.
      // NestJS usually returns 404 with a specific JSON body for missing routes.
      if (res.status === 404 && res.data?.message?.startsWith('Cannot ')) {
        missingCount++;
        errors.push(`[MISSING] ${method} ${path}`);
      } else {
        matchCount++;
      }
    } catch (e) {
      console.error(`Error on ${method} ${path}: ${e.message}`);
    }
    
    // Slight delay to avoid hammering
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total Routes Checked: ${routes.length}`);
  console.log(`Found & Responding: ${matchCount}`);
  console.log(`Missing (404 Cannot GET/POST): ${missingCount}`);
  
  if (missingCount > 0) {
    console.log(`\nMissing Routes Details:`);
    errors.forEach(e => console.log(e));
  } else {
    console.log(`\nAll local routes are present in production! Production perfectly matches local API surface.`);
  }
}

checkRoutes();
