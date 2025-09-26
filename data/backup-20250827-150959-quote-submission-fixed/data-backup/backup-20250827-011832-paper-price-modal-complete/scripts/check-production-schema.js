import pg from 'pg';

console.log('🔍 Checking Production Database Schema...\n');

const { Client } = pg;

const productionClient = new Client({
  connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
});

async function checkSchema() {
  try {
    await productionClient.connect();
    console.log('✅ Production PostgreSQL connected successfully');
    
    // Check Client table structure
    console.log('\n🔍 Client table structure:');
    const clientColumns = await productionClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Client' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Total columns: ${clientColumns.rows.length}`);
    clientColumns.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check Quote table structure
    console.log('\n🔍 Quote table structure:');
    const quoteColumns = await productionClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Quote' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Total columns: ${quoteColumns.rows.length}`);
    quoteColumns.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for specific missing columns
    console.log('\n🔍 Checking for specific columns:');
    
    const clientColNames = clientColumns.rows.map(col => col.column_name);
    const quoteColNames = quoteColumns.rows.map(col => col.column_name);
    
    console.log('   Client address fields:');
    console.log(`     address: ${clientColNames.includes('address') ? '✅' : '❌'}`);
    console.log(`     city: ${clientColNames.includes('city') ? '✅' : '❌'}`);
    console.log(`     state: ${clientColNames.includes('state') ? '✅' : '❌'}`);
    console.log(`     postalCode: ${clientColNames.includes('postalCode') ? '✅' : '❌'}`);
    console.log(`     country: ${clientColNames.includes('country') ? '✅' : '❌'}`);
    
    console.log('   Quote Step 3 fields:');
    console.log(`     productName: ${quoteColNames.includes('productName') ? '✅' : '❌'}`);
    console.log(`     printingSelection: ${quoteColNames.includes('printingSelection') ? '✅' : '❌'}`);
    console.log(`     flatSizeHeight: ${quoteColNames.includes('flatSizeHeight') ? '✅' : '❌'}`);
    console.log(`     closeSizeSpine: ${quoteColNames.includes('closeSizeSpine') ? '✅' : '❌'}`);
    console.log(`     useSameAsFlat: ${quoteColNames.includes('useSameAsFlat') ? '✅' : '❌'}`);
    console.log(`     flatSizeWidth: ${quoteColNames.includes('flatSizeWidth') ? '✅' : '❌'}`);
    console.log(`     flatSizeSpine: ${quoteColNames.includes('flatSizeSpine') ? '✅' : '❌'}`);
    console.log(`     closeSizeHeight: ${quoteColNames.includes('closeSizeHeight') ? '✅' : '❌'}`);
    console.log(`     closeSizeWidth: ${quoteColNames.includes('closeSizeWidth') ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('\n❌ Failed to check schema:', error.message);
    throw error;
  } finally {
    await productionClient.end();
  }
}

// Run the schema check
checkSchema()
  .then(() => {
    console.log('\n✅ Schema check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Schema check failed:', error);
    process.exit(1);
  });
