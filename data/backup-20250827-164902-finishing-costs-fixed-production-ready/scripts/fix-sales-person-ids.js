const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function fixSalesPersonIds() {
  console.log('🔧 Fixing sales person IDs for users...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // Get all users first
    console.log('📋 Getting existing users...');
    const usersResult = execSync(`sqlite3 "${dbPath}" "SELECT id, email, name, role, password, profilePicture, status, createdAt, updatedAt FROM User;"`, { encoding: 'utf8' });
    const users = usersResult.trim().split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('|');
      return {
        id: parts[0],
        email: parts[1],
        name: parts[2],
        role: parts[3],
        password: parts[4] || null,
        profilePicture: parts[5] || null,
        status: parts[6],
        createdAt: parts[7],
        updatedAt: parts[8]
      };
    });
    
    console.log(`Found ${users.length} users to update`);
    
    // Create a temporary table with the new structure
    console.log('📋 Creating temporary user table...');
    execSync(`sqlite3 "${dbPath}" "CREATE TABLE User_temp (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      password TEXT,
      profilePicture TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL,
      salesPersonId TEXT UNIQUE,
      isSalesPerson BOOLEAN DEFAULT 0
    );"`);
    
    // Insert users with sales person IDs
    console.log('👥 Inserting users with sales person IDs...');
    users.forEach((user, index) => {
      const salesPersonId = `EMP${String(index + 1).padStart(3, '0')}`;
      const isSalesPerson = user.role === 'admin' || user.role === 'manager' || user.role === 'user';
      
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO User_temp (
        id, email, name, role, password, profilePicture, status, createdAt, updatedAt, salesPersonId, isSalesPerson
      ) VALUES (
        '${user.id}', '${user.email}', '${user.name}', '${user.role}', 
        ${user.password ? `'${user.password}'` : 'NULL'}, 
        ${user.profilePicture ? `'${user.profilePicture}'` : 'NULL'}, 
        '${user.status}', '${user.createdAt}', '${user.updatedAt}', 
        '${salesPersonId}', ${isSalesPerson ? 1 : 0}
      );"`;
      
      try {
        execSync(insertCmd);
        console.log(`✅ Added user ${user.name} with sales person ID: ${salesPersonId}`);
      } catch (error) {
        console.log(`⚠️ Could not add user ${user.name}:`, error.message);
      }
    });
    
    // Drop old table and rename new one
    console.log('🔄 Replacing old user table...');
    execSync(`sqlite3 "${dbPath}" "DROP TABLE User;"`);
    execSync(`sqlite3 "${dbPath}" "ALTER TABLE User_temp RENAME TO User;"`);
    
    console.log('✅ Sales person IDs updated successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    try {
      const userColumns = execSync(`sqlite3 "${dbPath}" "PRAGMA table_info(User);"`, { encoding: 'utf8' });
      console.log('User table columns:');
      console.log(userColumns);
      
      const usersWithIds = execSync(`sqlite3 "${dbPath}" "SELECT name, email, role, salesPersonId, isSalesPerson FROM User;"`, { encoding: 'utf8' });
      console.log('\nUsers with sales person IDs:');
      console.log(usersWithIds);
      
    } catch (error) {
      console.log('⚠️ Error verifying changes:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error fixing sales person IDs:', error);
  }
}

fixSalesPersonIds();
