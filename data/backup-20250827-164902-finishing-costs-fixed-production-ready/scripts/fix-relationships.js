const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function fixRelationships() {
  console.log('🔧 Fixing database relationships...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // Get users
    const usersResult = execSync(`sqlite3 "${dbPath}" "SELECT id, role FROM User;"`, { encoding: 'utf8' });
    const users = usersResult.trim().split('\n').map(line => {
      const [id, role] = line.split('|');
      return { id, role };
    });
    
    console.log('Available users:', users);
    
    // Get a manager/admin user for quotes
    const managerUser = users.find(u => u.role === 'manager' || u.role === 'admin');
    const adminUser = users.find(u => u.role === 'admin');
    
    if (!managerUser || !adminUser) {
      console.error('❌ No manager or admin user found');
      return;
    }
    
    console.log('Using manager user:', managerUser.id, 'for quotes');
    console.log('Using admin user:', adminUser.id, 'for clients');
    
    // Update clients to assign them to admin user
    console.log('📋 Updating client relationships...');
    execSync(`sqlite3 "${dbPath}" "UPDATE Client SET userId = '${adminUser.id}' WHERE userId IS NULL;"`);
    
    // Update quotes to assign them to manager user
    console.log('📋 Updating quote relationships...');
    execSync(`sqlite3 "${dbPath}" "UPDATE Quote SET userId = '${managerUser.id}' WHERE userId IS NULL;"`);
    
    // Verify the relationships
    console.log('✅ Verifying relationships...');
    
    const clientsWithUsers = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Client WHERE userId IS NOT NULL;"`, { encoding: 'utf8' });
    console.log('Clients with user assignments:', clientsWithUsers.trim());
    
    const quotesWithUsers = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote WHERE userId IS NOT NULL;"`, { encoding: 'utf8' });
    console.log('Quotes with user assignments:', quotesWithUsers.trim());
    
    // Test client-quote relationships
    const clientQuoteJoin = execSync(`sqlite3 "${dbPath}" "SELECT q.quoteId, c.companyName FROM Quote q JOIN Client c ON q.clientId = c.id LIMIT 3;"`, { encoding: 'utf8' });
    console.log('Sample client-quote relationships:');
    console.log(clientQuoteJoin);
    
    // Test supplier-material relationships
    const supplierMaterialJoin = execSync(`sqlite3 "${dbPath}" "SELECT m.materialId, m.name, s.name as supplier FROM Material m JOIN Supplier s ON m.supplierId = s.id LIMIT 3;"`, { encoding: 'utf8' });
    console.log('Sample supplier-material relationships:');
    console.log(supplierMaterialJoin);
    
    console.log('✅ Relationships fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing relationships:', error);
  }
}

fixRelationships();
