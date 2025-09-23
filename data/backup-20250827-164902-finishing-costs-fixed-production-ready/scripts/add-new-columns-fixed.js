const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addNewColumns() {
  try {
    console.log('🔧 Adding new columns to Client table...');
    
    // Add new columns one by one with proper SQL syntax
    const columns = [
      'firstName TEXT',
      'lastName TEXT', 
      'designation TEXT',
      'emails TEXT',
      'trn TEXT',
      'hasNoTrn INTEGER DEFAULT 0',
      'area TEXT'
    ];
    
    for (const columnDef of columns) {
      try {
        const columnName = columnDef.split(' ')[0];
        await prisma.$executeRawUnsafe(`ALTER TABLE Client ADD COLUMN ${columnDef}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
          console.log(`ℹ️ Column ${columnDef.split(' ')[0]} already exists`);
        } else {
          console.log(`⚠️ Error adding ${columnDef.split(' ')[0]}:`, error.message);
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
