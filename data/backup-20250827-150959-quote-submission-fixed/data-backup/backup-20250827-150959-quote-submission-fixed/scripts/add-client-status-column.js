import pg from 'pg';
const { Client } = pg;

async function addClientStatusColumn() {
  const productionClient = new Client({
    connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
  });

  try {
    await productionClient.connect();
    console.log('✅ Connected to production database');

    // Check if status column already exists
    const columnCheck = await productionClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Client' AND column_name = 'status'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Status column already exists in Client table');
    } else {
      // Add the status column
      await productionClient.query('ALTER TABLE "Client" ADD COLUMN status TEXT DEFAULT \'Active\'');
      console.log('✅ Added status column to Client table with default value "Active"');
      
      // Update existing records to have 'Active' status
      await productionClient.query('UPDATE "Client" SET status = \'Active\' WHERE status IS NULL');
      console.log('✅ Updated existing client records with default status');
    }

    // Verify the column was added
    const finalCheck = await productionClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Client' AND column_name = 'status'
    `);

    if (finalCheck.rows.length > 0) {
      console.log('\n🔍 Status column details:');
      console.log('   Column:', finalCheck.rows[0].column_name);
      console.log('   Type:', finalCheck.rows[0].data_type);
      console.log('   Nullable:', finalCheck.rows[0].is_nullable);
      console.log('   Default:', finalCheck.rows[0].column_default);
    }

    console.log('\n🎉 Client table schema updated successfully!');

  } catch (error) {
    console.error('❌ Error adding status column:', error.message);
  } finally {
    await productionClient.end();
  }
}

addClientStatusColumn();
