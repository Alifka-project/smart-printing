const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.production' });

// Production database client
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Local database client
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function pullFromProduction() {
  try {
    console.log('🚀 Starting data pull from production database...');
    
    // Step 1: Pull Users from Production
    console.log('👥 Step 1: Pulling users from production...');
    const productionUsers = await productionPrisma.user.findMany();
    console.log(`Found ${productionUsers.length} users in production`);
    
    // Step 2: Pull Suppliers from Production
    console.log('🏢 Step 2: Pulling suppliers from production...');
    const productionSuppliers = await productionPrisma.supplier.findMany();
    console.log(`Found ${productionSuppliers.length} suppliers in production`);
    
    // Step 3: Pull Materials from Production (with GSM field)
    console.log('📦 Step 3: Pulling materials from production...');
    const productionMaterials = await productionPrisma.material.findMany({
      include: {
        supplier: true
      }
    });
    console.log(`Found ${productionMaterials.length} materials in production`);
    
    // Step 4: Pull Clients from Production
    console.log('👤 Step 4: Pulling clients from production...');
    const productionClients = await productionPrisma.client.findMany();
    console.log(`Found ${productionClients.length} clients in production`);
    
    // Step 5: Pull Quotes from Production
    console.log('📄 Step 5: Pulling quotes from production...');
    const productionQuotes = await productionPrisma.quote.findMany({
      include: {
        papers: true,
        finishing: true,
        amounts: true,
        operational: true
      }
    });
    console.log(`Found ${productionQuotes.length} quotes in production`);
    
    // Step 6: Pull Search History from Production
    console.log('🔍 Step 6: Pulling search history from production...');
    const productionSearchHistory = await productionPrisma.searchHistory.findMany();
    console.log(`Found ${productionSearchHistory.length} search history records in production`);
    
    // Step 7: Pull Search Analytics from Production
    console.log('📊 Step 7: Pulling search analytics from production...');
    const productionSearchAnalytics = await productionPrisma.searchAnalytics.findMany();
    console.log(`Found ${productionSearchAnalytics.length} search analytics records in production`);
    
    console.log('\n📥 Data pull from production completed!');
    console.log(`📊 Production Data Summary:`);
    console.log(`   - Users: ${productionUsers.length}`);
    console.log(`   - Suppliers: ${productionSuppliers.length}`);
    console.log(`   - Materials: ${productionMaterials.length}`);
    console.log(`   - Clients: ${productionClients.length}`);
    console.log(`   - Quotes: ${productionQuotes.length}`);
    console.log(`   - Search History: ${productionSearchHistory.length}`);
    console.log(`   - Search Analytics: ${productionSearchAnalytics.length}`);
    
    // Step 8: Clear local database and restore production data
    console.log('\n🔄 Step 8: Clearing local database and restoring production data...');
    
    // Clear local database
    await localPrisma.searchAnalytics.deleteMany();
    await localPrisma.searchHistory.deleteMany();
    await localPrisma.quoteOperational.deleteMany();
    await localPrisma.quoteAmount.deleteMany();
    await localPrisma.finishing.deleteMany();
    await localPrisma.paper.deleteMany();
    await localPrisma.quote.deleteMany();
    await localPrisma.material.deleteMany();
    await localPrisma.client.deleteMany();
    await localPrisma.supplier.deleteMany();
    await localPrisma.user.deleteMany();
    
    console.log('✅ Local database cleared');
    
    // Step 9: Restore Users
    console.log('\n👥 Step 9: Restoring users to local database...');
    for (const user of productionUsers) {
      await localPrisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          password: user.password,
          profilePicture: user.profilePicture,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    console.log(`✅ Restored ${productionUsers.length} users`);
    
    // Step 10: Restore Suppliers
    console.log('\n🏢 Step 10: Restoring suppliers to local database...');
    for (const supplier of productionSuppliers) {
      await localPrisma.supplier.create({
        data: {
          id: supplier.id,
          name: supplier.name,
          contact: supplier.contact,
          email: supplier.email,
          phone: supplier.phone,
          countryCode: supplier.countryCode,
          address: supplier.address,
          city: supplier.city,
          state: supplier.state,
          postalCode: supplier.postalCode,
          country: supplier.country,
          status: supplier.status,
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt
        }
      });
    }
    console.log(`✅ Restored ${productionSuppliers.length} suppliers`);
    
    // Step 11: Restore Clients
    console.log('\n👤 Step 11: Restoring clients to local database...');
    for (const client of productionClients) {
      await localPrisma.client.create({
        data: {
          id: client.id,
          clientType: client.clientType,
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          countryCode: client.countryCode,
          role: client.role,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        }
      });
    }
    console.log(`✅ Restored ${productionClients.length} clients`);
    
    // Step 12: Restore Materials (with GSM field)
    console.log('\n📦 Step 12: Restoring materials to local database...');
    for (const material of productionMaterials) {
      await localPrisma.material.create({
        data: {
          id: material.id,
          materialId: material.materialId,
          name: material.name,
          gsm: material.gsm, // This should now work with the GSM field
          supplierId: material.supplierId,
          cost: material.cost,
          unit: material.unit,
          status: material.status,
          lastUpdated: material.lastUpdated,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt
        }
      });
    }
    console.log(`✅ Restored ${productionMaterials.length} materials`);
    
    // Step 13: Restore Quotes and related data
    console.log('\n📄 Step 13: Restoring quotes and related data to local database...');
    for (const quote of productionQuotes) {
      // Create quote
      await localPrisma.quote.create({
        data: {
          id: quote.id,
          quoteId: quote.quoteId,
          date: quote.date,
          status: quote.status,
          clientId: quote.clientId,
          userId: quote.userId,
          product: quote.product,
          quantity: quote.quantity,
          sides: quote.sides,
          printing: quote.printing,
          colors: quote.colors,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt
        }
      });
      
      // Create papers
      for (const paper of quote.papers) {
        await localPrisma.paper.create({
          data: {
            id: paper.id,
            name: paper.name,
            gsm: paper.gsm,
            quoteId: paper.quoteId,
            inputWidth: paper.inputWidth,
            inputHeight: paper.inputHeight,
            pricePerPacket: paper.pricePerPacket,
            pricePerSheet: paper.pricePerSheet,
            sheetsPerPacket: paper.sheetsPerPacket,
            recommendedSheets: paper.recommendedSheets,
            enteredSheets: paper.enteredSheets,
            outputWidth: paper.outputWidth,
            outputHeight: paper.outputHeight,
            selectedColors: paper.selectedColors
          }
        });
      }
      
      // Create finishing
      for (const finishing of quote.finishing) {
        await localPrisma.finishing.create({
          data: {
            id: finishing.id,
            name: finishing.name,
            quoteId: finishing.quoteId,
            cost: finishing.cost
          }
        });
      }
      
      // Create quote amounts
      if (quote.amounts) {
        await localPrisma.quoteAmount.create({
          data: {
            id: quote.amounts.id,
            base: quote.amounts.base,
            vat: quote.amounts.vat,
            total: quote.amounts.total,
            quoteId: quote.amounts.quoteId
          }
        });
      }
      
      // Create quote operational
      if (quote.operational) {
        await localPrisma.quoteOperational.create({
          data: {
            id: quote.operational.id,
            quoteId: quote.operational.quoteId,
            plates: quote.operational.plates,
            units: quote.operational.units,
            createdAt: quote.operational.createdAt,
            updatedAt: quote.operational.updatedAt
          }
        });
      }
    }
    console.log(`✅ Restored ${productionQuotes.length} quotes and related data`);
    
    // Step 14: Restore Search History
    console.log('\n🔍 Step 14: Restoring search history to local database...');
    for (const history of productionSearchHistory) {
      await localPrisma.searchHistory.create({
        data: {
          id: history.id,
          query: history.query,
          timestamp: history.timestamp,
          userId: history.userId
        }
      });
    }
    console.log(`✅ Restored ${productionSearchHistory.length} search history records`);
    
    // Step 15: Restore Search Analytics
    console.log('\n📊 Step 15: Restoring search analytics to local database...');
    for (const analytics of productionSearchAnalytics) {
      await localPrisma.searchAnalytics.create({
        data: {
          id: analytics.id,
          query: analytics.query,
          timestamp: analytics.timestamp,
          userId: analytics.userId
        }
      });
    }
    console.log(`✅ Restored ${productionSearchAnalytics.length} search analytics records`);
    
    console.log('\n🎉 Production data successfully restored to local database!');
    console.log(`📊 Final Local Database Summary:`);
    
    const finalUsers = await localPrisma.user.count();
    const finalSuppliers = await localPrisma.supplier.count();
    const finalMaterials = await localPrisma.material.count();
    const finalClients = await localPrisma.client.count();
    const finalQuotes = await localPrisma.quote.count();
    const finalSearchHistory = await localPrisma.searchHistory.count();
    const finalSearchAnalytics = await localPrisma.searchAnalytics.count();
    
    console.log(`   - Users: ${finalUsers}`);
    console.log(`   - Suppliers: ${finalSuppliers}`);
    console.log(`   - Materials: ${finalMaterials}`);
    console.log(`   - Clients: ${finalClients}`);
    console.log(`   - Quotes: ${finalQuotes}`);
    console.log(`   - Search History: ${finalSearchHistory}`);
    console.log(`   - Search Analytics: ${finalSearchAnalytics}`);
    
    // Show admin user details
    const adminUser = await localPrisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });
    if (adminUser) {
      console.log(`\n👤 Admin User Restored:`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Password: ${adminUser.password ? 'Set' : 'Not set'}`);
    }
    
  } catch (error) {
    console.error('❌ Error pulling from production:', error);
  } finally {
    await productionPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

pullFromProduction();
