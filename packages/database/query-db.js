const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying database tables for search terms...');
  
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${logs.length} audit logs:`);
    for (const log of logs) {
      console.log(` - Action: ${log.action}, Details: ${log.details}`);
    }
  } catch (e) {
    console.error('Error querying audit logs:', e.message);
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      take: 20,
    });
    console.log(`Found ${campaigns.length} campaigns:`);
    for (const c of campaigns) {
      console.log(` - Name: ${c.name}, Status: ${c.status}`);
    }
  } catch (e) {
    console.error('Error querying campaigns:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
