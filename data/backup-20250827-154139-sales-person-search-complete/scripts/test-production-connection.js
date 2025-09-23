import { PrismaClient } from '@prisma/client';

async function testProductionConnection() {
  console.log('🔍 Testing Production Database Connection...');
  console.log('=' .repeat(50));
  
  // This will use the DATABASE_URL from env.production if it's loaded
  const prisma = new PrismaClient();
  
  try {
    console.log('📡 Attempting to connect to database...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log(`✅ Connected successfully! Found ${userCount} users`);
    
    // Test client data
    const clientCount = await prisma.client.count();
    console.log(`✅ Client table accessible! Found ${clientCount} clients`);
    
    if (clientCount > 0) {
      // Get a sample client
      const sampleClient = await prisma.client.findFirst({
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          email: true,
          status: true
        }
      });
      
      console.log('\n🔍 Sample Client Data:');
      console.log('   ID:', sampleClient.id);
      console.log('   Company:', sampleClient.companyName || 'N/A');
      console.log('   Contact:', sampleClient.contactPerson);
      console.log('   Email:', sampleClient.email);
      console.log('   Status:', sampleClient.status);
    }
    
    // Test supplier data
    const supplierCount = await prisma.supplier.count();
    console.log(`✅ Supplier table accessible! Found ${supplierCount} suppliers`);
    
    // Test quote data
    const quoteCount = await prisma.quote.count();
    console.log(`✅ Quote table accessible! Found ${quoteCount} quotes`);
    
    console.log('\n🎉 All database connections successful!');
    console.log('   Your application should be able to display data correctly.');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if DATABASE_URL is set correctly');
    console.log('   2. Verify the production database is accessible');
    console.log('   3. Check if Prisma schema matches the database');
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Current DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProductionConnection();
