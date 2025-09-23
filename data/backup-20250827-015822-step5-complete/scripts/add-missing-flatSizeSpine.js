import pg from 'pg';

console.log('🔧 Adding Missing flatSizeSpine Column...\n');

const { Client } = pg;

const productionClient = new Client({
  connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
});

async function addFlatSizeSpine() {
  try {
    await productionClient.connect();
    console.log('✅ Production PostgreSQL connected successfully');
    
    // Check if flatSizeSpine column exists
    console.log('\n🔍 Checking for flatSizeSpine column...');
    const columns = await productionClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Quote' AND column_name = 'flatSizeSpine'
    `);
    
    if (columns.rows.length === 0) {
      console.log('   ❌ flatSizeSpine column is missing');
      console.log('   🔧 Adding flatSizeSpine column...');
      
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "flatSizeSpine" DOUBLE PRECISION');
      console.log('   ✅ flatSizeSpine column added successfully');
    } else {
      console.log('   ✅ flatSizeSpine column already exists');
    }
    
    // Verify the column was added
    console.log('\n🔍 Verifying Quote table structure...');
    const quoteColumns = await productionClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Quote' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Total columns: ${quoteColumns.rows.length}`);
    
    // Check for the specific columns we need
    const colNames = quoteColumns.rows.map(col => col.column_name);
    console.log('\n🔍 Checking for all required columns:');
    console.log(`   flatSizeSpine: ${colNames.includes('flatSizeSpine') ? '✅' : '❌'}`);
    console.log(`   flatSizeWidth: ${colNames.includes('flatSizeWidth') ? '✅' : '❌'}`);
    console.log(`   flatSizeHeight: ${colNames.includes('flatSizeHeight') ? '✅' : '❌'}`);
    
    console.log('\n✅ flatSizeSpine column check completed!');
    
  } catch (error) {
    console.error('\n❌ Failed to add flatSizeSpine column:', error.message);
    throw error;
  } finally {
    await productionClient.end();
  }
}

// Run the column addition
addFlatSizeSpine()
  .then(() => {
    console.log('\n✅ flatSizeSpine column addition completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ flatSizeSpine column addition failed:', error);
    process.exit(1);
  });
