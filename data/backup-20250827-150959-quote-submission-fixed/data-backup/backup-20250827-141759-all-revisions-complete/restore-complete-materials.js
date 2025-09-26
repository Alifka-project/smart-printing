#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xc0dkeFdBOTFuNW1jNWZTNkpUczAiLCJhcGlfa2V5IjoiMDFLMzRRTVFYTVhDR0VaMkFBS1lTMFo3RUMiLCJ0ZW5hbnRfaWQiOiJjOTFjODU2MWZlOGI2YjM0YTU5ODVmMTdhYzU2NGNhMzY3OTY5ZmU5Mjg1NTdjNGM0ZjZiNWJjNzgwNzMzMjgxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY4OWUzMTItMDE4OC00ZjE4LWFhMGQtYTc1OWVhN2EzNGE5In0.lPVxsK7w4PqWlM7f5ErZ-LE7ixz4nL1rVMJIRttzRqs'
    }
  }
});

async function restoreCompleteMaterials() {
  try {
    console.log('🔧 Restoring complete materials with GSM specifications...');
    
    // Read the backup files
    const materialsPath = 'data/enhanced-database-backup/Material-2025-08-23T02-18-53-587Z.json';
    const suppliersPath = 'data/enhanced-database-backup/Supplier-2025-08-23T02-18-53-587Z.json';
    
    const materials = JSON.parse(fs.readFileSync(materialsPath, 'utf8'));
    const suppliers = JSON.parse(fs.readFileSync(suppliersPath, 'utf8'));
    
    console.log(`Found ${materials.length} materials in backup`);
    console.log(`Found ${suppliers.length} suppliers in backup`);
    
    // First, ensure all suppliers exist
    console.log('\n📋 Ensuring all suppliers exist...');
    for (const supplier of suppliers) {
      try {
        await prisma.supplier.upsert({
          where: { id: supplier.id },
          update: {
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            countryCode: supplier.countryCode,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            postalCode: supplier.postalCode,
            country: supplier.country,
            status: supplier.status,
            createdAt: new Date(supplier.createdAt),
            updatedAt: new Date(supplier.updatedAt)
          },
          create: {
            id: supplier.id,
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            countryCode: supplier.countryCode,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            postalCode: supplier.postalCode,
            country: supplier.country,
            status: supplier.status,
            createdAt: new Date(supplier.createdAt),
            updatedAt: new Date(supplier.updatedAt)
          }
        });
        console.log(`✅ Supplier: ${supplier.name}`);
      } catch (error) {
        console.log(`❌ Supplier ${supplier.name}: ${error.message}`);
      }
    }
    
    // Now restore all materials with GSM specifications
    console.log('\n📦 Restoring materials with GSM specifications...');
    let restored = 0;
    let updated = 0;
    
    for (const material of materials) {
      try {
        const existingMaterial = await prisma.material.findUnique({
          where: { id: material.id }
        });
        
        if (existingMaterial) {
          // Update existing material with GSM and other missing data
          await prisma.material.update({
            where: { id: material.id },
            data: {
              name: material.name,
              gsm: material.gsm,
              supplierId: material.supplierId,
              cost: material.cost,
              unit: material.unit,
              status: material.status,
              lastUpdated: new Date(material.lastUpdated),
              createdAt: new Date(material.createdAt),
              updatedAt: new Date(material.updatedAt)
            }
          });
          console.log(`🔄 Updated: ${material.name} (${material.gsm}gsm)`);
          updated++;
        } else {
          // Create new material
          await prisma.material.create({
            data: {
              id: material.id,
              materialId: material.materialId,
              name: material.name,
              gsm: material.gsm,
              supplierId: material.supplierId,
              cost: material.cost,
              unit: material.unit,
              status: material.status,
              lastUpdated: new Date(material.lastUpdated),
              createdAt: new Date(material.createdAt),
              updatedAt: new Date(material.updatedAt)
            }
          });
          console.log(`✅ Created: ${material.name} (${material.gsm}gsm)`);
          restored++;
        }
      } catch (error) {
        console.log(`❌ Failed to restore ${material.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Restoration completed!`);
    console.log(`- Created: ${restored} materials`);
    console.log(`- Updated: ${updated} materials`);
    
    // Final verification
    const finalMaterialCount = await prisma.material.count();
    const finalSupplierCount = await prisma.supplier.count();
    
    console.log(`\n📊 Final counts:`);
    console.log(`- Materials: ${finalMaterialCount}`);
    console.log(`- Suppliers: ${finalSupplierCount}`);
    
    // Show sample materials with GSM
    const sampleMaterials = await prisma.material.findMany({
      select: { name: true, gsm: true, cost: true },
      take: 5
    });
    
    console.log(`\n📋 Sample materials:`);
    sampleMaterials.forEach(m => console.log(`- ${m.name} (${m.gsm}gsm) - $${m.cost}`));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Restore failed:', error.message);
  }
}

restoreCompleteMaterials();

