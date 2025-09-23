const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function directSqliteRestore() {
  try {
    console.log('🔄 Starting DIRECT SQLite restoration from backup files...');
    console.log('⚠️  This script will ONLY ADD data, NEVER DELETE anything!');
    console.log('⚠️  Working ONLY with local database - NO production access!');
    console.log('⚠️  Using backup files from data/production-backup/ directory');
    
    const backupDir = path.join(__dirname, '..', 'data', 'production-backup');
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    
    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      throw new Error('Backup directory not found!');
    }
    
    console.log(`📁 Backup directory found: ${backupDir}`);
    console.log(`🗄️  Database path: ${dbPath}`);
    
    // Step 1: Restore Users
    console.log('\n👥 Step 1: Restoring users from backup...');
    const usersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'users.json'), 'utf8'));
    let usersRestored = 0;
    
    for (const user of usersData) {
      try {
        // Check if user already exists
        const existingUser = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM User WHERE email='${user.email}';"`, { encoding: 'utf8' }).trim();
        
        if (existingUser === '0') {
          const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO User (id, email, name, role, password, profilePicture, status, createdAt, updatedAt) VALUES ('${user.id}', '${user.email}', '${user.name.replace(/'/g, "''")}', '${user.role}', '${user.password}', ${user.profilePicture ? `'${user.profilePicture}'` : 'NULL'}, '${user.status}', '${user.createdAt}', '${user.updatedAt}');"`;
          execSync(insertCmd);
          usersRestored++;
          console.log(`   ✅ Added user: ${user.email} (${user.name})`);
        } else {
          console.log(`   ⏭️  User already exists: ${user.email}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore user ${user.email}: ${error.message}`);
      }
    }
    console.log(`✅ Users restored: ${usersRestored} new users added`);
    
    // Step 2: Restore Suppliers
    console.log('\n🏢 Step 2: Restoring suppliers from backup...');
    const suppliersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'suppliers.json'), 'utf8'));
    let suppliersRestored = 0;
    
    for (const supplier of suppliersData) {
      try {
        // Check if supplier already exists
        const existingSupplier = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Supplier WHERE email='${supplier.email}';"`, { encoding: 'utf8' }).trim();
        
        if (existingSupplier === '0') {
          const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Supplier (id, name, contact, email, phone, countryCode, address, city, state, postalCode, country, status, createdAt, updatedAt) VALUES ('${supplier.id}', '${supplier.name.replace(/'/g, "''")}', ${supplier.contact ? `'${supplier.contact.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.email ? `'${supplier.email}'` : 'NULL'}, ${supplier.phone ? `'${supplier.phone}'` : 'NULL'}, ${supplier.countryCode ? `'${supplier.countryCode}'` : 'NULL'}, ${supplier.address ? `'${supplier.address.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.city ? `'${supplier.city.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.state ? `'${supplier.state.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.postalCode ? `'${supplier.postalCode}'` : 'NULL'}, ${supplier.country ? `'${supplier.country}'` : 'NULL'}, '${supplier.status}', '${supplier.createdAt}', '${supplier.updatedAt}');"`;
          execSync(insertCmd);
          suppliersRestored++;
          console.log(`   ✅ Added supplier: ${supplier.name}`);
        } else {
          console.log(`   ⏭️  Supplier already exists: ${supplier.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore supplier ${supplier.name}: ${error.message}`);
      }
    }
    console.log(`✅ Suppliers restored: ${suppliersRestored} new suppliers added`);
    
    // Step 3: Restore Clients
    console.log('\n👤 Step 3: Restoring clients from backup...');
    const clientsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'clients.json'), 'utf8'));
    let clientsRestored = 0;
    
    for (const client of clientsData) {
      try {
        // Check if client already exists
        const existingClient = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Client WHERE email='${client.email}';"`, { encoding: 'utf8' }).trim();
        
        if (existingClient === '0') {
          const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Client (id, clientType, companyName, contactPerson, email, phone, countryCode, role, createdAt, updatedAt) VALUES ('${client.id}', '${client.clientType}', ${client.companyName ? `'${client.companyName.replace(/'/g, "''")}'` : 'NULL'}, '${client.contactPerson.replace(/'/g, "''")}', '${client.email}', '${client.phone}', '${client.countryCode}', ${client.role ? `'${client.role}'` : 'NULL'}, '${client.createdAt}', '${client.updatedAt}');"`;
          execSync(insertCmd);
          clientsRestored++;
          console.log(`   ✅ Added client: ${client.contactPerson} (${client.companyName || 'Individual'})`);
        } else {
          console.log(`   ⏭️  Client already exists: ${client.contactPerson}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore client ${client.contactPerson}: ${error.message}`);
      }
    }
    console.log(`✅ Clients restored: ${clientsRestored} new clients added`);
    
    // Step 4: Restore Materials with GSM extraction
    console.log('\n📦 Step 4: Restoring materials from backup with GSM extraction...');
    const materialsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'materials.json'), 'utf8'));
    let materialsRestored = 0;
    
    for (const material of materialsData) {
      try {
        // Check if material already exists
        const existingMaterial = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Material WHERE materialId='${material.materialId}';"`, { encoding: 'utf8' }).trim();
        
        if (existingMaterial === '0') {
          // Extract GSM from material name if available
          let gsmValue = 'NULL';
          if (material.name && material.name.includes('gsm')) {
            const gsmMatch = material.name.match(/(\d+)\s*gsm/i);
            if (gsmMatch) {
              gsmValue = `'${gsmMatch[1]}'`;
              console.log(`   📏 Extracted GSM: ${gsmMatch[1]} from "${material.name}"`);
            }
          }
          
          // Find supplier ID for this material
          const supplierId = execSync(`sqlite3 "${dbPath}" "SELECT id FROM Supplier WHERE name LIKE '%${material.supplierId}%' LIMIT 1;"`, { encoding: 'utf8' }).trim();
          
          if (supplierId) {
            const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Material (id, materialId, name, gsm, supplierId, cost, unit, status, lastUpdated, createdAt, updatedAt) VALUES ('${material.id}', '${material.materialId}', '${material.name.replace(/'/g, "''")}', ${gsmValue}, '${supplierId}', ${material.cost}, '${material.unit}', '${material.status}', '${material.lastUpdated}', '${material.createdAt}', '${material.updatedAt}');"`;
            execSync(insertCmd);
            materialsRestored++;
            console.log(`   ✅ Added material: ${material.name} (GSM: ${gsmValue === 'NULL' ? 'Not specified' : gsmValue.replace(/'/g, '')})`);
          } else {
            console.log(`   ⚠️  Supplier not found for material ${material.name}, skipping...`);
          }
        } else {
          console.log(`   ⏭️  Material already exists: ${material.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore material ${material.name}: ${error.message}`);
      }
    }
    console.log(`✅ Materials restored: ${materialsRestored} new materials added`);
    
    // Step 5: Restore Quotes
    console.log('\n📄 Step 5: Restoring quotes from backup...');
    const quotesData = JSON.parse(fs.readFileSync(path.join(backupDir, 'quotes.json'), 'utf8'));
    let quotesRestored = 0;
    
    for (const quote of quotesData) {
      try {
        // Check if quote already exists
        const existingQuote = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote WHERE quoteId='${quote.quoteId}';"`, { encoding: 'utf8' }).trim();
        
        if (existingQuote === '0') {
          // Find client ID for this quote
          const clientId = execSync(`sqlite3 "${dbPath}" "SELECT id FROM Client WHERE email='${quote.client?.email || 'unknown@example.com'}' LIMIT 1;"`, { encoding: 'utf8' }).trim();
          
          // Find user ID for this quote
          const userId = execSync(`sqlite3 "${dbPath}" "SELECT id FROM User WHERE email='${quote.user?.email || 'admin@example.com'}' LIMIT 1;"`, { encoding: 'utf8' }).trim();
          
          if (clientId && userId) {
            const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('${quote.id}', '${quote.quoteId}', '${quote.date}', '${quote.status}', '${clientId}', '${userId}', '${quote.product.replace(/'/g, "''")}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', ${quote.colors ? `'${quote.colors.replace(/'/g, "''")}'` : 'NULL'}, '${quote.createdAt}', '${quote.updatedAt}');"`;
            execSync(insertCmd);
            quotesRestored++;
            console.log(`   ✅ Added quote: ${quote.quoteId} for client ID: ${clientId}`);
          } else {
            console.log(`   ⚠️  Client or user not found for quote ${quote.quoteId}, skipping...`);
          }
        } else {
          console.log(`   ⏭️  Quote already exists: ${quote.quoteId}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore quote ${quote.quoteId}: ${error.message}`);
      }
    }
    console.log(`✅ Quotes restored: ${quotesRestored} new quotes added`);
    
    // Step 6: Restore Search History
    console.log('\n🔍 Step 6: Restoring search history from backup...');
    const searchHistoryData = JSON.parse(fs.readFileSync(path.join(backupDir, 'search-history.json'), 'utf8'));
    let searchHistoryRestored = 0;
    
    for (const history of searchHistoryData) {
      try {
        // Check if search history already exists
        const existingHistory = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM SearchHistory WHERE query='${history.query.replace(/'/g, "''")}' AND userId='${history.userId}' AND timestamp='${history.timestamp}';"`, { encoding: 'utf8' }).trim();
        
        if (existingHistory === '0') {
          const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO SearchHistory (id, query, timestamp, userId) VALUES ('${history.id}', '${history.query.replace(/'/g, "''")}', '${history.timestamp}', '${history.userId}');"`;
          execSync(insertCmd);
          searchHistoryRestored++;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore search history: ${error.message}`);
      }
    }
    console.log(`✅ Search history restored: ${searchHistoryRestored} new records added`);
    
    // Final summary
    console.log('\n🎉 DIRECT SQLite restoration completed successfully!');
    console.log(`📊 Restoration Summary:`);
    console.log(`   - Users added: ${usersRestored}`);
    console.log(`   - Suppliers added: ${suppliersRestored}`);
    console.log(`   - Clients added: ${clientsRestored}`);
    console.log(`   - Materials added: ${materialsRestored}`);
    console.log(`   - Quotes added: ${quotesRestored}`);
    console.log(`   - Search History added: ${searchHistoryRestored}`);
    
    // Show final database status
    console.log(`\n📊 Final Local Database Status:`);
    
    const finalUsers = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM User;"`, { encoding: 'utf8' }).trim();
    const finalSuppliers = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Supplier;"`, { encoding: 'utf8' }).trim();
    const finalMaterials = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Material;"`, { encoding: 'utf8' }).trim();
    const finalClients = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Client;"`, { encoding: 'utf8' }).trim();
    const finalQuotes = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote;"`, { encoding: 'utf8' }).trim();
    const finalSearchHistory = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM SearchHistory;"`, { encoding: 'utf8' }).trim();
    
    console.log(`   - Total Users: ${finalUsers}`);
    console.log(`   - Total Suppliers: ${finalSuppliers}`);
    console.log(`   - Total Materials: ${finalMaterials}`);
    console.log(`   - Total Clients: ${finalClients}`);
    console.log(`   - Total Quotes: ${finalQuotes}`);
    console.log(`   - Total Search History: ${finalSearchHistory}`);
    
    // Show admin user details
    const adminUser = execSync(`sqlite3 "${dbPath}" "SELECT email, name, role FROM User WHERE email='admin@example.com' LIMIT 1;"`, { encoding: 'utf8' }).trim();
    if (adminUser) {
      const [email, name, role] = adminUser.split('|');
      console.log(`\n👤 Admin User Available:`);
      console.log(`   - Email: ${email}`);
      console.log(`   - Name: ${name}`);
      console.log(`   - Role: ${role}`);
    }
    
    console.log('\n✅ Database restoration completed!');
    console.log('⚠️  Remember: This is your LOCAL database only!');
    console.log('⚠️  NEVER push changes back to production!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Your application should now work with data');
    console.log('   2. You can create quotes and manage data locally');
    console.log('   3. The GSM field is available for materials');
    
  } catch (error) {
    console.error('❌ Error during direct SQLite restoration:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message
    });
  }
}

directSqliteRestore();
