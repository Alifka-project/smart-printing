const { PrismaClient } = require('@prisma/client');

// Generate Prisma client with production schema
const { execSync } = require('child_process');

console.log('🔧 Generating Prisma client with production schema...');
try {
  execSync('npx prisma generate --schema=prisma/schema-production.prisma', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Import the generated client
const { PrismaClient: ProductionPrismaClient } = require('@prisma/client');

// Production database client
const productionPrisma = new ProductionPrismaClient({
  datasources: {
    db: {
      url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xc0dkeFdBOTFuNW1jNWZTNkpUczAiLCJhcGlfa2V5IjoiMDFLMzRRTVFYTVhDR0VaMkFBS1lTMFo3RUMiLCJ0ZW5hbnRfaWQiOiJjOTFjODU2MWZlOGI2YjM0YTU5ODVmMTdhYzU2NGNhMzY3OTY5ZmU5Mjg1NTdjNGM0ZjZiNWJjNzgwNzMzMjgxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY4OWUzMTItMDE4OC00ZjE4LWFhMGQtYTc1OWVhN2EzNGE5In0.lPVxsK7w4PqWlM7f5ErZ-LE7ixz4nL1rVMJIRttzRqs'
    }
  }
});

// Local database client (using original schema)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function pullFromProductionWithSchema() {
  try {
    console.log('🚀 Starting data pull from Prisma Accelerate database...');
    console.log('⚠️  This script will ONLY ADD data, NEVER DELETE anything!');
    console.log('⚠️  NEVER pushing back to production database!');
    
    // Step 1: Pull Users from Production Database
    console.log('👥 Step 1: Pulling users from production database...');
    const productionUsers = await productionPrisma.user.findMany();
    console.log(`Found ${productionUsers.length} users in production`);
    
    // Step 2: Pull Suppliers from Production Database
    console.log('🏢 Step 2: Pulling suppliers from production database...');
    const productionSuppliers = await productionPrisma.supplier.findMany();
    console.log(`Found ${productionSuppliers.length} suppliers in production`);
    
    // Step 3: Pull Materials from Production Database (with GSM field)
    console.log('📦 Step 3: Pulling materials from production database...');
    const productionMaterials = await productionPrisma.material.findMany({
      include: {
        supplier: true
      }
    });
    console.log(`Found ${productionMaterials.length} materials in production`);
    
    // Step 4: Pull Clients from Production Database
    console.log('👤 Step 4: Pulling clients from production database...');
    const productionClients = await productionPrisma.client.findMany();
    console.log(`Found ${productionClients.length} clients in production`);
    
    // Step 5: Pull Quotes from Production Database
    console.log('📄 Step 5: Pulling quotes from production database...');
    const productionQuotes = await productionPrisma.quote.findMany({
      include: {
        papers: true,
        finishing: true,
        amounts: true,
        operational: true
      }
    });
    console.log(`Found ${productionQuotes.length} quotes in production`);
    
    // Step 6: Pull Search History from Production Database
    console.log('🔍 Step 6: Pulling search history from production database...');
    const productionSearchHistory = await productionPrisma.searchHistory.findMany();
    console.log(`Found ${productionSearchHistory.length} search history records in production`);
    
    // Step 7: Pull Search Analytics from Production Database
    console.log('📊 Step 7: Pulling search analytics from production database...');
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
    
    // Step 8: SAFELY restore data (only add, never delete)
    console.log('\n🔄 Step 8: SAFELY restoring data to local database (ADDING ONLY)...');
    
    // Step 9: Restore Users (only if they don't exist)
    console.log('\n👥 Step 9: Safely restoring users to local database...');
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
    
    // Step 10: Restore Suppliers (only if they don't exist)
    console.log('\n🏢 Step 10: Safely restoring suppliers to local database...');
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
    
    // Step 11: Restore Clients (only if they don't exist)
    console.log('\n👤 Step 11: Safely restoring clients to local database...');
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
    
    // Step 12: Restore Materials (with GSM field)
    console.log('\n📦 Step 12: Safely restoring materials to local database...');
    let materialsRestored = 0;
    for (const material of productionMaterials) {
      try {
        const existingMaterial = await localPrisma.material.findUnique({
          where: { materialId: material.materialId }
        });
        
        if (!existingMaterial) {
          // Get supplier ID for this material
          const supplier = await localPrisma.supplier.findFirst({
            where: { name: material.supplier?.name || 'Unknown Supplier' }
          });
          
          if (supplier) {
            await localPrisma.material.create({
              data: {
                materialId: material.materialId,
                name: material.name,
                gsm: material.gsm, // This should now work with the GSM field
                supplierId: supplier.id,
                cost: material.cost,
                unit: material.unit,
                status: material.status
              }
            });
            materialsRestored++;
          } else {
            console.log(`   - Supplier not found for material ${material.name}, skipping...`);
          }
        } else {
          console.log(`   - Material ${material.name} already exists, skipping...`);
        }
      } catch (error) {
        console.log(`⚠️ Could not restore material ${material.name}: ${error.message}`);
      }
    }
    console.log(`✅ Restored ${materialsRestored} new materials`);
    
    // Step 13: Restore Quotes and related data
    console.log('\n📄 Step 13: Safely restoring quotes to local database...');
    let quotesRestored = 0;
    for (const quote of productionQuotes) {
      try {
        const existingQuote = await localPrisma.quote.findUnique({
          where: { quoteId: quote.quoteId }
        });
        
        if (!existingQuote) {
          // Get client ID for this quote
          const client = await localPrisma.client.findFirst({
            where: { email: quote.client?.email || 'unknown@example.com' }
          });
          
          // Get user ID for this quote
          const user = await localPrisma.user.findFirst({
            where: { email: quote.user?.email || 'admin@example.com' }
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
    
    // Step 14: Restore Search History
    console.log('\n🔍 Step 14: Safely restoring search history to local database...');
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
    
    // Step 15: Restore Search Analytics
    console.log('\n📊 Step 15: Safely restoring search analytics to local database...');
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
    
    console.log('\n✅ Data restoration from Prisma Accelerate completed successfully!');
    console.log('⚠️  Remember: NEVER push changes back to production database!');
    
  } catch (error) {
    console.error('❌ Error during restoration from Prisma Accelerate:', error);
  } finally {
    await productionPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

pullFromProductionWithSchema();
