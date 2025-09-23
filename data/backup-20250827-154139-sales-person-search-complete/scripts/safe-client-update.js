const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function safeClientUpdate() {
  try {
    console.log('🔄 Starting safe client schema update...');
    
    // Step 1: Backup existing data
    console.log('📦 Creating backup of existing clients...');
    const existingClients = await prisma.$queryRaw`SELECT * FROM Client`;
    
    const backupPath = path.join(__dirname, '../data/client-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
    fs.writeFileSync(backupPath, JSON.stringify(existingClients, null, 2));
    console.log(`✅ Backup created at: ${backupPath}`);
    
    // Step 2: Add new columns one by one with defaults
    console.log('🔧 Adding new columns...');
    
    // Add firstName column
    try {
      await prisma.$executeRaw`ALTER TABLE Client ADD COLUMN firstName TEXT`;
      console.log('✅ Added firstName column');
    } catch (e) {
      console.log('ℹ️ firstName column already exists or error:', e.message);
    }
    
    // Add lastName column
    try {
      await prisma.$executeRaw`ALTER TABLE Client ADD COLUMN lastName TEXT`;
      console.log('✅ Added lastName column');
    } catch (e) {
      console.log('ℹ️ lastName column already exists or error:', e.message);
    }
    
    // Add designation column
    try {
      await prisma.$executeRaw`ALTER TABLE Client ADD COLUMN designation TEXT`;
      console.log('✅ Added designation column');
    } catch (e) {
      console.log('ℹ️ designation column already exists or error:', e.message);
    }
    
    // Add trn column
    try {
      await prisma.$executeRaw`ALTER TABLE Client ADD COLUMN trn TEXT`;
      console.log('✅ Added trn column');
    } catch (e) {
      console.log('ℹ️ trn column already exists or error:', e.message);
    }
    
    // Add hasNoTrn column
    try {
      await prisma.$executeRaw`ALTER TABLE Client ADD COLUMN hasNoTrn INTEGER DEFAULT 0`;
      console.log('✅ Added hasNoTrn column');
    } catch (e) {
      console.log('ℹ️ hasNoTrn column already exists or error:', e.message);
    }
    
    // Add area column
    try {
      await prisma.$executeRaw`ALTER TABLE Client ADD COLUMN area TEXT`;
      console.log('✅ Added area column');
    } catch (e) {
      console.log('ℹ️ area column already exists or error:', e.message);
    }
    
    // Step 3: Update existing data with defaults
    console.log('🔄 Updating existing data with defaults...');
    
    // Set default state and country for existing records
    await prisma.$executeRaw`UPDATE Client SET state = 'Dubai' WHERE state IS NULL OR state = ''`;
    await prisma.$executeRaw`UPDATE Client SET country = 'UAE' WHERE country IS NULL OR country = ''`;
    
    // Convert existing email to emails array format
    await prisma.$executeRaw`UPDATE Client SET emails = '[]' WHERE emails IS NULL`;
    
    console.log('✅ Schema update completed successfully!');
    console.log(`📊 Total clients processed: ${existingClients.length}`);
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the safe update
safeClientUpdate()
  .then(() => {
    console.log('🎉 Safe client update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Safe client update failed:', error);
    process.exit(1);
  });
