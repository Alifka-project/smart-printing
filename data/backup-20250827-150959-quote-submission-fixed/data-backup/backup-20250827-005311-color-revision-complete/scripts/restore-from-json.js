const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Local database client
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
    }
  }
});

async function restoreFromJson() {
  try {
    console.log('🚀 Starting data restoration from JSON files...');
    console.log('⚠️  This script will restore data to your LOCAL database only!');
    
    const dataDir = path.join(__dirname, '..', 'data', 'production-backup');
    
    if (!fs.existsSync(dataDir)) {
      console.error('❌ Data directory not found. Please run the production pull script first.');
      return;
    }
    
    // Step 1: Restore Users
    console.log('\n👥 Step 1: Restoring users from JSON...');
    const usersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
    let usersRestored = 0;
    
    for (const user of usersData) {
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
    
    // Step 2: Restore Suppliers
    console.log('\n🏢 Step 2: Restoring suppliers from JSON...');
    const suppliersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'suppliers.json'), 'utf8'));
    let suppliersRestored = 0;
    
    for (const supplier of suppliersData) {
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
    
    // Step 3: Restore Clients
    console.log('\n👤 Step 3: Restoring clients from JSON...');
    const clientsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'clients.json'), 'utf8'));
    let clientsRestored = 0;
    
    for (const client of clientsData) {
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
    
    // Step 4: Restore Materials (with GSM field set to null initially)
    console.log('\n📦 Step 4: Restoring materials from JSON...');
    console.log('⚠️  Note: Materials will be restored with GSM field set to null initially');
    const materialsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'materials.json'), 'utf8'));
    let materialsRestored = 0;
    
    for (const material of materialsData) {
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
                gsm: null, // GSM field will be null initially
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
    
    // Step 5: Restore Quotes
    console.log('\n📄 Step 5: Restoring quotes from JSON...');
    const quotesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'quotes.json'), 'utf8'));
    let quotesRestored = 0;
    
    for (const quote of quotesData) {
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
                colors: quote.colors || null
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
    
    // Step 6: Restore Search History
    console.log('\n🔍 Step 6: Restoring search history from JSON...');
    const searchHistoryData = JSON.parse(fs.readFileSync(path.join(dataDir, 'search-history.json'), 'utf8'));
    let searchHistoryRestored = 0;
    
    for (const history of searchHistoryData) {
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
    
    console.log('\n🎉 Data restoration completed!');
    console.log(`📊 Restoration Summary:`);
    console.log(`   - Users added: ${usersRestored}`);
    console.log(`   - Suppliers added: ${suppliersRestored}`);
    console.log(`   - Materials added: ${materialsRestored}`);
    console.log(`   - Clients added: ${clientsRestored}`);
    console.log(`   - Quotes added: ${quotesRestored}`);
    console.log(`   - Search History added: ${searchHistoryRestored}`);
    
    console.log(`\n📊 Final Local Database Summary:`);
    
    const finalUsers = await localPrisma.user.count();
    const finalSuppliers = await localPrisma.supplier.count();
    const finalMaterials = await localPrisma.material.count();
    const finalClients = await localPrisma.client.count();
    const finalQuotes = await localPrisma.quote.count();
    const finalSearchHistory = await localPrisma.searchHistory.count();
    
    console.log(`   - Total Users: ${finalUsers}`);
    console.log(`   - Total Suppliers: ${finalSuppliers}`);
    console.log(`   - Total Materials: ${finalMaterials}`);
    console.log(`   - Total Clients: ${finalClients}`);
    console.log(`   - Total Quotes: ${finalQuotes}`);
    console.log(`   - Total Search History: ${finalSearchHistory}`);
    
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
    
    console.log('\n✅ Data restoration from JSON files completed successfully!');
    console.log('🎯 Your local database is now fully restored with production data!');
    console.log('📝 Next Steps:');
    console.log('   1. Your data has been fully restored locally');
    console.log('   2. The GSM field is now available in your local schema');
    console.log('   3. You can now add GSM values to your materials');
    console.log('   4. When ready, you can migrate the GSM field to production');
    
  } catch (error) {
    console.error('❌ Error during data restoration:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

restoreFromJson();
