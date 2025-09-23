import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Client } = pg;

async function restoreSupplierData() {
  // Local Prisma client (SQLite)
  const localPrisma = new PrismaClient();
  
  // Production PostgreSQL client
  const productionClient = new Client({
    connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
  });

  try {
    // Connect to both databases
    await productionClient.connect();
    console.log('✅ Connected to production database');
    
    // Get supplier count from local
    const localSupplierCount = await localPrisma.supplier.count();
    console.log(`📊 Local database has ${localSupplierCount} suppliers`);
    
    if (localSupplierCount === 0) {
      console.log('❌ No suppliers found in local database');
      return;
    }
    
    // Get all suppliers from local
    const localSuppliers = await localPrisma.supplier.findMany({
      include: {
        materials: true
      }
    });
    
    console.log(`🏭 Found ${localSuppliers.length} suppliers to migrate`);
    
    // Clear existing suppliers in production (if any)
    await productionClient.query('TRUNCATE TABLE "Supplier" CASCADE');
    console.log('🧹 Cleared existing suppliers in production');
    
    // Migrate suppliers
    for (const supplier of localSuppliers) {
      await productionClient.query(`
        INSERT INTO "Supplier" (
          id, name, contact, email, phone, "countryCode", 
          address, city, state, "postalCode", country, 
          status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        supplier.id,
        supplier.name,
        supplier.contact,
        supplier.email,
        supplier.phone,
        supplier.countryCode,
        supplier.address,
        supplier.city,
        supplier.state,
        supplier.postalCode,
        supplier.country,
        supplier.status,
        supplier.createdAt,
        supplier.updatedAt
      ]);
      
      console.log(`   ✅ Migrated supplier: ${supplier.name}`);
    }
    
    // Verify migration
    const productionSupplierCount = await productionClient.query('SELECT COUNT(*) as count FROM "Supplier"');
    console.log(`\n🎉 Migration completed! Production now has ${productionSupplierCount.rows[0].count} suppliers`);
    
    // Show sample supplier
    if (parseInt(productionSupplierCount.rows[0].count) > 0) {
      const sampleSupplier = await productionClient.query('SELECT * FROM "Supplier" LIMIT 1');
      console.log('\n🔍 Sample supplier in production:', sampleSupplier.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error restoring supplier data:', error.message);
  } finally {
    await localPrisma.$disconnect();
    await productionClient.end();
  }
}

restoreSupplierData();
