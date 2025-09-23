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

async function restoreMissingSuppliers() {
  try {
    console.log('🔧 Restoring missing suppliers from backup...');
    
    // Read the backup file
    const backupPath = 'data/enhanced-database-backup/Supplier-2025-08-23T02-18-53-587Z.json';
    const suppliers = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log(`Found ${suppliers.length} suppliers in backup`);
    
    // Get current suppliers to avoid duplicates
    const currentSuppliers = await prisma.supplier.findMany({
      select: { name: true }
    });
    const currentNames = currentSuppliers.map(s => s.name);
    
    console.log('Current supplier names:', currentNames);
    
    // Restore missing suppliers
    let restored = 0;
    for (const supplier of suppliers) {
      if (!currentNames.includes(supplier.name)) {
        try {
          await prisma.supplier.create({
            data: {
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
          console.log(`✅ Restored: ${supplier.name}`);
          restored++;
        } catch (error) {
          console.log(`❌ Failed to restore ${supplier.name}: ${error.message}`);
        }
      } else {
        console.log(`⏭️  Already exists: ${supplier.name}`);
      }
    }
    
    console.log(`🎉 Restored ${restored} missing suppliers`);
    
    // Final count
    const finalCount = await prisma.supplier.count();
    console.log(`Total suppliers now: ${finalCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Restore failed:', error.message);
  }
}

restoreMissingSuppliers();

