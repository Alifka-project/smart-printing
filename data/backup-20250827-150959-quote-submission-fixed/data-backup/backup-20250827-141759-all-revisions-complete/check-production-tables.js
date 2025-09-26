import pg from 'pg';
const { Client } = pg;

async function checkProductionTables() {
  const productionClient = new Client({
    connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
  });

  try {
    await productionClient.connect();
    console.log('✅ Connected to production database');

    // Check what tables exist
    const tablesResult = await productionClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📋 EXISTING TABLES IN PRODUCTION:');
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found!');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}`);
      });
    }

    // Check if specific tables exist
    const requiredTables = ['User', 'Client', 'Supplier', 'Quote', 'Paper', 'Finishing', 'QuoteAmount', 'QuoteOperational', 'Material', 'SearchHistory', 'SearchAnalytics'];
    
    console.log('\n🔍 CHECKING REQUIRED TABLES:');
    for (const tableName of requiredTables) {
      const exists = await productionClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      if (exists.rows[0].exists) {
        console.log(`   ✅ ${tableName} - EXISTS`);
      } else {
        console.log(`   ❌ ${tableName} - MISSING`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking production tables:', error.message);
  } finally {
    await productionClient.end();
  }
}

checkProductionTables();
