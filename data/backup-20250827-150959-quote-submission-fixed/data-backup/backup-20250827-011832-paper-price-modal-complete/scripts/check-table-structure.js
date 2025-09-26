import pg from 'pg';
const { Client } = pg;

async function checkTableStructure() {
  const productionClient = new Client({
    connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
  });

  try {
    await productionClient.connect();
    console.log('✅ Connected to production database');

    // Check Client table structure
    console.log('\n🏢 CLIENT TABLE STRUCTURE:');
    const clientColumns = await productionClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Client'
      ORDER BY ordinal_position
    `);
    
    clientColumns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    // Check Supplier table structure
    console.log('\n🏭 SUPPLIER TABLE STRUCTURE:');
    const supplierColumns = await productionClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Supplier'
      ORDER BY ordinal_position
    `);
    
    supplierColumns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    // Check if there are any records in these tables
    console.log('\n📊 TABLE RECORD COUNTS:');
    const clientCount = await productionClient.query('SELECT COUNT(*) as count FROM "Client"');
    const supplierCount = await productionClient.query('SELECT COUNT(*) as count FROM "Supplier"');
    
    console.log(`   Client table: ${clientCount.rows[0].count} records`);
    console.log(`   Supplier table: ${supplierCount.rows[0].count} records`);

    // Try to fetch a sample record from each table
    console.log('\n🔍 SAMPLE RECORDS:');
    
    if (parseInt(clientCount.rows[0].count) > 0) {
      const sampleClient = await productionClient.query('SELECT * FROM "Client" LIMIT 1');
      console.log('   Sample Client:', sampleClient.rows[0]);
    } else {
      console.log('   No clients found');
    }
    
    if (parseInt(supplierCount.rows[0].count) > 0) {
      const sampleSupplier = await productionClient.query('SELECT * FROM "Supplier" LIMIT 1');
      console.log('   Sample Supplier:', sampleSupplier.rows[0]);
    } else {
      console.log('   No suppliers found');
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await productionClient.end();
  }
}

checkTableStructure();
