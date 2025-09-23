const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testing database connection with env variable...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!');
    
    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const quoteCount = await prisma.quote.count();
    
    console.log(`📊 Data counts:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Clients: ${clientCount}`);
    console.log(`   - Quotes: ${quoteCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
