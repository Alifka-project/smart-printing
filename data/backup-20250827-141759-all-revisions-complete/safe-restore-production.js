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

async function safeRestoreFromProduction() {
  try {
    console.log('🚀 Starting SAFE data restoration from production API...');
    console.log('⚠️  This script will ONLY ADD data, NEVER DELETE anything!');
    
    // Step 1: Pull Users from Production API
    console.log('👥 Step 1: Pulling users from production API...');
    const productionUsers = await fetchFromProduction('/api/users');
    if (productionUsers) {
      console.log(`Found ${productionUsers.length} users in production`);
    } else {
      console.log('⚠️ Could not fetch users from production API');
      return;
    }
    
    // Step 2: Pull Suppliers from Production API
    console.log('🏢 Step 2: Pulling suppliers from production API...');
    const productionSuppliers = await fetchFromProduction('/api/suppliers');
    if (productionSuppliers) {
      console.log(`Found ${productionSuppliers.length} suppliers in production`);
    } else {
      console.log('⚠️ Could not fetch suppliers from production API');
      return;
    }
    
    // Step 3: Pull Materials from Production API
    console.log('📦 Step 3: Pulling materials from production API...');
    const productionMaterials = await fetchFromProduction('/api/materials');
    if (productionMaterials) {
      console.log(`Found ${productionMaterials.length} materials in production`);
    } else {
      console.log('⚠️ Could not fetch materials from production API');
      return;
    }
    
    // Step 4: Pull Clients from Production API
    console.log('👤 Step 4: Pulling clients from production API...');
    const productionClients = await fetchFromProduction('/api/clients');
    if (productionClients) {
      console.log(`Found ${productionClients.length} clients in production`);
    } else {
      console.log('⚠️ Could not fetch clients from production API');
      return;
    }
    
    // Step 5: Pull Quotes from Production API
    console.log('📄 Step 5: Pulling quotes from production API...');
    const productionQuotes = await fetchFromProduction('/api/quotes');
    if (productionQuotes) {
      console.log(`Found ${productionQuotes.length} quotes in production`);
    } else {
      console.log('⚠️ Could not fetch quotes from production API');
      return;
    }
    
    console.log('\n📥 Data pull from production API completed!');
    console.log(`📊 Production Data Summary:`);
    console.log(`   - Users: ${productionUsers.length}`);
    console.log(`   - Suppliers: ${productionSuppliers.length}`);
    console.log(`   - Materials: ${productionMaterials.length}`);
    console.log(`   - Clients: ${productionClients.length}`);
    console.log(`   - Quotes: ${productionQuotes.length}`);
    
    // Step 6: SAFELY restore data (only add, never delete)
    console.log('\n🔄 Step 6: SAFELY restoring data to local database (ADDING ONLY)...');
    
    // Step 7: Restore Users (only if they don't exist)
    console.log('\n👥 Step 7: Safely restoring users to local database...');
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
    
    // Step 8: Restore Suppliers (only if they don't exist)
    console.log('\n🏢 Step 8: Safely restoring suppliers to local database...');
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
    
    // Step 9: Restore Clients (only if they don't exist)
    console.log('\n👤 Step 9: Safely restoring clients to local database...');
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
    
    // Step 10: Restore Materials (only if they don't exist)
    console.log('\n📦 Step 10: Safely restoring materials to local database...');
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
    
    // Step 11: Restore Quotes (only if they don't exist)
    console.log('\n📄 Step 11: Safely restoring quotes to local database...');
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
    
    console.log('\n🎉 SAFE restoration completed!');
    console.log(`📊 Restoration Summary:`);
    console.log(`   - Users added: ${usersRestored}`);
    console.log(`   - Suppliers added: ${suppliersRestored}`);
    console.log(`   - Materials added: ${materialsRestored}`);
    console.log(`   - Clients added: ${clientsRestored}`);
    console.log(`   - Quotes added: ${quotesRestored}`);
    
    console.log(`\n📊 Final Local Database Summary:`);
    
    const finalUsers = await localPrisma.user.count();
    const finalSuppliers = await localPrisma.supplier.count();
    const finalMaterials = await localPrisma.material.count();
    const finalClients = await localPrisma.client.count();
    const finalQuotes = await localPrisma.quote.count();
    
    console.log(`   - Total Users: ${finalUsers}`);
    console.log(`   - Total Suppliers: ${finalSuppliers}`);
    console.log(`   - Total Materials: ${finalMaterials}`);
    console.log(`   - Total Clients: ${finalClients}`);
    console.log(`   - Total Quotes: ${finalQuotes}`);
    
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
    
  } catch (error) {
    console.error('❌ Error during safe restoration:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

safeRestoreFromProduction();
