import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Client } = pg;

async function checkMaterialData() {
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
    
    // Check local material count
    const localMaterialCount = await localPrisma.material.count();
    console.log(`📊 Local database has ${localMaterialCount} materials`);
    
    // Check production material count
    const productionMaterialCount = await productionClient.query('SELECT COUNT(*) as count FROM "Material"');
    console.log(`🌐 Production database has ${productionMaterialCount.rows[0].count} materials`);
    
    if (localMaterialCount > 0 && parseInt(productionMaterialCount.rows[0].count) === 0) {
      console.log('\n🔄 Materials need to be migrated from local to production');
      
      // Get all materials from local
      const localMaterials = await localPrisma.material.findMany({
        include: {
          supplier: true
        }
      });
      
      console.log(`🏭 Found ${localMaterials.length} materials to migrate`);
      
      // Clear existing materials in production (if any)
      await productionClient.query('TRUNCATE TABLE "Material" CASCADE');
      console.log('🧹 Cleared existing materials in production');
      
      // Migrate materials
      for (const material of localMaterials) {
        await productionClient.query(`
          INSERT INTO "Material" (
            id, "materialId", name, gsm, "supplierId", cost, unit, 
            status, "lastUpdated", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          material.id,
          material.materialId,
          material.name,
          material.gsm,
          material.supplierId,
          material.cost,
          material.unit,
          material.status,
          material.lastUpdated,
          material.createdAt,
          material.updatedAt
        ]);
        
        console.log(`   ✅ Migrated material: ${material.name} (${material.materialId})`);
      }
      
      // Verify migration
      const newProductionMaterialCount = await productionClient.query('SELECT COUNT(*) as count FROM "Material"');
      console.log(`\n🎉 Material migration completed! Production now has ${newProductionMaterialCount.rows[0].count} materials`);
      
    } else if (parseInt(productionMaterialCount.rows[0].count) > 0) {
      console.log('✅ Materials already exist in production');
    } else {
      console.log('❌ No materials found in local database');
    }
    
  } catch (error) {
    console.error('❌ Error checking material data:', error.message);
  } finally {
    await localPrisma.$disconnect();
    await productionClient.end();
  }
}

checkMaterialData();
