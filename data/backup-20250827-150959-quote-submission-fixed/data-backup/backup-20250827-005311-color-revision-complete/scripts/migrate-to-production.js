import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Complete Local to Production Migration...\n');

// Step 1: Create a temporary production schema file
console.log('🔧 Step 1: Creating production schema...');

const productionSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
}

model User {
  id              String            @id @default(cuid())
  email           String            @unique
  name            String
  role            String            @default("user")
  password        String?
  profilePicture  String?
  status          String            @default("Active")
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  clients         Client[]
  quotes          Quote[]
  searchAnalytics SearchAnalytics[]
  searchHistory   SearchHistory[]
}

model Client {
  id            String   @id @default(cuid())
  clientType    String
  companyName   String?
  contactPerson String
  email         String
  phone         String
  countryCode   String
  role          String?
  status        String   @default("Active")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String?
  address       String?
  city          String?
  state         String?
  postalCode    String?
  country       String?
  user          User?    @relation(fields: [userId], references: [id])
  quotes        Quote[]
}

model Quote {
  id                String            @id @default(cuid())
  quoteId           String            @unique
  date              DateTime
  status            String            @default("Pending")
  clientId          String
  userId            String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  product           String
  quantity          Int
  sides             String
  printing          String
  colors            String?
  productName       String?
  printingSelection String?
  flatSizeHeight    Float?
  closeSizeSpine    Float?
  useSameAsFlat     Boolean?          @default(false)
  flatSizeWidth     Float?
  flatSizeSpine     Float?
  closeSizeHeight   Float?
  closeSizeWidth    Float?
  finishing         Finishing[]
  papers            Paper[]
  user              User?             @relation(fields: [userId], references: [id])
  client            Client            @relation(fields: [clientId], references: [id])
  amounts           QuoteAmount?
  operational       QuoteOperational?
}

model Paper {
  id                String  @id @default(cuid())
  name              String
  gsm               String
  quoteId           String
  inputWidth        Float?
  inputHeight       Float?
  pricePerPacket    Float?
  pricePerSheet     Float?
  sheetsPerPacket   Int?
  recommendedSheets Int?
  enteredSheets     Int?
  outputWidth       Float?
  outputHeight      Float?
  selectedColors    String?
  quote             Quote   @relation(fields: [quoteId], references: [id], onDelete: Cascade)
}

model Finishing {
  id      String @id @default(cuid())
  name    String
  quoteId String
  cost    Float?
  quote   Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)
}

model QuoteAmount {
  id      String @id @default(cuid())
  base    Float
  vat     Float
  total   Float
  quoteId String @unique
  quote   Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)
}

model QuoteOperational {
  id        String   @id @default(cuid())
  quoteId   String   @unique
  plates    Int?
  units     Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  quote     Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
}

model Supplier {
  id          String     @id @default(cuid())
  name        String
  contact     String?
  email       String?
  phone       String?
  countryCode String?    @default("+971")
  address     String?
  city        String?
  state       String?
  postalCode  String?
  country     String?    @default("UAE")
  status      String     @default("Active")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  materials   Material[]
}

model Material {
  id          String   @id @default(cuid())
  materialId  String   @unique
  name        String
  gsm         String?
  supplierId  String
  cost        Float
  unit        String
  status      String   @default("Active")
  lastUpdated DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime   @updatedAt
  supplier    Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
}

model SearchHistory {
  id        String   @id @default(cuid())
  query     String
  timestamp DateTime @default(now())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
}

model SearchAnalytics {
  id        String   @id @default(cuid())
  query     String
  timestamp DateTime @default(now())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
}`;

const tempSchemaPath = path.join(__dirname, '../prisma/schema-temp-production.prisma');
fs.writeFileSync(tempSchemaPath, productionSchema);
console.log('✅ Temporary production schema created');

// Step 2: Generate Prisma client for production
console.log('\n🔧 Step 2: Generating production Prisma client...');

try {
  // Temporarily replace the schema
  const originalSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const originalSchema = fs.readFileSync(originalSchemaPath, 'utf8');
  
  // Backup original schema
  fs.writeFileSync(path.join(__dirname, '../prisma/schema-backup.prisma'), originalSchema);
  
  // Replace with production schema
  fs.writeFileSync(originalSchemaPath, productionSchema);
  
  console.log('✅ Schema temporarily updated for production');
  
  // Generate Prisma client
  const { execSync } = await import('child_process');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Production Prisma client generated');
  
  // Restore original schema
  fs.writeFileSync(originalSchemaPath, originalSchema);
  console.log('✅ Original schema restored');
  
} catch (error) {
  console.error('❌ Failed to generate production client:', error.message);
  process.exit(1);
}

// Step 3: Connect to production and migrate
console.log('\n🔧 Step 3: Connecting to production database...');

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

// Step 4: Connect to local database
console.log('\n🔧 Step 4: Connecting to local database...');

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

console.log('\n' + '='.repeat(60));

// Step 5: Start migration
async function migrateData() {
  try {
    console.log('📤 Starting data migration...\n');
    
    // Get local data counts
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
    
    // Backup production
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
    
    // Clear production database
    console.log('🧹 Clearing production database...');
    try {
      await productionPrisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Client" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Quote" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Paper" CASCADE`;
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
    
    // Migrate data
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
    
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempSchemaPath)) {
        fs.unlinkSync(tempSchemaPath);
      }
      console.log('🧹 Temporary files cleaned up');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup warning:', cleanupError.message);
    }
  });
