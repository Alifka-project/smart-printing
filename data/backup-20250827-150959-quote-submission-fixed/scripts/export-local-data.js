const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Use the local SQLite database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function exportLocalData() {
  try {
    console.log('🚀 Starting local database export...');
    
    // Export Users
    console.log('📤 Exporting users...');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    // Export Clients
    console.log('📤 Exporting clients...');
    const clients = await prisma.client.findMany();
    console.log(`Found ${clients.length} clients`);
    
    // Export Quotes
    console.log('📤 Exporting quotes...');
    const quotes = await prisma.quote.findMany({
      include: {
        papers: true,
        finishing: true,
        amounts: true
      }
    });
    console.log(`Found ${quotes.length} quotes`);
    
    // Export Suppliers
    console.log('📤 Exporting suppliers...');
    const suppliers = await prisma.supplier.findMany();
    console.log(`Found ${suppliers.length} suppliers`);
    
    // Export Materials
    console.log('📤 Exporting materials...');
    const materials = await prisma.material.findMany();
    console.log(`Found ${materials.length} materials`);
    
    // Export Search History
    console.log('📤 Exporting search history...');
    const searchHistory = await prisma.searchHistory.findMany();
    console.log(`Found ${searchHistory.length} search history records`);
    
    // Export Search Analytics
    console.log('📤 Exporting search analytics...');
    const searchAnalytics = await prisma.searchAnalytics.findMany();
    console.log(`Found ${searchAnalytics.length} search analytics records`);
    
    // Create export data object
    const exportData = {
      exportDate: new Date().toISOString(),
      users,
      clients,
      quotes,
      suppliers,
      materials,
      searchHistory,
      searchAnalytics
    };
    
    // Save to file
    const exportPath = path.join(__dirname, '../data/local-database-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Export completed! Data saved to: ${exportPath}`);
    console.log(`📊 Export Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - Quotes: ${quotes.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Materials: ${materials.length}`);
    console.log(`   - Search History: ${searchHistory.length}`);
    console.log(`   - Search Analytics: ${searchAnalytics.length}`);
    
    // Show admin user details
    const adminUser = users.find(u => u.email === 'admin@example.com');
    if (adminUser) {
      console.log(`\n👤 Admin User Found:`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Password: ${adminUser.password ? 'Set' : 'Not set'}`);
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportLocalData();
