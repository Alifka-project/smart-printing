const { PrismaClient } = require('@prisma/client');

// Prisma Accelerate (Production) database client
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xc0dkeFdBOTFuNW1jNWZTNkpUczAiLCJhcGlfa2V5IjoiMDFLMzRRTVFYTVhDR0VaMkFBS1lTMFo3RUMiLCJ0ZW5hbnRfaWQiOiJjOTFjODU2MWZlOGI2YjM0YTU5ODVmMTdhYzU2NGNhMzY3OTY5ZmU5Mjg1NTdjNGM0ZjZiNWJjNzgwNzMzMjgxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY4OWUzMTItMDE4OC00ZjE4LWFhMGQtYTc1OWVhN2EzNGE5In0.lPVxsK7w4PqWlM7f5ErZ-LE7ixz4nL1rVMJIRttzRqs'
    }
  }
});

async function testConnection() {
  try {
    console.log('🔌 Testing connection to Prisma Accelerate database...');
    
    // Test basic connection
    console.log('📊 Testing basic connection...');
    const userCount = await productionPrisma.user.count();
    console.log(`✅ Connection successful! Found ${userCount} users`);
    
    // Test suppliers
    console.log('🏢 Testing suppliers...');
    const supplierCount = await productionPrisma.supplier.count();
    console.log(`✅ Suppliers: ${supplierCount}`);
    
    // Test materials
    console.log('📦 Testing materials...');
    const materialCount = await productionPrisma.material.count();
    console.log(`✅ Materials: ${materialCount}`);
    
    // Test clients
    console.log('👤 Testing clients...');
    const clientCount = await productionPrisma.client.count();
    console.log(`✅ Clients: ${clientCount}`);
    
    // Test quotes
    console.log('📄 Testing quotes...');
    const quoteCount = await productionPrisma.quote.count();
    console.log(`✅ Quotes: ${quoteCount}`);
    
    console.log('\n🎉 All connection tests passed!');
    console.log(`📊 Database Summary:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Suppliers: ${supplierCount}`);
    console.log(`   - Materials: ${materialCount}`);
    console.log(`   - Clients: ${clientCount}`);
    console.log(`   - Quotes: ${quoteCount}`);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
  } finally {
    await productionPrisma.$disconnect();
  }
}

testConnection();
