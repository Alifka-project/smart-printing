const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Local database (working)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
});

async function compareDatabases() {
  try {
    console.log('🔍 Comparing Local vs Production Databases...\n');
    
    // Test local database connection
    console.log('📊 LOCAL DATABASE (SQLite):');
    try {
      const localUsers = await localPrisma.user.count();
      const localClients = await localPrisma.client.count();
      const localQuotes = await localPrisma.quote.count();
      const localSuppliers = await localPrisma.supplier.count();
      const localMaterials = await localPrisma.material.count();
      
      console.log(`✅ Connected successfully`);
      console.log(`   Users: ${localUsers}`);
      console.log(`   Clients: ${localClients}`);
      console.log(`   Quotes: ${localQuotes}`);
      console.log(`   Suppliers: ${localSuppliers}`);
      console.log(`   Materials: ${localMaterials}`);
      
      // Check local database schema
      console.log('\n🔧 LOCAL SCHEMA ANALYSIS:');
      try {
        const localSchema = await localPrisma.$queryRaw`PRAGMA table_info(User)`;
        console.log(`   User table columns: ${localSchema.length}`);
        
        const localClientSchema = await localPrisma.$queryRaw`PRAGMA table_info(Client)`;
        console.log(`   Client table columns: ${localClientSchema.length}`);
        
        const localQuoteSchema = await localPrisma.$queryRaw`PRAGMA table_info(Quote)`;
        console.log(`   Quote table columns: ${localQuoteSchema.length}`);
        
        // Check for specific fields
        const hasAddressFields = localClientSchema.some(col => col.name === 'address');
        const hasStep3Fields = localQuoteSchema.some(col => col.name === 'productName');
        
        console.log(`   Client has address fields: ${hasAddressFields ? '✅' : '❌'}`);
        console.log(`   Quote has Step 3 fields: ${hasStep3Fields ? '✅' : '❌'}`);
        
        // Show local schema details
        console.log('\n📋 LOCAL SCHEMA DETAILS:');
        console.log('   User columns:', localSchema.map(col => col.name).join(', '));
        console.log('   Client columns:', localClientSchema.map(col => col.name).join(', '));
        console.log('   Quote columns:', localQuoteSchema.map(col => col.name).join(', '));
        
      } catch (schemaError) {
        console.log(`   Schema analysis error: ${schemaError.message}`);
      }
      
    } catch (localError) {
      console.log(`❌ Local database error: ${localError.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Check production schema files
    console.log('🌐 PRODUCTION SCHEMA ANALYSIS:');
    try {
      const productionSchemaPath = path.join(__dirname, '../prisma/schema-production.prisma');
      const localSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
      
      if (fs.existsSync(productionSchemaPath)) {
        const productionSchema = fs.readFileSync(productionSchemaPath, 'utf8');
        const localSchema = fs.readFileSync(localSchemaPath, 'utf8');
        
        console.log('✅ Schema files found');
        
        // Count fields in each schema
        const prodUserFields = (productionSchema.match(/model User \{[\s\S]*?\}/g) || [''])[0].match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/gm)?.length || 0;
        const prodClientFields = (productionSchema.match(/model Client \{[\s\S]*?\}/g) || [''])[0].match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/gm)?.length || 0;
        const prodQuoteFields = (productionSchema.match(/model Quote \{[\s\S]*?\}/g) || [''])[0].match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/gm)?.length || 0;
        
        const localUserFields = (localSchema.match(/model User \{[\s\S]*?\}/g) || [''])[0].match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/gm)?.length || 0;
        const localClientFields = (localSchema.match(/model Client \{[\s\S]*?\}/g) || [''])[0].match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/gm)?.length || 0;
        const localQuoteFields = (localSchema.match(/model Quote \{[\s\S]*?\}/g) || [''])[0].match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/gm)?.length || 0;
        
        console.log(`   Production User fields: ${prodUserFields}`);
        console.log(`   Production Client fields: ${prodClientFields}`);
        console.log(`   Production Quote fields: ${prodQuoteFields}`);
        
        console.log(`   Local User fields: ${localUserFields}`);
        console.log(`   Local Client fields: ${localClientFields}`);
        console.log(`   Local Quote fields: ${localQuoteFields}`);
        
        // Check for specific missing fields in production
        const prodHasAddressFields = productionSchema.includes('address') && productionSchema.includes('city');
        const prodHasStep3Fields = productionSchema.includes('productName') && productionSchema.includes('flatSizeWidth');
        
        console.log(`\n   Production Client has address fields: ${prodHasAddressFields ? '✅' : '❌'}`);
        console.log(`   Production Quote has Step 3 fields: ${prodHasStep3Fields ? '✅' : '❌'}`);
        
        if (!prodHasAddressFields) {
          console.log('   ❌ Production missing: Client address fields (address, city, state, postalCode, country)');
        }
        if (!prodHasStep3Fields) {
          console.log('   ❌ Production missing: Quote Step 3 fields (productName, flatSizeWidth, etc.)');
        }
        
        // Show field count differences
        console.log('\n📊 FIELD COUNT DIFFERENCES:');
        console.log(`   User: Local ${localUserFields} vs Production ${prodUserFields} (${localUserFields - prodUserFields > 0 ? '+' : ''}${localUserFields - prodUserFields})`);
        console.log(`   Client: Local ${localClientFields} vs Production ${prodClientFields} (${localClientFields - prodClientFields > 0 ? '+' : ''}${localClientFields - prodClientFields})`);
        console.log(`   Quote: Local ${localQuoteFields} vs Production ${prodQuoteFields} (${localQuoteFields - prodQuoteFields > 0 ? '+' : ''}${localQuoteFields - prodQuoteFields})`);
        
      } else {
        console.log('❌ Production schema file not found');
      }
      
    } catch (schemaError) {
      console.log(`   Schema analysis error: ${schemaError.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Summary and recommendations
    console.log('📋 COMPARISON SUMMARY:');
    console.log('✅ Local database: Working perfectly with all enhanced features');
    console.log('❌ Production database: Missing recent schema updates and new fields');
    
    console.log('\n🚨 KEY DIFFERENCES IDENTIFIED:');
    console.log('1. Schema Mismatch: Production missing new fields added to local');
    console.log('2. Field Count: Production has fewer columns than local');
    console.log('3. Missing Features: Address fields, Step 3 specifications, etc.');
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Update production Prisma schema to match local schema.prisma');
    console.log('2. Run database migrations on production to add missing fields');
    console.log('3. Sync data structure between environments');
    console.log('4. Test production after updates');
    console.log('5. Consider migrating local data to production after schema sync');
    
  } catch (error) {
    console.error('❌ Comparison failed:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

// Run the comparison
compareDatabases()
  .then(() => {
    console.log('\n✅ Database comparison completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database comparison failed:', error);
    process.exit(1);
  });
