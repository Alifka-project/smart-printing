import pg from 'pg';

console.log('🔧 Adding Missing Columns to Production Database...\n');

const { Client } = pg;

const productionClient = new Client({
  connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
});

async function addMissingColumns() {
  try {
    await productionClient.connect();
    console.log('✅ Production PostgreSQL connected successfully');
    
    // Check current Client table structure
    console.log('\n🔍 Checking current Client table structure...');
    const clientColumns = await productionClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Client' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Current Client columns: ${clientColumns.rows.length}`);
    console.log('   Columns:', clientColumns.rows.map(col => col.column_name).join(', '));
    
    // Check for missing fields
    const hasAddress = clientColumns.rows.some(col => col.column_name === 'address');
    const hasCity = clientColumns.rows.some(col => col.column_name === 'city');
    const hasState = clientColumns.rows.some(col => col.column_name === 'state');
    const hasPostalCode = clientColumns.rows.some(col => col.column_name === 'postalCode');
    const hasCountry = clientColumns.rows.some(col => col.column_name === 'country');
    
    console.log('\n🔍 Field analysis:');
    console.log(`   address: ${hasAddress ? '✅' : '❌'}`);
    console.log(`   city: ${hasCity ? '✅' : '❌'}`);
    console.log(`   state: ${hasState ? '✅' : '❌'}`);
    console.log(`   postalCode: ${hasPostalCode ? '✅' : '❌'}`);
    console.log(`   country: ${hasCountry ? '✅' : '❌'}`);
    
    // Add missing columns
    console.log('\n🔧 Adding missing columns...');
    
    if (!hasAddress) {
      await productionClient.query('ALTER TABLE "Client" ADD COLUMN address TEXT');
      console.log('   ✅ Added address column');
    }
    
    if (!hasCity) {
      await productionClient.query('ALTER TABLE "Client" ADD COLUMN city TEXT');
      console.log('   ✅ Added city column');
    }
    
    if (!hasState) {
      await productionClient.query('ALTER TABLE "Client" ADD COLUMN state TEXT');
      console.log('   ✅ Added state column');
    }
    
    if (!hasPostalCode) {
      await productionClient.query('ALTER TABLE "Client" ADD COLUMN "postalCode" TEXT');
      console.log('   ✅ Added postalCode column');
    }
    
    if (!hasCountry) {
      await productionClient.query('ALTER TABLE "Client" ADD COLUMN country TEXT');
      console.log('   ✅ Added country column');
    }
    
    // Check Quote table structure
    console.log('\n🔍 Checking current Quote table structure...');
    const quoteColumns = await productionClient.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Quote' 
      ORDER BY ordinal_position
    `);
    
    console.log(`   Current Quote columns: ${quoteColumns.rows.length}`);
    
    // Check for missing Step 3 fields
    const hasProductName = quoteColumns.rows.some(col => col.column_name === 'productName');
    const hasPrintingSelection = quoteColumns.rows.some(col => col.column_name === 'printingSelection');
    const hasFlatSizeHeight = quoteColumns.rows.some(col => col.column_name === 'flatSizeHeight');
    const hasCloseSizeSpine = quoteColumns.rows.some(col => col.column_name === 'closeSizeSpine');
    const hasUseSameAsFlat = quoteColumns.rows.some(col => col.column_name === 'useSameAsFlat');
    const hasFlatSizeWidth = quoteColumns.rows.some(col => col.column_name === 'flatSizeWidth');
    const hasCloseSizeHeight = quoteColumns.rows.some(col => col.column_name === 'closeSizeHeight');
    const hasCloseSizeWidth = quoteColumns.rows.some(col => col.column_name === 'closeSizeWidth');
    
    console.log('\n🔍 Quote Step 3 field analysis:');
    console.log(`   productName: ${hasProductName ? '✅' : '❌'}`);
    console.log(`   printingSelection: ${hasPrintingSelection ? '✅' : '❌'}`);
    console.log(`   flatSizeHeight: ${hasFlatSizeHeight ? '✅' : '❌'}`);
    console.log(`   closeSizeSpine: ${hasCloseSizeSpine ? '✅' : '❌'}`);
    console.log(`   useSameAsFlat: ${hasUseSameAsFlat ? '✅' : '❌'}`);
    console.log(`   flatSizeWidth: ${hasFlatSizeWidth ? '✅' : '❌'}`);
    console.log(`   closeSizeHeight: ${hasCloseSizeHeight ? '✅' : '❌'}`);
    console.log(`   closeSizeWidth: ${hasCloseSizeWidth ? '✅' : '❌'}`);
    
    // Add missing Quote columns
    console.log('\n🔧 Adding missing Quote columns...');
    
    if (!hasProductName) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "productName" TEXT');
      console.log('   ✅ Added productName column');
    }
    
    if (!hasPrintingSelection) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "printingSelection" TEXT');
      console.log('   ✅ Added printingSelection column');
    }
    
    if (!hasFlatSizeHeight) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "flatSizeHeight" DOUBLE PRECISION');
      console.log('   ✅ Added flatSizeHeight column');
    }
    
    if (!hasCloseSizeSpine) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "closeSizeSpine" DOUBLE PRECISION');
      console.log('   ✅ Added closeSizeSpine column');
    }
    
    if (!hasUseSameAsFlat) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "useSameAsFlat" BOOLEAN DEFAULT false');
      console.log('   ✅ Added useSameAsFlat column');
    }
    
    if (!hasFlatSizeWidth) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "flatSizeWidth" DOUBLE PRECISION');
      console.log('   ✅ Added flatSizeWidth column');
    }
    
    if (!hasCloseSizeHeight) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "closeSizeHeight" DOUBLE PRECISION');
      console.log('   ✅ Added closeSizeHeight column');
    }
    
    if (!hasCloseSizeWidth) {
      await productionClient.query('ALTER TABLE "Quote" ADD COLUMN "closeSizeWidth" DOUBLE PRECISION');
      console.log('   ✅ Added closeSizeWidth column');
    }
    
    console.log('\n✅ All missing columns added successfully!');
    console.log('🚀 Production database is now ready for migration.');
    
  } catch (error) {
    console.error('\n❌ Failed to add missing columns:', error.message);
    throw error;
  } finally {
    await productionClient.end();
  }
}

// Run the column addition
addMissingColumns()
  .then(() => {
    console.log('\n✅ Column addition completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Column addition failed:', error);
    process.exit(1);
  });
