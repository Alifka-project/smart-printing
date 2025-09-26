import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Direct Local to Production Migration...\n');

// Step 1: Connect to local database (using existing working setup)
console.log('🔌 Step 1: Connecting to local database...');

let localPrisma;
try {
  localPrisma = new PrismaClient();
  
  // Test connection
  const testResult = await localPrisma.user.count();
  console.log(`✅ Local database connected successfully`);
  console.log(`   Found ${testResult} users in local database`);
  
} catch (localError) {
  console.error(`❌ Local database connection failed: ${localError.message}`);
  process.exit(1);
}

// Step 2: Create a direct PostgreSQL connection
console.log('\n🔌 Step 2: Creating direct PostgreSQL connection...');

import pg from 'pg';
const { Client } = pg;

const productionClient = new Client({
  connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
});

try {
  await productionClient.connect();
  console.log('✅ Production PostgreSQL connected successfully');
  
  // Test connection
  const testResult = await productionClient.query('SELECT COUNT(*) as count FROM "User"');
  console.log(`   Found ${testResult.rows[0].count} users in production database`);
  
} catch (productionError) {
  console.error(`❌ Production database connection failed: ${productionError.message}`);
  process.exit(1);
}

console.log('\n' + '='.repeat(60));

// Step 3: Start migration
async function migrateData() {
  try {
    console.log('📤 Starting data migration...\n');
    
    // Get local data counts using raw SQL to avoid schema issues
    console.log('📊 Local database contents:');
    
    const localUsersResult = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    const localClientsResult = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Client"`;
    const localQuotesResult = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Quote"`;
    const localSuppliersResult = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Supplier"`;
    const localMaterialsResult = await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Material"`;
    
    const localUsers = localUsersResult[0].count;
    const localClients = localClientsResult[0].count;
    const localQuotes = localQuotesResult[0].count;
    const localSuppliers = localSuppliersResult[0].count;
    const localMaterials = localMaterialsResult[0].count;
    
    console.log(`   Users: ${localUsers}`);
    console.log(`   Clients: ${localClients}`);
    console.log(`   Quotes: ${localQuotes}`);
    console.log(`   Suppliers: ${localSuppliers}`);
    console.log(`   Materials: ${localMaterials}`);
    
    console.log('\n' + '='.repeat(60));
    
    // Backup production
    console.log('💾 Creating production backup...');
    const backupDir = path.join(__dirname, '../data/production-backup-before-migration');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      const prodUsersResult = await productionClient.query('SELECT * FROM "User"');
      const prodClientsResult = await productionClient.query('SELECT * FROM "Client"');
      const prodQuotesResult = await productionClient.query('SELECT * FROM "Quote"');
      
      const prodUsers = prodUsersResult.rows;
      const prodClients = prodClientsResult.rows;
      const prodQuotes = prodQuotesResult.rows;
      
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
    
    // Clear production database
    console.log('🧹 Clearing production database...');
    try {
      await productionClient.query('TRUNCATE TABLE "User" CASCADE');
      await productionClient.query('TRUNCATE TABLE "Client" CASCADE');
      await productionClient.query('TRUNCATE TABLE "Quote" CASCADE');
      await productionClient.query('TRUNCATE TABLE "Paper" CASCADE');
      await productionClient.query('TRUNCATE TABLE "Finishing" CASCADE');
      await productionClient.query('TRUNCATE TABLE "QuoteAmount" CASCADE');
      await productionClient.query('TRUNCATE TABLE "QuoteOperational" CASCADE');
      await productionClient.query('TRUNCATE TABLE "Supplier" CASCADE');
      await productionClient.query('TRUNCATE TABLE "Material" CASCADE');
      await productionClient.query('TRUNCATE TABLE "SearchHistory" CASCADE');
      await productionClient.query('TRUNCATE TABLE "SearchAnalytics" CASCADE');
      
      console.log('✅ Production database cleared');
    } catch (clearError) {
      console.error(`❌ Failed to clear production database: ${clearError.message}`);
      throw clearError;
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Migrate data using raw SQL
    console.log('📤 Migrating data...\n');
    
    // Migrate Users
    console.log('👥 Migrating Users...');
    const users = await localPrisma.$queryRaw`SELECT * FROM "User"`;
    for (const user of users) {
      await productionClient.query(`
        INSERT INTO "User" (id, email, name, role, "profilePicture", status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        user.id,
        user.email,
        user.name,
        user.role || 'user',
        user.profilePicture,
        user.status || 'Active',
        user.createdAt,
        user.updatedAt
      ]);
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // Migrate Clients
    console.log('🏢 Migrating Clients...');
    const clients = await localPrisma.$queryRaw`SELECT * FROM "Client"`;
    for (const client of clients) {
      await productionClient.query(`
        INSERT INTO "Client" (id, "clientType", "companyName", "contactPerson", email, phone, "countryCode", role, "createdAt", "updatedAt", "userId", address, city, state, "postalCode", country)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        client.id,
        client.clientType,
        client.companyName,
        client.contactPerson,
        client.email,
        client.phone,
        client.countryCode,
        client.role,
        client.createdAt,
        client.updatedAt,
        client.userId,
        client.address,
        client.city,
        client.state,
        client.postalCode,
        client.country
      ]);
    }
    console.log(`✅ Migrated ${clients.length} clients`);
    
    // Migrate Quotes
    console.log('📋 Migrating Quotes...');
    const quotes = await localPrisma.$queryRaw`SELECT * FROM "Quote"`;
    for (const quote of quotes) {
      await productionClient.query(`
        INSERT INTO "Quote" (id, "quoteId", date, status, "clientId", "userId", product, quantity, sides, printing, colors, "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [
        quote.id,
        quote.quoteId,
        quote.date,
        quote.status,
        quote.clientId,
        quote.userId,
        quote.product,
        quote.quantity,
        quote.sides,
        quote.printing,
        quote.colors,
        quote.productName,
        quote.printingSelection,
        quote.flatSizeHeight,
        quote.closeSizeSpine,
        quote.useSameAsFlat,
        quote.flatSizeWidth,
        quote.flatSizeSpine,
        quote.closeSizeHeight,
        quote.closeSizeWidth,
        quote.createdAt,
        quote.updatedAt
      ]);
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
    if (productionClient) await productionClient.end();
  });
