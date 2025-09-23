import { PrismaClient } from '@prisma/client';

console.log('🔍 Testing Local Database Connection...\n');

const localPrisma = new PrismaClient();

try {
  console.log('📊 Testing Prisma ORM methods...');
  
  // Test using Prisma ORM
  const userCount = await localPrisma.user.count();
  const clientCount = await localPrisma.client.count();
  const quoteCount = await localPrisma.quote.count();
  
  console.log(`   Users (ORM): ${userCount}`);
  console.log(`   Clients (ORM): ${clientCount}`);
  console.log(`   Quotes (ORM): ${quoteCount}`);
  
} catch (ormError) {
  console.log(`   ❌ ORM error: ${ormError.message}`);
}

try {
  console.log('\n📊 Testing Raw SQL queries...');
  
  // Test using raw SQL
  const userCountRaw = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
  const clientCountRaw = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Client"`;
  const quoteCountRaw = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Quote"`;
  
  console.log(`   Users (Raw): ${userCountRaw[0].count}`);
  console.log(`   Clients (Raw): ${clientCountRaw[0].count}`);
  console.log(`   Quotes (Raw): ${quoteCountRaw[0].count}`);
  
} catch (rawError) {
  console.log(`   ❌ Raw SQL error: ${rawError.message}`);
}

try {
  console.log('\n📊 Testing direct table access...');
  
  // Test direct table access
  const users = await localPrisma.$queryRaw`SELECT * FROM "User" LIMIT 3`;
  const clients = await localPrisma.$queryRaw`SELECT * FROM "Client" LIMIT 3`;
  const quotes = await localPrisma.$queryRaw`SELECT * FROM "Quote" LIMIT 3`;
  
  console.log(`   Sample Users: ${users.length}`);
  console.log(`   Sample Clients: ${clients.length}`);
  console.log(`   Sample Quotes: ${quotes.length}`);
  
  if (users.length > 0) {
    console.log(`   First User: ${users[0].name} (${users[0].email})`);
  }
  
} catch (directError) {
  console.log(`   ❌ Direct access error: ${directError.message}`);
}

await localPrisma.$disconnect();
console.log('\n✅ Test completed');
