const { PrismaClient } = require('@prisma/client');

// Local database client
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

const PRODUCTION_BASE_URL = 'https://smart-printing.vercel.app';

async function fetchFromProduction(endpoint) {
  try {
    const response = await fetch(`${PRODUCTION_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error.message);
    return null;
  }
}

async function pullFromProductionAPI() {
  try {
    console.log('🚀 Starting data pull from production API...');
    
    // Step 1: Pull Users from Production API
    console.log('👥 Step 1: Pulling users from production API...');
    const productionUsers = await fetchFromProduction('/api/users');
    if (productionUsers) {
      console.log(`Found ${productionUsers.length} users in production`);
    } else {
      console.log('⚠️ Could not fetch users from production API');
    }
    
    // Step 2: Pull Suppliers from Production API
    console.log('🏢 Step 2: Pulling suppliers from production API...');
    const productionSuppliers = await fetchFromProduction('/api/suppliers');
    if (productionSuppliers) {
      console.log(`Found ${productionSuppliers.length} suppliers in production`);
    } else {
      console.log('⚠️ Could not fetch suppliers from production API');
    }
    
    // Step 3: Pull Materials from Production API
    console.log('📦 Step 3: Pulling materials from production API...');
    const productionMaterials = await fetchFromProduction('/api/materials');
    if (productionMaterials) {
      console.log(`Found ${productionMaterials.length} materials in production`);
    } else {
      console.log('⚠️ Could not fetch materials from production API');
    }
    
    // Step 4: Pull Clients from Production API
    console.log('👤 Step 4: Pulling clients from production API...');
    const productionClients = await fetchFromProduction('/api/clients');
    if (productionClients) {
      console.log(`Found ${productionClients.length} clients in production`);
    } else {
      console.log('⚠️ Could not fetch clients from production API');
    }
    
    // Step 5: Pull Quotes from Production API
    console.log('📄 Step 5: Pulling quotes from production API...');
    const productionQuotes = await fetchFromProduction('/api/quotes');
    if (productionQuotes) {
      console.log(`Found ${productionQuotes.length} quotes in production`);
    } else {
      console.log('⚠️ Could not fetch quotes from production API');
    }
    
    console.log('\n📥 Data pull from production API completed!');
    console.log(`📊 Production Data Summary:`);
    console.log(`   - Users: ${productionUsers?.length || 0}`);
    console.log(`   - Suppliers: ${productionSuppliers?.length || 0}`);
    console.log(`   - Materials: ${productionMaterials?.length || 0}`);
    console.log(`   - Clients: ${productionClients?.length || 0}`);
    console.log(`   - Quotes: ${productionQuotes?.length || 0}`);
    
    // Step 6: Clear local database and restore production data
    console.log('\n🔄 Step 6: Clearing local database and restoring production data...');
    
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
    
    // Step 7: Restore Users
    if (productionUsers && productionUsers.length > 0) {
      console.log('\n👥 Step 7: Restoring users to local database...');
      for (const user of productionUsers) {
        try {
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
        } catch (error) {
          console.log(`⚠️ Could not restore user ${user.email}: ${error.message}`);
        }
      }
      console.log(`✅ Restored users`);
    }
    
    // Step 8: Restore Suppliers
    if (productionSuppliers && productionSuppliers.length > 0) {
      console.log('\n🏢 Step 8: Restoring suppliers to local database...');
      for (const supplier of productionSuppliers) {
        try {
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
        } catch (error) {
          console.log(`⚠️ Could not restore supplier ${supplier.name}: ${error.message}`);
        }
      }
      console.log(`✅ Restored suppliers`);
    }
    
    // Step 9: Restore Clients
    if (productionClients && productionClients.length > 0) {
      console.log('\n👤 Step 9: Restoring clients to local database...');
      for (const client of productionClients) {
        try {
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
        } catch (error) {
          console.log(`⚠️ Could not restore client ${client.contactPerson}: ${error.message}`);
        }
      }
      console.log(`✅ Restored clients`);
    }
    
    // Step 10: Restore Materials (with GSM field)
    if (productionMaterials && productionMaterials.length > 0) {
      console.log('\n📦 Step 10: Restoring materials to local database...');
      for (const material of productionMaterials) {
        try {
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
        } catch (error) {
          console.log(`⚠️ Could not restore material ${material.name}: ${error.message}`);
        }
      }
      console.log(`✅ Restored materials`);
    }
    
    // Step 11: Restore Quotes and related data
    if (productionQuotes && productionQuotes.length > 0) {
      console.log('\n📄 Step 11: Restoring quotes to local database...');
      for (const quote of productionQuotes) {
        try {
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
        } catch (error) {
          console.log(`⚠️ Could not restore quote ${quote.quoteId}: ${error.message}`);
        }
      }
      console.log(`✅ Restored quotes`);
    }
    
    console.log('\n🎉 Production data successfully restored to local database!');
    console.log(`📊 Final Local Database Summary:`);
    
    const finalUsers = await localPrisma.user.count();
    const finalSuppliers = await localPrisma.supplier.count();
    const finalMaterials = await localPrisma.material.count();
    const finalClients = await localPrisma.client.count();
    const finalQuotes = await localPrisma.quote.count();
    
    console.log(`   - Users: ${finalUsers}`);
    console.log(`   - Suppliers: ${finalSuppliers}`);
    console.log(`   - Materials: ${finalMaterials}`);
    console.log(`   - Clients: ${finalClients}`);
    console.log(`   - Quotes: ${finalQuotes}`);
    
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
    console.error('❌ Error pulling from production API:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

pullFromProductionAPI();
