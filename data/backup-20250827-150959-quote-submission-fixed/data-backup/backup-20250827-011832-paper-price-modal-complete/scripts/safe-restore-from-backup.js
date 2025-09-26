require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Local database client only - NEVER production
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function safeRestoreFromBackup() {
  try {
    console.log('🔄 Starting SAFE restoration from backup files...');
    console.log('⚠️  This script will ONLY ADD data, NEVER DELETE anything!');
    console.log('⚠️  Working ONLY with local database - NO production access!');
    console.log('⚠️  Using backup files from data/production-backup/ directory');
    
    const backupDir = path.join(__dirname, '..', 'data', 'production-backup');
    
    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      throw new Error('Backup directory not found!');
    }
    
    console.log(`📁 Backup directory found: ${backupDir}`);
    
    // Step 1: Restore Users
    console.log('\n👥 Step 1: Restoring users from backup...');
    const usersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'users.json'), 'utf8'));
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
          console.log(`   ✅ Added user: ${user.email} (${user.name})`);
        } else {
          console.log(`   ⏭️  User already exists: ${user.email}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore user ${user.email}: ${error.message}`);
      }
    }
    console.log(`✅ Users restored: ${usersRestored} new users added`);
    
    // Step 2: Restore Suppliers
    console.log('\n🏢 Step 2: Restoring suppliers from backup...');
    const suppliersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'suppliers.json'), 'utf8'));
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
          console.log(`   ✅ Added supplier: ${supplier.name}`);
        } else {
          console.log(`   ⏭️  Supplier already exists: ${supplier.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore supplier ${supplier.name}: ${error.message}`);
      }
    }
    console.log(`✅ Suppliers restored: ${suppliersRestored} new suppliers added`);
    
    // Step 3: Restore Clients
    console.log('\n👤 Step 3: Restoring clients from backup...');
    const clientsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'clients.json'), 'utf8'));
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
          console.log(`   ✅ Added client: ${client.contactPerson} (${client.companyName || 'Individual'})`);
        } else {
          console.log(`   ⏭️  Client already exists: ${client.contactPerson}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore client ${client.contactPerson}: ${error.message}`);
      }
    }
    console.log(`✅ Clients restored: ${clientsRestored} new clients added`);
    
    // Step 4: Restore Materials with GSM extraction
    console.log('\n📦 Step 4: Restoring materials from backup with GSM extraction...');
    const materialsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'materials.json'), 'utf8'));
    let materialsRestored = 0;
    
    for (const material of materialsData) {
      try {
        const existingMaterial = await localPrisma.material.findUnique({
          where: { materialId: material.materialId }
        });
        
        if (!existingMaterial) {
          // Extract GSM from material name if available
          let gsmValue = null;
          if (material.name && material.name.includes('gsm')) {
            const gsmMatch = material.name.match(/(\d+)\s*gsm/i);
            if (gsmMatch) {
              gsmValue = gsmMatch[1];
              console.log(`   📏 Extracted GSM: ${gsmValue} from "${material.name}"`);
            }
          }
          
          // Find supplier by name
          const supplier = await localPrisma.supplier.findFirst({
            where: { name: { contains: material.supplierId } }
          });
          
          if (supplier) {
            await localPrisma.material.create({
              data: {
                materialId: material.materialId,
                name: material.name,
                gsm: gsmValue, // Use extracted GSM or null
                supplierId: supplier.id,
                cost: material.cost,
                unit: material.unit,
                status: material.status
              }
            });
            materialsRestored++;
            console.log(`   ✅ Added material: ${material.name} (GSM: ${gsmValue || 'Not specified'})`);
          } else {
            console.log(`   ⚠️  Supplier not found for material ${material.name}, skipping...`);
          }
        } else {
          console.log(`   ⏭️  Material already exists: ${material.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore material ${material.name}: ${error.message}`);
      }
    }
    console.log(`✅ Materials restored: ${materialsRestored} new materials added`);
    
    // Step 5: Restore Quotes
    console.log('\n📄 Step 5: Restoring quotes from backup...');
    const quotesData = JSON.parse(fs.readFileSync(path.join(backupDir, 'quotes.json'), 'utf8'));
    let quotesRestored = 0;
    
    for (const quote of quotesData) {
      try {
        const existingQuote = await localPrisma.quote.findUnique({
          where: { quoteId: quote.quoteId }
        });
        
        if (!existingQuote) {
          // Find client by email
          const client = await localPrisma.client.findFirst({
            where: { email: quote.client?.email || 'unknown@example.com' }
          });
          
          // Find user by email
          const user = await localPrisma.user.findFirst({
            where: { email: quote.user?.email || 'admin@example.com' }
          });
          
          if (client && user) {
            await localPrisma.quote.create({
              data: {
                quoteId: quote.quoteId,
                date: new Date(quote.date),
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
            console.log(`   ✅ Added quote: ${quote.quoteId} for ${client.contactPerson}`);
          } else {
            console.log(`   ⚠️  Client or user not found for quote ${quote.quoteId}, skipping...`);
          }
        } else {
          console.log(`   ⏭️  Quote already exists: ${quote.quoteId}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore quote ${quote.quoteId}: ${error.message}`);
      }
    }
    console.log(`✅ Quotes restored: ${quotesRestored} new quotes added`);
    
    // Step 6: Restore Search History
    console.log('\n🔍 Step 6: Restoring search history from backup...');
    const searchHistoryData = JSON.parse(fs.readFileSync(path.join(backupDir, 'search-history.json'), 'utf8'));
    let searchHistoryRestored = 0;
    
    for (const history of searchHistoryData) {
      try {
        const existingHistory = await localPrisma.searchHistory.findFirst({
          where: { 
            query: history.query,
            userId: history.userId,
            timestamp: new Date(history.timestamp)
          }
        });
        
        if (!existingHistory) {
          await localPrisma.searchHistory.create({
            data: {
              query: history.query,
              timestamp: new Date(history.timestamp),
              userId: history.userId
            }
          });
          searchHistoryRestored++;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore search history: ${error.message}`);
      }
    }
    console.log(`✅ Search history restored: ${searchHistoryRestored} new records added`);
    
    // Step 7: Restore Search Analytics
    console.log('\n📊 Step 7: Restoring search analytics from backup...');
    const searchAnalyticsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'search-analytics.json'), 'utf8'));
    let searchAnalyticsRestored = 0;
    
    for (const analytics of searchAnalyticsData) {
      try {
        const existingAnalytics = await localPrisma.searchAnalytics.findFirst({
          where: { 
            query: analytics.query,
            userId: analytics.userId,
            timestamp: new Date(analytics.timestamp)
          }
        });
        
        if (!existingAnalytics) {
          await localPrisma.searchAnalytics.create({
            data: {
              query: analytics.query,
              timestamp: new Date(analytics.timestamp),
              userId: analytics.userId
            }
          });
          searchAnalyticsRestored++;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore search analytics: ${error.message}`);
      }
    }
    console.log(`✅ Search analytics restored: ${searchAnalyticsRestored} new records added`);
    
    // Final summary
    console.log('\n🎉 SAFE restoration completed successfully!');
    console.log(`📊 Restoration Summary:`);
    console.log(`   - Users added: ${usersRestored}`);
    console.log(`   - Suppliers added: ${suppliersRestored}`);
    console.log(`   - Clients added: ${clientsRestored}`);
    console.log(`   - Materials added: ${materialsRestored}`);
    console.log(`   - Quotes added: ${quotesRestored}`);
    console.log(`   - Search History added: ${searchHistoryRestored}`);
    console.log(`   - Search Analytics added: ${searchAnalyticsRestored}`);
    
    // Show final database status
    console.log(`\n📊 Final Local Database Status:`);
    
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
    
    console.log('\n✅ Database restoration completed!');
    console.log('⚠️  Remember: This is your LOCAL database only!');
    console.log('⚠️  NEVER push changes back to production!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Your application should now work with data');
    console.log('   2. You can create quotes and manage data locally');
    console.log('   3. The GSM field is available for materials');
    
  } catch (error) {
    console.error('❌ Error during safe restoration:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
  } finally {
    await localPrisma.$disconnect();
  }
}

safeRestoreFromBackup();
