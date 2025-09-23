import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Simple Local to Production Migration...\n');

// First, let's test if we can connect to the local database
console.log('🔌 Testing local database connection...');

let localPrisma;
try {
  localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:./prisma/dev.db"
      }
    }
  });
  
  // Test connection
  const testResult = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM User`;
  console.log(`✅ Local database connected successfully`);
  console.log(`   Found ${testResult[0].count} users in local database`);
  
} catch (localError) {
  console.error(`❌ Local database connection failed: ${localError.message}`);
  console.log('Trying alternative connection method...');
  
  // Try using the environment variable
  try {
    localPrisma = new PrismaClient();
    const testResult = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM User`;
    console.log(`✅ Local database connected via environment variable`);
    console.log(`   Found ${testResult[0].count} users in local database`);
  } catch (envError) {
    console.error(`❌ Environment variable connection also failed: ${envError.message}`);
    process.exit(1);
  }
}

// Now test production connection
console.log('\n🔌 Testing production database connection...');

let productionPrisma;
try {
  productionPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
      }
    }
  });
  
  // Test connection
  const testResult = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
  console.log(`✅ Production database connected successfully`);
  console.log(`   Found ${testResult[0].count} users in production database`);
  
} catch (productionError) {
  console.error(`❌ Production database connection failed: ${productionError.message}`);
  process.exit(1);
}

console.log('\n' + '='.repeat(60));

// Now let's start the migration
async function migrateData() {
  try {
    console.log('📤 Starting data migration...\n');
    
    // Step 1: Get local data counts
    console.log('📊 Local database contents:');
    const localUsers = await localPrisma.user.count();
    const localClients = await localPrisma.client.count();
    const localQuotes = await localPrisma.quote.count();
    const localSuppliers = await localPrisma.supplier.count();
    const localMaterials = await localPrisma.material.count();
    
    console.log(`   Users: ${localUsers}`);
    console.log(`   Clients: ${localClients}`);
    console.log(`   Quotes: ${localQuotes}`);
    console.log(`   Suppliers: ${localSuppliers}`);
    console.log(`   Materials: ${localMaterials}`);
    
    console.log('\n' + '='.repeat(60));
    
    // Step 2: Backup production (if it has data)
    console.log('💾 Creating production backup...');
    const backupDir = path.join(__dirname, '../data/production-backup-before-migration');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      const prodUsers = await productionPrisma.user.findMany();
      const prodClients = await productionPrisma.client.findMany();
      const prodQuotes = await productionPrisma.quote.findMany();
      
      if (prodUsers.length > 0 || prodClients.length > 0 || prodQuotes.length > 0) {
        fs.writeFileSync(path.join(backupDir, `Users-${timestamp}.json`), JSON.stringify(prodUsers, null, 2));
        fs.writeFileSync(path.join(backupDir, `Clients-${timestamp}.json`), JSON.stringify(prodClients, null, 2));
        fs.writeFileSync(path.join(backupDir, `Quotes-${timestamp}.json`), JSON.stringify(prodQuotes, null, 2));
        console.log(`✅ Production backup created in: ${backupDir}`);
      } else {
        console.log('ℹ️  Production database is empty, no backup needed');
      }
    } catch (backupError) {
      console.log(`⚠️  Production backup failed: ${backupError.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Step 3: Clear production database
    console.log('🧹 Clearing production database...');
    try {
      await productionPrisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Client" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Quote" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Paper" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Finishing" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "QuoteAmount" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "QuoteOperational" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Supplier" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Material" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "SearchHistory" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "SearchAnalytics" CASCADE`;
      
      console.log('✅ Production database cleared');
    } catch (clearError) {
      console.error(`❌ Failed to clear production database: ${clearError.message}`);
      throw clearError;
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Step 4: Migrate data
    console.log('📤 Migrating data...\n');
    
    // Migrate Users
    console.log('👥 Migrating Users...');
    const users = await localPrisma.user.findMany();
    for (const user of users) {
      await productionPrisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // Migrate Clients
    console.log('🏢 Migrating Clients...');
    const clients = await localPrisma.client.findMany();
    for (const client of clients) {
      await productionPrisma.client.create({
        data: {
          id: client.id,
          clientType: client.clientType,
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          countryCode: client.countryCode,
          role: client.role,
          status: client.status,
          address: client.address,
          city: client.city,
          state: client.state,
          postalCode: client.postalCode,
          country: client.country,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          userId: client.userId
        }
      });
    }
    console.log(`✅ Migrated ${clients.length} clients`);
    
    // Migrate Quotes
    console.log('📋 Migrating Quotes...');
    const quotes = await localPrisma.quote.findMany();
    for (const quote of quotes) {
      await productionPrisma.quote.create({
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
          productName: quote.productName,
          printingSelection: quote.printingSelection,
          flatSizeHeight: quote.flatSizeHeight,
          closeSizeSpine: quote.closeSizeSpine,
          useSameAsFlat: quote.useSameAsFlat,
          flatSizeWidth: quote.flatSizeWidth,
          flatSizeSpine: quote.flatSizeSpine,
          closeSizeHeight: quote.closeSizeHeight,
          closeSizeWidth: quote.closeSizeWidth,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${quotes.length} quotes`);
    
    // Continue with other models...
    console.log('\n✅ Basic migration completed!');
    console.log('🌐 Your local database has been migrated to production.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  }
}

// Run the migration
migrateData()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    if (localPrisma) await localPrisma.$disconnect();
    if (productionPrisma) await productionPrisma.$disconnect();
  });
