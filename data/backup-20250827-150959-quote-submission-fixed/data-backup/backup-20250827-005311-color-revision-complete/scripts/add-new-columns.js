const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addNewColumns() {
  try {
    console.log('🔧 Adding new columns to Client table...');
    
    // Add new columns one by one - these will be NULL for existing records
    const columns = [
      { name: 'firstName', type: 'TEXT' },
      { name: 'lastName', type: 'TEXT' },
      { name: 'designation', type: 'TEXT' },
      { name: 'emails', type: 'TEXT' },
      { name: 'trn', type: 'TEXT' },
      { name: 'hasNoTrn', type: 'INTEGER DEFAULT 0' },
      { name: 'area', type: 'TEXT' }
    ];
    
    for (const column of columns) {
      try {
        await prisma.$executeRaw`ALTER TABLE Client ADD COLUMN ${column.name} ${column.type}`;
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`ℹ️ Column ${column.name} already exists`);
        } else {
          console.log(`⚠️ Error adding ${column.name}:`, error.message);
        }
      }
    }
    
    // Set default values for existing records
    console.log('🔄 Setting default values for existing records...');
    
    try {
      await prisma.$executeRaw`UPDATE Client SET state = 'Dubai' WHERE state IS NULL OR state = ''`;
      console.log('✅ Set default state to Dubai');
    } catch (error) {
      console.log('⚠️ Error setting default state:', error.message);
    }
    
    try {
      await prisma.$executeRaw`UPDATE Client SET country = 'UAE' WHERE country IS NULL OR country = ''`;
      console.log('✅ Set default country to UAE');
    } catch (error) {
      console.log('⚠️ Error setting default country:', error.message);
    }
    
    try {
      await prisma.$executeRaw`UPDATE Client SET hasNoTrn = 0 WHERE hasNoTrn IS NULL`;
      console.log('✅ Set default hasNoTrn to false');
    } catch (error) {
      console.log('⚠️ Error setting default hasNoTrn:', error.message);
    }
    
    console.log('🎉 Column addition completed successfully!');
    
    // Show current table structure
    console.log('\n📊 Current Client table structure:');
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(Client)`;
    tableInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addNewColumns()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
