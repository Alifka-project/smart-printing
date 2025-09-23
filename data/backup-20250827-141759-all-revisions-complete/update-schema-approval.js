const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function updateSchemaForApproval() {
  console.log('🔧 Updating database schema for approval workflow...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // Add new columns to User table
    console.log('📋 Adding sales person fields to User table...');
    try {
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE User ADD COLUMN salesPersonId TEXT UNIQUE;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE User ADD COLUMN isSalesPerson BOOLEAN DEFAULT 0;"`);
      console.log('✅ Sales person fields added to User table');
    } catch (error) {
      console.log('ℹ️ Sales person fields already exist or error occurred:', error.message);
    }

    // Add new columns to Quote table
    console.log('📋 Adding approval workflow fields to Quote table...');
    try {
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN approvalStatus TEXT DEFAULT 'Draft';"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN requiresApproval BOOLEAN DEFAULT 0;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN approvalReason TEXT;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN approvedBy TEXT;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN approvedAt DATETIME;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN approvalNotes TEXT;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN discountPercentage REAL DEFAULT 0;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN discountAmount REAL DEFAULT 0;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN marginPercentage REAL DEFAULT 15;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN marginAmount REAL DEFAULT 0;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN customerPdfEnabled BOOLEAN DEFAULT 1;"`);
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN sendToCustomerEnabled BOOLEAN DEFAULT 1;"`);
      console.log('✅ Approval workflow fields added to Quote table');
    } catch (error) {
      console.log('ℹ️ Approval workflow fields already exist or error occurred:', error.message);
    }

    // Update existing users to have sales person IDs
    console.log('👥 Updating existing users with sales person IDs...');
    try {
      const usersResult = execSync(`sqlite3 "${dbPath}" "SELECT id, role FROM User;"`, { encoding: 'utf8' });
      const users = usersResult.trim().split('\n').filter(line => line.trim());
      
      if (users.length > 0) {
        users.forEach((userLine, index) => {
          const [id, role] = userLine.split('|');
          const salesPersonId = `EMP${String(index + 1).padStart(3, '0')}`;
          const isSalesPerson = role === 'admin' || role === 'manager' || role === 'user';
          
          try {
            execSync(`sqlite3 "${dbPath}" "UPDATE User SET salesPersonId = '${salesPersonId}', isSalesPerson = ${isSalesPerson ? 1 : 0} WHERE id = '${id}';"`);
            console.log(`✅ Updated user ${id} with sales person ID: ${salesPersonId}`);
          } catch (updateError) {
            console.log(`⚠️ Could not update user ${id}:`, updateError.message);
          }
        });
      }
    } catch (error) {
      console.log('⚠️ Error updating users with sales person IDs:', error.message);
    }

    // Update existing quotes to have default approval values
    console.log('📋 Updating existing quotes with default approval values...');
    try {
      execSync(`sqlite3 "${dbPath}" "UPDATE Quote SET approvalStatus = 'Draft', requiresApproval = 0, customerPdfEnabled = 1, sendToCustomerEnabled = 1 WHERE approvalStatus IS NULL;"`);
      console.log('✅ Existing quotes updated with default approval values');
    } catch (error) {
      console.log('⚠️ Error updating existing quotes:', error.message);
    }

    console.log('✅ Database schema update completed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    try {
      const userColumns = execSync(`sqlite3 "${dbPath}" "PRAGMA table_info(User);"`, { encoding: 'utf8' });
      console.log('User table columns:');
      console.log(userColumns);
      
      const quoteColumns = execSync(`sqlite3 "${dbPath}" "PRAGMA table_info(Quote);"`, { encoding: 'utf8' });
      console.log('\nQuote table columns:');
      console.log(quoteColumns);
      
      const userCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM User;"`, { encoding: 'utf8' });
      console.log(`\nTotal users: ${userCount.trim()}`);
      
      const quoteCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote;"`, { encoding: 'utf8' });
      console.log(`Total quotes: ${quoteCount.trim()}`);
      
    } catch (error) {
      console.log('⚠️ Error verifying changes:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  }
}

updateSchemaForApproval();
