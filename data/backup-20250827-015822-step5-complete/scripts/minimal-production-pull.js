require('dotenv').config({ path: '.env.development.local' });

// Import the Prisma client generated from exact production schema
const { PrismaClient } = require('@prisma/client');

// Production database client using environment variables
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function minimalProductionPull() {
  try {
    console.log('🚀 Starting minimal production data pull...');
    console.log('⚠️  This script will ONLY pull data from production, NEVER push back!');
    
    console.log(`🔌 Using database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    
    // Step 1: Test connection and pull basic data
    console.log('🔌 Testing connection to production database...');
    const userCount = await productionPrisma.user.count();
    console.log(`✅ Connection successful! Found ${userCount} users`);
    
    // Step 2: Pull Users (basic data only)
    console.log('👥 Step 2: Pulling users from production database...');
    const productionUsers = await productionPrisma.user.findMany();
    console.log(`Found ${productionUsers.length} users in production`);
    
    // Step 3: Pull Suppliers (basic data only)
    console.log('🏢 Step 3: Pulling suppliers from production database...');
    const productionSuppliers = await productionPrisma.supplier.findMany();
    console.log(`Found ${productionSuppliers.length} suppliers in production`);
    
    // Step 4: Pull Materials (basic data only, no GSM field)
    console.log('📦 Step 4: Pulling materials from production database...');
    console.log('⚠️  Note: Production database does not have GSM field yet');
    const productionMaterials = await productionPrisma.material.findMany();
    console.log(`Found ${productionMaterials.length} materials in production`);
    
    // Step 5: Pull Clients (basic data only)
    console.log('👤 Step 5: Pulling clients from production database...');
    const productionClients = await productionPrisma.client.findMany();
    console.log(`Found ${productionClients.length} clients in production`);
    
    // Step 6: Try to pull Quotes with minimal fields
    console.log('📄 Step 6: Attempting to pull quotes from production database...');
    let productionQuotes = [];
    try {
      // Try with minimal fields first
      productionQuotes = await productionPrisma.quote.findMany({
        select: {
          id: true,
          quoteId: true,
          date: true,
          status: true,
          clientId: true,
          userId: true,
          product: true,
          quantity: true,
          sides: true,
          printing: true,
          createdAt: true,
          updatedAt: true
        }
      });
      console.log(`Found ${productionQuotes.length} quotes in production`);
    } catch (error) {
      console.log(`⚠️ Could not pull quotes: ${error.message}`);
      console.log('   - Skipping quotes for now');
    }
    
    // Step 7: Try to pull Search History
    console.log('🔍 Step 7: Attempting to pull search history from production database...');
    let productionSearchHistory = [];
    try {
      productionSearchHistory = await productionPrisma.searchHistory.findMany();
      console.log(`Found ${productionSearchHistory.length} search history records in production`);
    } catch (error) {
      console.log(`⚠️ Could not pull search history: ${error.message}`);
      console.log('   - Skipping search history for now');
    }
    
    // Step 8: Try to pull Search Analytics
    console.log('📊 Step 8: Attempting to pull search analytics from production database...');
    let productionSearchAnalytics = [];
    try {
      productionSearchAnalytics = await productionPrisma.searchAnalytics.findMany();
      console.log(`Found ${productionSearchAnalytics.length} search analytics records in production`);
    } catch (error) {
      console.log(`⚠️ Could not pull search analytics: ${error.message}`);
      console.log('   - Skipping search analytics for now');
    }
    
    console.log('\n📥 Data pull from production database completed!');
    console.log(`📊 Production Data Summary:`);
    console.log(`   - Users: ${productionUsers.length}`);
    console.log(`   - Suppliers: ${productionSuppliers.length}`);
    console.log(`   - Materials: ${productionMaterials.length}`);
    console.log(`   - Clients: ${productionClients.length}`);
    console.log(`   - Quotes: ${productionQuotes.length}`);
    console.log(`   - Search History: ${productionSearchHistory.length}`);
    console.log(`   - Search Analytics: ${productionSearchAnalytics.length}`);
    
    // Step 9: Show sample data for verification
    console.log('\n📋 Sample Data Verification:');
    
    if (productionUsers.length > 0) {
      console.log('\n👤 Sample User:');
      console.log(`   - Email: ${productionUsers[0].email}`);
      console.log(`   - Name: ${productionUsers[0].name}`);
      console.log(`   - Role: ${productionUsers[0].role}`);
    }
    
    if (productionSuppliers.length > 0) {
      console.log('\n🏢 Sample Supplier:');
      console.log(`   - Name: ${productionSuppliers[0].name}`);
      console.log(`   - Email: ${productionSuppliers[0].email}`);
      console.log(`   - Contact: ${productionSuppliers[0].contact || 'N/A'}`);
    }
    
    if (productionMaterials.length > 0) {
      console.log('\n📦 Sample Material:');
      console.log(`   - ID: ${productionMaterials[0].materialId}`);
      console.log(`   - Name: ${productionMaterials[0].name}`);
      console.log(`   - Cost: ${productionMaterials[0].cost}`);
      console.log(`   - Unit: ${productionMaterials[0].unit}`);
    }
    
    if (productionClients.length > 0) {
      console.log('\n👤 Sample Client:');
      console.log(`   - Contact Person: ${productionClients[0].contactPerson}`);
      console.log(`   - Company: ${productionClients[0].companyName || 'N/A'}`);
      console.log(`   - Email: ${productionClients[0].email}`);
    }
    
    if (productionQuotes.length > 0) {
      console.log('\n📄 Sample Quote:');
      console.log(`   - Quote ID: ${productionQuotes[0].quoteId}`);
      console.log(`   - Product: ${productionQuotes[0].product}`);
      console.log(`   - Quantity: ${productionQuotes[0].quantity}`);
      console.log(`   - Status: ${productionQuotes[0].status}`);
    }
    
    console.log('\n🎉 Production data pull completed successfully!');
    console.log('⚠️  Remember: NEVER push changes back to production database!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Production data has been successfully pulled');
    console.log('   2. Your local database is now fresh and ready');
    console.log('   3. You can now manually restore this data to your local database');
    console.log('   4. The GSM field is available in your local schema');
    
    // Step 10: Export data to JSON files for manual restoration
    console.log('\n💾 Exporting data to JSON files for manual restoration...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data', 'production-backup');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Export users
    fs.writeFileSync(
      path.join(dataDir, 'users.json'),
      JSON.stringify(productionUsers, null, 2)
    );
    console.log('   ✅ Users exported to data/production-backup/users.json');
    
    // Export suppliers
    fs.writeFileSync(
      path.join(dataDir, 'suppliers.json'),
      JSON.stringify(productionSuppliers, null, 2)
    );
    console.log('   ✅ Suppliers exported to data/production-backup/suppliers.json');
    
    // Export materials
    fs.writeFileSync(
      path.join(dataDir, 'materials.json'),
      JSON.stringify(productionMaterials, null, 2)
    );
    console.log('   ✅ Materials exported to data/production-backup/materials.json');
    
    // Export clients
    fs.writeFileSync(
      path.join(dataDir, 'clients.json'),
      JSON.stringify(productionClients, null, 2)
    );
    console.log('   ✅ Clients exported to data/production-backup/clients.json');
    
    // Export quotes if available
    if (productionQuotes.length > 0) {
      fs.writeFileSync(
        path.join(dataDir, 'quotes.json'),
        JSON.stringify(productionQuotes, null, 2)
      );
      console.log('   ✅ Quotes exported to data/production-backup/quotes.json');
    }
    
    // Export search history if available
    if (productionSearchHistory.length > 0) {
      fs.writeFileSync(
        path.join(dataDir, 'search-history.json'),
        JSON.stringify(productionSearchHistory, null, 2)
      );
      console.log('   ✅ Search History exported to data/production-backup/search-history.json');
    }
    
    // Export search analytics if available
    if (productionSearchAnalytics.length > 0) {
      fs.writeFileSync(
        path.join(dataDir, 'search-analytics.json'),
        JSON.stringify(productionSearchAnalytics, null, 2)
      );
      console.log('   ✅ Search Analytics exported to data/production-backup/search-analytics.json');
    }
    
    console.log('\n📁 All data has been exported to data/production-backup/ directory');
    console.log('🔧 You can now manually restore this data to your local database');
    
  } catch (error) {
    console.error('❌ Error during production data pull:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
  } finally {
    await productionPrisma.$disconnect();
  }
}

minimalProductionPull();
