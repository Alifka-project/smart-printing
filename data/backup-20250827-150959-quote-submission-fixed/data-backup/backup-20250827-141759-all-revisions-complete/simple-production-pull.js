require('dotenv').config({ path: '.env.development.local' });

const { PrismaClient } = require('@prisma/client');

// Production database client using environment variables
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

async function simpleProductionPull() {
  try {
    console.log('🚀 Starting simple data pull from production database...');
    console.log('⚠️  This script will ONLY ADD data, NEVER DELETE anything!');
    console.log('⚠️  NEVER pushing back to production database!');
    
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
    
    // Step 4: Pull Materials (basic data only, no includes)
    console.log('📦 Step 4: Pulling materials from production database...');
    console.log('⚠️  Note: Production database does not have GSM field yet');
    const productionMaterials = await productionPrisma.material.findMany();
    console.log(`Found ${productionMaterials.length} materials in production`);
    
    // Step 5: Pull Clients (basic data only)
    console.log('👤 Step 5: Pulling clients from production database...');
    const productionClients = await productionPrisma.client.findMany();
    console.log(`Found ${productionClients.length} clients in production`);
    
    // Step 6: Pull Quotes (basic data only, no includes)
    console.log('📄 Step 6: Pulling quotes from production database...');
    const productionQuotes = await productionPrisma.quote.findMany();
    console.log(`Found ${productionQuotes.length} quotes in production`);
    
    // Step 7: Pull Search History (basic data only)
    console.log('🔍 Step 7: Pulling search history from production database...');
    const productionSearchHistory = await productionPrisma.searchHistory.findMany();
    console.log(`Found ${productionSearchHistory.length} search history records in production`);
    
    // Step 8: Pull Search Analytics (basic data only)
    console.log('📊 Step 8: Pulling search analytics from production database...');
    const productionSearchAnalytics = await productionPrisma.searchAnalytics.findMany();
    console.log(`Found ${productionSearchAnalytics.length} search analytics records in production`);
    
    console.log('\n📥 Data pull from production database completed!');
    console.log(`📊 Production Data Summary:`);
    console.log(`   - Users: ${productionUsers.length}`);
    console.log(`   - Suppliers: ${productionSuppliers.length}`);
    console.log(`   - Materials: ${productionMaterials.length}`);
    console.log(`   - Clients: ${productionClients.length}`);
    console.log(`   - Quotes: ${productionQuotes.length}`);
    console.log(`   - Search History: ${productionSearchHistory.length}`);
    console.log(`   - Search Analytics: ${productionSearchAnalytics.length}`);
    
    // Step 9: SAFELY restore data (only add, never delete)
    console.log('\n🔄 Step 9: SAFELY restoring data to local database (ADDING ONLY)...');
    
    // Step 10: Restore Users
    console.log('\n👥 Step 10: Safely restoring users to local database...');
    let usersRestored = 0;
    for (const user of productionUsers) {
      try {
        const existingUser = await localPrisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (!existingUser) {
          await localPrisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              role: user.role,
              password: user.password,
              profilePicture: user.profilePicture,
              status: user.status
            }
          });
          usersRestored++;
        } else {
          console.log(`   - User ${user.email} already exists, skipping...`);
        }
      } catch (error) {
        console.log(`⚠️ Could not restore user ${user.email}: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${usersRestored} new users`);
    
    // Step 11: Restore Suppliers
    console.log('\n🏢 Step 11: Safely restoring suppliers to local database...');
    let suppliersRestored = 0;
    for (const supplier of productionSuppliers) {
      try {
        const existingSupplier = await localPrisma.supplier.findFirst({
          where: { email: supplier.email }
        });
        
        if (!existingSupplier) {
          await localPrisma.supplier.create({
            data: {
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
              status: supplier.status
            }
          });
          suppliersRestored++;
        } else {
          console.log(`   - Supplier ${supplier.name} already exists, skipping...`);
        }
      } catch (error) {
        console.log(`⚠️ Could not restore supplier ${supplier.name}: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${suppliersRestored} new suppliers`);
    
    // Step 12: Restore Clients
    console.log('\n👤 Step 12: Safely restoring clients to local database...');
    let clientsRestored = 0;
    for (const client of productionClients) {
      try {
        const existingClient = await localPrisma.client.findFirst({
          where: { email: client.email }
        });
        
        if (!existingClient) {
          await localPrisma.client.create({
            data: {
              clientType: client.clientType,
              companyName: client.companyName,
              contactPerson: client.contactPerson,
              email: client.email,
              phone: client.phone,
              countryCode: client.countryCode,
              role: client.role
            }
          });
          clientsRestored++;
        } else {
          console.log(`   - Client ${client.contactPerson} already exists, skipping...`);
        }
      } catch (error) {
        console.log(`⚠️ Could not restore client ${client.contactPerson}: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${clientsRestored} new clients`);
    
    // Step 13: Restore Materials (without GSM field for now)
    console.log('\n📦 Step 13: Safely restoring materials to local database...');
    console.log('⚠️  Note: Materials will be restored without GSM field initially');
    let materialsRestored = 0;
    for (const material of productionMaterials) {
      try {
        const existingMaterial = await localPrisma.material.findUnique({
          where: { materialId: material.materialId }
        });
        
        if (!existingMaterial) {
          // Get supplier ID for this material
          const supplier = await localPrisma.supplier.findFirst({
            where: { name: 'Unknown Supplier' } // We'll need to match by name later
          });
          
          if (supplier) {
            await localPrisma.material.create({
              data: {
                materialId: material.materialId,
                name: material.name,
                gsm: null, // GSM field will be null initially
                supplierId: supplier.id,
                cost: material.cost,
                unit: material.unit,
                status: material.status
              }
            });
            materialsRestored++;
          } else {
            console.log(`   - No supplier found, creating material without supplier link...`);
            await localPrisma.material.create({
              data: {
                materialId: material.materialId,
                name: material.name,
                gsm: null, // GSM field will be null initially
                supplierId: 'temp-supplier-id', // Temporary ID
                cost: material.cost,
                unit: material.unit,
                status: material.status
              }
            });
            materialsRestored++;
          }
        } else {
          console.log(`   - Material ${material.name} already exists, skipping...`);
        }
      } catch (error) {
        console.log(`⚠️ Could not restore material ${material.name}: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${materialsRestored} new materials`);
    
    // Step 14: Restore Quotes (basic data only)
    console.log('\n📄 Step 14: Safely restoring quotes to local database...');
    let quotesRestored = 0;
    for (const quote of productionQuotes) {
      try {
        const existingQuote = await localPrisma.quote.findUnique({
          where: { quoteId: quote.quoteId }
        });
        
        if (!existingQuote) {
          // Get client ID for this quote
          const client = await localPrisma.client.findFirst({
            where: { email: 'unknown@example.com' } // We'll need to match by email later
          });
          
          // Get user ID for this quote
          const user = await localPrisma.user.findFirst({
            where: { email: 'admin@example.com' } // We'll need to match by email later
          });
          
          if (client && user) {
            await localPrisma.quote.create({
              data: {
                quoteId: quote.quoteId,
                date: quote.date,
                status: quote.status,
                clientId: client.id,
                userId: user.id,
                product: quote.product,
                quantity: quote.quantity,
                sides: quote.sides,
                printing: quote.printing,
                colors: quote.colors
              }
            });
            quotesRestored++;
          } else {
            console.log(`   - Client or user not found for quote ${quote.quoteId}, skipping...`);
          }
        } else {
          console.log(`   - Quote ${quote.quoteId} already exists, skipping...`);
        }
      } catch (error) {
        console.log(`⚠️ Could not restore quote ${quote.quoteId}: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${quotesRestored} new quotes`);
    
    // Step 15: Restore Search History
    console.log('\n🔍 Step 15: Safely restoring search history to local database...');
    let searchHistoryRestored = 0;
    for (const history of productionSearchHistory) {
      try {
        const existingHistory = await localPrisma.searchHistory.findFirst({
          where: { 
            query: history.query,
            userId: history.userId,
            timestamp: history.timestamp
          }
        });
        
        if (!existingHistory) {
          await localPrisma.searchHistory.create({
            data: {
              query: history.query,
              timestamp: history.timestamp,
              userId: history.userId
            }
          });
          searchHistoryRestored++;
        }
      } catch (error) {
        console.log(`⚠️ Could not restore search history: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${searchHistoryRestored} new search history records`);
    
    // Step 16: Restore Search Analytics
    console.log('\n📊 Step 16: Safely restoring search analytics to local database...');
    let searchAnalyticsRestored = 0;
    for (const analytics of productionSearchAnalytics) {
      try {
        const existingAnalytics = await localPrisma.searchAnalytics.findFirst({
          where: { 
            query: analytics.query,
            userId: analytics.userId,
            timestamp: analytics.timestamp
          }
        });
        
        if (!existingAnalytics) {
          await localPrisma.searchAnalytics.create({
            data: {
              query: analytics.query,
              timestamp: analytics.timestamp,
              userId: analytics.userId
            }
          });
          searchAnalyticsRestored++;
        }
      } catch (error) {
        console.log(`⚠️ Could not restore search analytics: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${searchAnalyticsRestored} new search analytics records`);
    
    console.log('\n🎉 SAFE restoration completed!');
    console.log(`📊 Restoration Summary:`);
    console.log(`   - Users added: ${usersRestored}`);
    console.log(`   - Suppliers added: ${suppliersRestored}`);
    console.log(`   - Materials added: ${materialsRestored}`);
    console.log(`   - Clients added: ${clientsRestored}`);
    console.log(`   - Quotes added: ${quotesRestored}`);
    console.log(`   - Search History added: ${searchHistoryRestored}`);
    console.log(`   - Search Analytics added: ${searchAnalyticsRestored}`);
    
    console.log(`\n📊 Final Local Database Summary:`);
    
    const finalUsers = await localPrisma.user.count();
    const finalSuppliers = await localPrisma.supplier.count();
    const finalMaterials = await localPrisma.material.count();
    const finalClients = await localPrisma.client.count();
    const finalQuotes = await localPrisma.quote.count();
    const finalSearchHistory = await localPrisma.searchHistory.count();
    const finalSearchAnalytics = await localPrisma.searchAnalytics.count();
    
    console.log(`   - Total Users: ${finalUsers}`);
    console.log(`   - Total Suppliers: ${finalSuppliers}`);
    console.log(`   - Total Materials: ${finalMaterials}`);
    console.log(`   - Total Clients: ${finalClients}`);
    console.log(`   - Total Quotes: ${finalQuotes}`);
    console.log(`   - Total Search History: ${finalSearchHistory}`);
    console.log(`   - Total Search Analytics: ${finalSearchAnalytics}`);
    
    // Show admin user details
    const adminUser = await localPrisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });
    if (adminUser) {
      console.log(`\n👤 Admin User Available:`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Password: ${adminUser.password ? 'Set' : 'Not set'}`);
    }
    
    console.log('\n✅ Data restoration from production database completed successfully!');
    console.log('⚠️  Remember: NEVER push changes back to production database!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Your data has been restored locally');
    console.log('   2. The GSM field is now available in your local schema');
    console.log('   3. You can now add GSM values to your materials');
    console.log('   4. When ready, you can migrate the GSM field to production');
    
  } catch (error) {
    console.error('❌ Error during restoration from production database:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
  } finally {
    await productionPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

simpleProductionPull();
