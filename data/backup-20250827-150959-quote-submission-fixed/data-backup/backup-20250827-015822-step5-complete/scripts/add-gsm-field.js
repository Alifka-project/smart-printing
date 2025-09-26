const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addGsmField() {
  try {
    console.log('Starting GSM field migration...');
    
    // Get all materials
    const materials = await prisma.material.findMany();
    console.log(`Found ${materials.length} materials to update`);
    
    // Update materials with GSM values extracted from names
    for (const material of materials) {
      let gsm = null;
      
      // Extract GSM from material names that contain it
      if (material.name.includes('gsm') || material.name.includes('GSM')) {
        const gsmMatch = material.name.match(/(\d+)\s*gsm/i);
        if (gsmMatch) {
          gsm = gsmMatch[1];
          console.log(`Extracted GSM ${gsm} from "${material.name}"`);
        }
      }
      
      // Update the material with GSM field
      await prisma.material.update({
        where: { id: material.id },
        data: { gsm }
      });
    }
    
    console.log('GSM field migration completed successfully!');
    
    // Display updated materials
    const updatedMaterials = await prisma.material.findMany();
    console.log('\nUpdated materials:');
    updatedMaterials.forEach(m => {
      console.log(`- ${m.name}${m.gsm ? ` (${m.gsm} gsm)` : ''}`);
    });
    
  } catch (error) {
    console.error('Error during GSM field migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addGsmField();
