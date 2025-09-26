const fs = require('fs');
const path = require('path');

async function addAddressFieldsToClientTable() {
  try {
    console.log('Starting to add address fields to Client table...');
    
    // Path to the SQLite database
    const dbPath = path.join(__dirname, '../prisma/dev.db');
    console.log('Database path:', dbPath);
    
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file not found:', dbPath);
      return;
    }
    
    console.log('✅ Database file found');
    
    // Since we can't directly modify SQLite without additional packages,
    // we'll create a SQL script that you can run manually
    
    const sqlScript = `-- SQL Script to add address fields to Client table
-- Run this script in your SQLite database

-- Check current table structure
PRAGMA table_info(Client);

-- Add address columns (these will be added as nullable TEXT fields)
ALTER TABLE Client ADD COLUMN address TEXT;
ALTER TABLE Client ADD COLUMN city TEXT;
ALTER TABLE Client ADD COLUMN state TEXT;
ALTER TABLE Client ADD COLUMN postalCode TEXT;
ALTER TABLE Client ADD COLUMN country TEXT;

-- Verify the new structure
PRAGMA table_info(Client);

-- Optional: Update existing clients with sample address data based on country code
UPDATE Client SET 
  address = CASE 
    WHEN countryCode = '+971' THEN 'Sheikh Zayed Road, Business Bay'
    WHEN countryCode = '+91' THEN '123 Main Street'
    WHEN countryCode = '+62' THEN 'Jl. Sudirman No. 123'
    WHEN countryCode = '+49' THEN 'Hauptstraße 123'
    WHEN countryCode = '+31' THEN 'Hoofdstraat 123'
    WHEN countryCode = '+1' THEN '123 Main Street'
    ELSE '123 Main Street'
  END,
  city = CASE 
    WHEN countryCode = '+971' THEN 'Dubai'
    WHEN countryCode = '+91' THEN 'Mumbai'
    WHEN countryCode = '+62' THEN 'Jakarta'
    WHEN countryCode = '+49' THEN 'Berlin'
    WHEN countryCode = '+31' THEN 'Amsterdam'
    WHEN countryCode = '+1' THEN 'New York'
    ELSE 'Mumbai'
  END,
  state = CASE 
    WHEN countryCode = '+971' THEN 'Dubai'
    WHEN countryCode = '+91' THEN 'Maharashtra'
    WHEN countryCode = '+62' THEN 'Jakarta'
    WHEN countryCode = '+49' THEN 'Berlin'
    WHEN countryCode = '+31' THEN 'Noord-Holland'
    WHEN countryCode = '+1' THEN 'NY'
    ELSE 'Maharashtra'
  END,
  postalCode = CASE 
    WHEN countryCode = '+971' THEN '12345'
    WHEN countryCode = '+91' THEN '400001'
    WHEN countryCode = '+62' THEN '12190'
    WHEN countryCode = '+49' THEN '10115'
    WHEN countryCode = '+31' THEN '1000 AA'
    WHEN countryCode = '+1' THEN '10001'
    ELSE '400001'
  END,
  country = CASE 
    WHEN countryCode = '+971' THEN 'UAE'
    WHEN countryCode = '+91' THEN 'India'
    WHEN countryCode = '+62' THEN 'Indonesia'
    WHEN countryCode = '+49' THEN 'Germany'
    WHEN countryCode = '+31' THEN 'Netherlands'
    WHEN countryCode = '+1' THEN 'USA'
    ELSE 'India'
  END;

-- Verify the data was updated
SELECT id, contactPerson, countryCode, address, city, state, postalCode, country FROM Client LIMIT 5;
`;

    const scriptPath = path.join(__dirname, 'add-address-fields.sql');
    fs.writeFileSync(scriptPath, sqlScript);
    
    console.log('\n📝 SQL script created successfully!');
    console.log('📁 Script location:', scriptPath);
    console.log('\n🔧 To add address fields to your Client table, you can:');
    console.log('\nOption 1: Use SQLite command line');
    console.log(`   sqlite3 "${dbPath}" < "${scriptPath}"`);
    console.log('\nOption 2: Use a SQLite GUI tool (like DB Browser for SQLite)');
    console.log('   - Open the database file');
    console.log('   - Run the SQL commands from the script');
    console.log('\nOption 3: Use the Node.js script (requires sqlite3 package)');
    console.log('   npm install sqlite3');
    console.log('   node scripts/add-address-fields-to-client-table.js');
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Backup your database before running any schema changes');
    console.log('   - The script will add nullable TEXT columns');
    console.log('   - Existing client data will be preserved');
    console.log('   - Sample address data will be populated based on country codes');
    
  } catch (error) {
    console.error('❌ Error creating SQL script:', error);
  }
}

// Run the script
addAddressFieldsToClientTable()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
