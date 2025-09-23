const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// UAE Areas data - based on government information
const uaeAreas = [
  // Dubai Areas
  { name: 'Al Barsha', state: 'Dubai', country: 'UAE' },
  { name: 'Al Garhoud', state: 'Dubai', country: 'UAE' },
  { name: 'Al Jaddaf', state: 'Dubai', country: 'UAE' },
  { name: 'Al Jafiliya', state: 'Dubai', country: 'UAE' },
  { name: 'Al Karama', state: 'Dubai', country: 'UAE' },
  { name: 'Al Mamzar', state: 'Dubai', country: 'UAE' },
  { name: 'Al Mankhool', state: 'Dubai', country: 'UAE' },
  { name: 'Al Mizhar', state: 'Dubai', country: 'UAE' },
  { name: 'Al Nahda', state: 'Dubai', country: 'UAE' },
  { name: 'Al Qusais', state: 'Dubai', country: 'UAE' },
  { name: 'Al Raffa', state: 'Dubai', country: 'UAE' },
  { name: 'Al Ras', state: 'Dubai', country: 'UAE' },
  { name: 'Al Rigga', state: 'Dubai', country: 'UAE' },
  { name: 'Al Sabkha', state: 'Dubai', country: 'UAE' },
  { name: 'Al Safa', state: 'Dubai', country: 'UAE' },
  { name: 'Al Satwa', state: 'Dubai', country: 'UAE' },
  { name: 'Al Wasl', state: 'Dubai', country: 'UAE' },
  { name: 'Arabian Ranches', state: 'Dubai', country: 'UAE' },
  { name: 'Business Bay', state: 'Dubai', country: 'UAE' },
  { name: 'Deira', state: 'Dubai', country: 'UAE' },
  { name: 'Discovery Gardens', state: 'Dubai', country: 'UAE' },
  { name: 'Downtown Dubai', state: 'Dubai', country: 'UAE' },
  { name: 'Dubai Marina', state: 'Dubai', country: 'UAE' },
  { name: 'Dubai Silicon Oasis', state: 'Dubai', country: 'UAE' },
  { name: 'Dubai Sports City', state: 'Dubai', country: 'UAE' },
  { name: 'Emirates Hills', state: 'Dubai', country: 'UAE' },
  { name: 'International City', state: 'Dubai', country: 'UAE' },
  { name: 'Jebel Ali', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Beach Residence', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Golf Estates', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Islands', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Lakes Towers', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Park', state: 'Dubai', country: 'UAE' },
  { name: 'Knowledge Village', state: 'Dubai', country: 'UAE' },
  { name: 'Lakes', state: 'Dubai', country: 'UAE' },
  { name: 'Meadows', state: 'Dubai', country: 'UAE' },
  { name: 'Media City', state: 'Dubai', country: 'UAE' },
  { name: 'Mirdif', state: 'Dubai', country: 'UAE' },
  { name: 'Motor City', state: 'Dubai', country: 'UAE' },
  { name: 'Palm Jumeirah', state: 'Dubai', country: 'UAE' },
  { name: 'Palm Jebel Ali', state: 'Dubai', country: 'UAE' },
  { name: 'Palm Deira', state: 'Dubai', country: 'UAE' },
  { name: 'Palm Springs', state: 'Dubai', country: 'UAE' },
  { name: 'Springs', state: 'Dubai', country: 'UAE' },
  { name: 'Tecom', state: 'Dubai', country: 'UAE' },
  { name: 'Umm Al Sheif', state: 'Dubai', country: 'UAE' },
  { name: 'Umm Hurair', state: 'Dubai', country: 'UAE' },
  { name: 'Umm Ramool', state: 'Dubai', country: 'UAE' },
  { name: 'Umm Suqeim', state: 'Dubai', country: 'UAE' },
  { name: 'Victory Heights', state: 'Dubai', country: 'UAE' },
  { name: 'Warsan', state: 'Dubai', country: 'UAE' },
  
  // Abu Dhabi Areas
  { name: 'Al Ain', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Bateen', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Danah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Falah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Karamah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Khalidiyah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Maqtaa', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Maryah Island', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Mina', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Mushrif', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Nahyan', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Raha', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Raha Beach', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Ras Al Akhdar', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Reem Island', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Saadiyat Island', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Wahda', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Baniyas', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Corniche', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Khalifa City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Masdar City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Mohammed Bin Zayed City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Shakhbout City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Yas Island', state: 'Abu Dhabi', country: 'UAE' },
  
  // Sharjah Areas
  { name: 'Al Majaz', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Nahda', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Qasba', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Taawun', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Zahra', state: 'Sharjah', country: 'UAE' },
  { name: 'Muwailih', state: 'Sharjah', country: 'UAE' },
  { name: 'Sharjah Industrial Area', state: 'Sharjah', country: 'UAE' },
  
  // Ajman Areas
  { name: 'Ajman City', state: 'Ajman', country: 'UAE' },
  { name: 'Ajman Industrial Area', state: 'Ajman', country: 'UAE' },
  { name: 'Al Nuaimiya', state: 'Ajman', country: 'UAE' },
  { name: 'Al Rashidiya', state: 'Ajman', country: 'UAE' },
  
  // Umm Al Quwain Areas
  { name: 'Umm Al Quwain City', state: 'Umm Al Quwain', country: 'UAE' },
  { name: 'Umm Al Quwain Industrial Area', state: 'Umm Al Quwain', country: 'UAE' },
  
  // Ras Al Khaimah Areas
  { name: 'Al Hamra', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Jazeera Al Hamra', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Marjan Island', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Nakheel', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Qusaidat', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Rams', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Sall', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Uraibi', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Digdaga', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Fujairah City', state: 'Fujairah', country: 'UAE' },
  { name: 'Fujairah Industrial Area', state: 'Fujairah', country: 'UAE' }
];

async function populateUAEAreas() {
  try {
    console.log('🌍 Creating UAE Areas table and populating data...');
    
    // Create UAEArea table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS UAEArea (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        state TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'UAE',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ UAEArea table created');
    
    // Clear existing data
    await prisma.$executeRawUnsafe('DELETE FROM UAEArea');
    console.log('✅ Cleared existing UAE areas data');
    
    // Insert new data
    for (const area of uaeAreas) {
      const id = require('cuid')();
      await prisma.$executeRawUnsafe(`
        INSERT INTO UAEArea (id, name, state, country, createdAt, updatedAt)
        VALUES ('${id}', '${area.name}', '${area.state}', '${area.country}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
    }
    
    console.log(`✅ Created ${uaeAreas.length} UAE areas`);
    
    // Show some sample data
    const sampleAreas = await prisma.$queryRawUnsafe('SELECT * FROM UAEArea ORDER BY name LIMIT 10');
    
    console.log('\n📋 Sample UAE Areas:');
    sampleAreas.forEach(area => {
      console.log(`  - ${area.name} (${area.state})`);
    });
    
    console.log('\n🎉 UAE Areas population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateUAEAreas()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
