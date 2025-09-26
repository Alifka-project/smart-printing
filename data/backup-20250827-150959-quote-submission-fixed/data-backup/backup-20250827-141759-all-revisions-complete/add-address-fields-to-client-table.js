const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addAddressFieldsToClientTable() {
  try {
    console.log('Starting to add address fields to Client table...');
    
    // Path to the SQLite database
    const dbPath = path.join(__dirname, '../prisma/dev.db');
    console.log('Database path:', dbPath);
    
    // Open the database
    const db = new sqlite3.Database(dbPath);
    
    // Check if address columns already exist
    db.get("PRAGMA table_info(Client)", (err, rows) => {
      if (err) {
        console.error('Error checking table structure:', err);
        return;
      }
      
      console.log('Current Client table structure:');
      console.log(rows);
      
      // Check if address columns already exist
      const existingColumns = rows.map(row => row.name);
      console.log('Existing columns:', existingColumns);
      
      const addressColumns = ['address', 'city', 'state', 'postalCode', 'country'];
      const missingColumns = addressColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('✅ All address columns already exist in the Client table');
        db.close();
        return;
      }
      
      console.log('Missing address columns:', missingColumns);
      
      // Add missing address columns
      const addColumnPromises = missingColumns.map(columnName => {
        return new Promise((resolve, reject) => {
          const sql = `ALTER TABLE Client ADD COLUMN ${columnName} TEXT`;
          console.log(`Adding column: ${sql}`);
          
          db.run(sql, (err) => {
            if (err) {
              console.log(`❌ Could not add column ${columnName}:`, err.message);
              resolve(false);
            } else {
              console.log(`✅ Successfully added column: ${columnName}`);
              resolve(true);
            }
          });
        });
      });
      
      // Wait for all columns to be added
      Promise.all(addColumnPromises).then((results) => {
        const successCount = results.filter(Boolean).length;
        console.log(`\n📊 Column addition summary:`);
        console.log(`✅ Successfully added: ${successCount} columns`);
        console.log(`❌ Failed to add: ${missingColumns.length - successCount} columns`);
        
        if (successCount > 0) {
          console.log('\n🔄 Verifying table structure...');
          
          // Verify the new structure
          db.get("PRAGMA table_info(Client)", (err, rows) => {
            if (err) {
              console.error('Error verifying table structure:', err);
            } else {
              console.log('\n📋 Updated Client table structure:');
              console.log(rows);
              
              // Show only the address columns
              const addressColumnInfo = rows.filter(row => 
                ['address', 'city', 'state', 'postalCode', 'country'].includes(row.name)
              );
              
              if (addressColumnInfo.length > 0) {
                console.log('\n📍 Address columns in Client table:');
                addressColumnInfo.forEach(col => {
                  console.log(`  - ${col.name}: ${col.type} (nullable: ${col.notnull === 0 ? 'Yes' : 'No'})`);
                });
              }
            }
            
            console.log('\n🎉 Address fields addition process completed!');
            console.log('💡 You may need to restart your application for the changes to take effect.');
            db.close();
          });
        } else {
          console.log('\n❌ No columns were added. Please check the error messages above.');
          db.close();
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error adding address fields to Client table:', error);
  }
}

// Run the script
addAddressFieldsToClientTable()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
