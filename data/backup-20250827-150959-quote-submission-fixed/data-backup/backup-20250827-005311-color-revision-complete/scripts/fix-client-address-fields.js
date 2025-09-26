const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const prisma = new PrismaClient();

async function fixClientAddressFields() {
  try {
    console.log('Starting to fix client address fields...');
    
    // First, let's check the current database structure
    const dbPath = path.join(__dirname, '../prisma/dev.db');
    const db = new sqlite3.Database(dbPath);
    
    // Check if address columns already exist
    db.get("PRAGMA table_info(Client)", (err, rows) => {
      if (err) {
        console.error('Error checking table structure:', err);
        return;
      }
      
      console.log('Current Client table structure:', rows);
      
      // Add address columns if they don't exist
      const addColumns = [
        "ALTER TABLE Client ADD COLUMN address TEXT",
        "ALTER TABLE Client ADD COLUMN city TEXT", 
        "ALTER TABLE Client ADD COLUMN state TEXT",
        "ALTER TABLE Client ADD COLUMN postalCode TEXT",
        "ALTER TABLE Client ADD COLUMN country TEXT"
      ];
      
      addColumns.forEach((sql, index) => {
        db.run(sql, (err) => {
          if (err) {
            console.log(`Column ${index + 1} might already exist:`, err.message);
          } else {
            console.log(`Added column ${index + 1}`);
          }
        });
      });
      
      // After adding columns, populate with sample data
      setTimeout(() => populateAddressData(db), 1000);
    });
    
  } catch (error) {
    console.error('Error fixing client address fields:', error);
  }
}

async function populateAddressData(db) {
  try {
    console.log('Populating address data...');
    
    // Get all existing clients
    const clients = await prisma.client.findMany();
    console.log(`Found ${clients.length} clients to update`);
    
    // Update each client with sample address data
    for (const client of clients) {
      const addressData = generateSampleAddress(client.countryCode);
      
      try {
        await prisma.client.update({
          where: { id: client.id },
          data: {
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country,
          }
        });
        console.log(`Updated client ${client.contactPerson} with address data`);
      } catch (updateError) {
        console.log(`Could not update client ${client.contactPerson}:`, updateError.message);
      }
    }
    
    console.log('Address data population completed');
    
  } catch (error) {
    console.error('Error populating address data:', error);
  } finally {
    await prisma.$disconnect();
    db.close();
  }
}

function generateSampleAddress(countryCode) {
  const addressTemplates = {
    '+971': { // UAE
      address: 'Sheikh Zayed Road, Business Bay',
      city: 'Dubai',
      state: 'Dubai',
      postalCode: '12345',
      country: 'UAE'
    },
    '+91': { // India
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India'
    },
    '+62': { // Indonesia
      address: 'Jl. Sudirman No. 123',
      city: 'Jakarta',
      state: 'Jakarta',
      postalCode: '12190',
      country: 'Indonesia'
    },
    '+49': { // Germany
      address: 'Hauptstraße 123',
      city: 'Berlin',
      state: 'Berlin',
      postalCode: '10115',
      country: 'Germany'
    },
    '+31': { // Netherlands
      address: 'Hoofdstraat 123',
      city: 'Amsterdam',
      state: 'Noord-Holland',
      postalCode: '1000 AA',
      country: 'Netherlands'
    },
    '+1': { // USA
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    }
  };
  
  // Map other country codes to available templates
  const countryCodeMapping = {
    '+65': '+91', // Singapore -> India
    '+60': '+91', // Malaysia -> India
    '+852': '+91', // Hong Kong -> India
    '+34': '+91', // Spain -> India
    '+82': '+91', // South Korea -> India
    '+33': '+91', // France -> India
    '+41': '+91', // Switzerland -> India
    '+39': '+91', // Italy -> India
    '+46': '+91', // Sweden -> India
    '+358': '+91', // Finland -> India
    '+61': '+91', // Australia -> India
    '+32': '+91', // Belgium -> India
    '+44': '+91', // UK -> India
    '+353': '+91', // Ireland -> India
    '+81': '+91'  // Japan -> India
  };
  
  const mappedCountryCode = countryCodeMapping[countryCode] || countryCode;
  return addressTemplates[mappedCountryCode] || addressTemplates['+971']; // Default to UAE
}

// Run the script
fixClientAddressFields()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
