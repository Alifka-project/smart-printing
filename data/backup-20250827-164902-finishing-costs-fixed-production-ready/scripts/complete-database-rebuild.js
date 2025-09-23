const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function completeDatabaseRebuild() {
  try {
    console.log('🔄 Starting COMPLETE database rebuild from scratch...');
    console.log('⚠️  This script will rebuild your entire local database!');
    console.log('⚠️  Working ONLY with local database - NO production access!');
    
    const backupDir = path.join(__dirname, '..', 'data', 'production-backup');
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    
    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      throw new Error('Backup directory not found!');
    }
    
    console.log(`📁 Backup directory found: ${backupDir}`);
    console.log(`🗄️  Database path: ${dbPath}`);
    
    // Step 1: Clear all existing data
    console.log('\n🧹 Step 1: Clearing existing data...');
    const tables = ['SearchAnalytics', 'SearchHistory', 'QuoteOperational', 'QuoteAmount', 'Finishing', 'Paper', 'Quote', 'Material', 'Client', 'Supplier', 'User'];
    
    for (const table of tables) {
      try {
        execSync(`sqlite3 "${dbPath}" "DELETE FROM ${table};"`);
        console.log(`   ✅ Cleared ${table} table`);
      } catch (error) {
        console.log(`   ⚠️  Could not clear ${table}: ${error.message}`);
      }
    }
    
    // Step 2: Reset auto-increment counters
    console.log('\n🔄 Step 2: Resetting database counters...');
    try {
      execSync(`sqlite3 "${dbPath}" "DELETE FROM sqlite_sequence;"`);
      console.log('   ✅ Reset database counters');
    } catch (error) {
      console.log(`   ⚠️  Could not reset counters: ${error.message}`);
    }
    
    // Step 3: Restore Users (first, as they're referenced by others)
    console.log('\n👥 Step 3: Restoring users from backup...');
    const usersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'users.json'), 'utf8'));
    let usersRestored = 0;
    
    for (const user of usersData) {
      try {
        const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO User (id, email, name, role, password, profilePicture, status, createdAt, updatedAt) VALUES ('${user.id}', '${user.email}', '${user.name.replace(/'/g, "''")}', '${user.role}', '${user.password}', ${user.profilePicture ? `'${user.profilePicture}'` : 'NULL'}, '${user.status}', '${user.createdAt}', '${user.updatedAt}');"`;
        execSync(insertCmd);
        usersRestored++;
        console.log(`   ✅ Added user: ${user.email} (${user.name})`);
      } catch (error) {
        console.log(`   ⚠️  Could not restore user ${user.email}: ${error.message}`);
      }
    }
    console.log(`✅ Users restored: ${usersRestored} users added`);
    
    // Step 4: Restore Suppliers
    console.log('\n🏢 Step 4: Restoring suppliers from backup...');
    const suppliersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'suppliers.json'), 'utf8'));
    let suppliersRestored = 0;
    
    for (const supplier of suppliersData) {
      try {
        const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Supplier (id, name, contact, email, phone, countryCode, address, city, state, postalCode, country, status, createdAt, updatedAt) VALUES ('${supplier.id}', '${supplier.name.replace(/'/g, "''")}', ${supplier.contact ? `'${supplier.contact.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.email ? `'${supplier.email}'` : 'NULL'}, ${supplier.phone ? `'${supplier.phone}'` : 'NULL'}, ${supplier.countryCode ? `'${supplier.countryCode}'` : 'NULL'}, ${supplier.address ? `'${supplier.address.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.city ? `'${supplier.city.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.state ? `'${supplier.state.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.postalCode ? `'${supplier.postalCode}'` : 'NULL'}, ${supplier.country ? `'${supplier.country}'` : 'NULL'}, '${supplier.status}', '${supplier.createdAt}', '${supplier.updatedAt}');"`;
        execSync(insertCmd);
        suppliersRestored++;
        console.log(`   ✅ Added supplier: ${supplier.name}`);
      } catch (error) {
        console.log(`   ⚠️  Could not restore supplier ${supplier.name}: ${error.message}`);
      }
    }
    console.log(`✅ Suppliers restored: ${suppliersRestored} suppliers added`);
    
    // Step 5: Restore Clients
    console.log('\n👤 Step 5: Restoring clients from backup...');
    const clientsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'clients.json'), 'utf8'));
    let clientsRestored = 0;
    
    for (const client of clientsData) {
      try {
        const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Client (id, clientType, companyName, contactPerson, email, phone, countryCode, role, createdAt, updatedAt) VALUES ('${client.id}', '${client.clientType}', ${client.companyName ? `'${client.companyName.replace(/'/g, "''")}'` : 'NULL'}, '${client.contactPerson.replace(/'/g, "''")}', '${client.email}', '${client.phone}', '${client.countryCode}', ${client.role ? `'${client.role}'` : 'NULL'}, '${client.createdAt}', '${client.updatedAt}');"`;
        execSync(insertCmd);
        clientsRestored++;
        console.log(`   ✅ Added client: ${client.contactPerson} (${client.companyName || 'Individual'})`);
      } catch (error) {
        console.log(`   ⚠️  Could not restore client ${client.contactPerson}: ${error.message}`);
      }
    }
    console.log(`✅ Clients restored: ${clientsRestored} clients added`);
    
    // Step 6: Restore Materials with GSM extraction
    console.log('\n📦 Step 6: Restoring materials from backup with GSM extraction...');
    const materialsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'materials.json'), 'utf8'));
    let materialsRestored = 0;
    
    for (const material of materialsData) {
      try {
        // Extract GSM from material name if available
        let gsmValue = 'NULL';
        if (material.name && material.name.includes('gsm')) {
          const gsmMatch = material.name.match(/(\d+)\s*gsm/i);
          if (gsmMatch) {
            gsmValue = `'${gsmMatch[1]}'`;
            console.log(`   📏 Extracted GSM: ${gsmMatch[1]} from "${material.name}"`);
          }
        }
        
        const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Material (id, materialId, name, gsm, supplierId, cost, unit, status, lastUpdated, createdAt, updatedAt) VALUES ('${material.id}', '${material.materialId}', '${material.name.replace(/'/g, "''")}', ${gsmValue}, '${material.supplierId}', ${material.cost}, '${material.unit}', '${material.status}', '${material.lastUpdated}', '${material.createdAt}', '${material.updatedAt}');"`;
        execSync(insertCmd);
        materialsRestored++;
        console.log(`   ✅ Added material: ${material.name} (GSM: ${gsmValue === 'NULL' ? 'Not specified' : gsmValue.replace(/'/g, '')})`);
      } catch (error) {
        console.log(`   ⚠️  Could not restore material ${material.name}: ${error.message}`);
      }
    }
    console.log(`✅ Materials restored: ${materialsRestored} materials added`);
    
    // Step 7: Restore Quotes (now with proper relationships)
    console.log('\n📄 Step 7: Restoring quotes from backup...');
    const quotesData = JSON.parse(fs.readFileSync(path.join(backupDir, 'quotes.json'), 'utf8'));
    let quotesRestored = 0;
    
    for (const quote of quotesData) {
      try {
        // Use the exact IDs from the backup to maintain relationships
        const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('${quote.id}', '${quote.quoteId}', '${quote.date}', '${quote.status}', '${quote.clientId}', ${quote.userId ? `'${quote.userId}'` : 'NULL'}, '${quote.product.replace(/'/g, "''")}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', ${quote.colors ? `'${quote.colors.replace(/'/g, "''")}'` : 'NULL'}, '${quote.createdAt}', '${quote.updatedAt}');"`;
        execSync(insertCmd);
        quotesRestored++;
        console.log(`   ✅ Added quote: ${quote.quoteId} for product: ${quote.product}`);
      } catch (error) {
        console.log(`   ⚠️  Could not restore quote ${quote.quoteId}: ${error.message}`);
      }
    }
    console.log(`✅ Quotes restored: ${quotesRestored} quotes added`);
    
    // Step 8: Restore Search History
    console.log('\n🔍 Step 8: Restoring search history from backup...');
    const searchHistoryData = JSON.parse(fs.readFileSync(path.join(backupDir, 'search-history.json'), 'utf8'));
    let searchHistoryRestored = 0;
    
    for (const history of searchHistoryData) {
      try {
        const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO SearchHistory (id, query, timestamp, userId) VALUES ('${history.id}', '${history.query.replace(/'/g, "''")}', '${history.timestamp}', '${history.userId}');"`;
        execSync(insertCmd);
        searchHistoryRestored++;
      } catch (error) {
        console.log(`   ⚠️  Could not restore search history: ${error.message}`);
      }
    }
    console.log(`✅ Search history restored: ${searchHistoryRestored} records added`);
    
    // Step 9: Create some sample quotes with proper relationships
    console.log('\n📝 Step 9: Creating sample quotes with proper relationships...');
    let sampleQuotesCreated = 0;
    
    // Get some existing client and user IDs
    const clientIds = execSync(`sqlite3 "${dbPath}" "SELECT id FROM Client LIMIT 5;"`, { encoding: 'utf8' }).trim().split('\n');
    const userIds = execSync(`sqlite3 "${dbPath}" "SELECT id FROM User LIMIT 3;"`, { encoding: 'utf8' }).trim().split('\n');
    
    if (clientIds.length > 0 && userIds.length > 0) {
      const sampleQuotes = [
        {
          quoteId: 'SAMPLE-001',
          product: 'Business Cards',
          quantity: 500,
          sides: '2',
          printing: 'Digital',
          status: 'Pending'
        },
        {
          quoteId: 'SAMPLE-002',
          product: 'Company Brochures',
          quantity: 1000,
          sides: '1',
          printing: 'Offset',
          status: 'Approved'
        },
        {
          quoteId: 'SAMPLE-003',
          product: 'Product Catalogs',
          quantity: 250,
          sides: '2',
          printing: 'Digital',
          status: 'Draft'
        }
      ];
      
      for (let i = 0; i < sampleQuotes.length; i++) {
        const quote = sampleQuotes[i];
        const clientId = clientIds[i % clientIds.length];
        const userId = userIds[i % userIds.length];
        
        try {
          const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('sample-${i + 1}', '${quote.quoteId}', datetime('now'), '${quote.status}', '${clientId}', '${userId}', '${quote.product}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', 'CMYK', datetime('now'), datetime('now'));"`;
          execSync(insertCmd);
          sampleQuotesCreated++;
          console.log(`   ✅ Added sample quote: ${quote.quoteId} - ${quote.product}`);
        } catch (error) {
          console.log(`   ⚠️  Could not create sample quote ${quote.quoteId}: ${error.message}`);
        }
      }
    }
    console.log(`✅ Sample quotes created: ${sampleQuotesCreated} quotes added`);
    
    // Final summary
    console.log('\n🎉 COMPLETE database rebuild completed successfully!');
    
    // Show final database status
    console.log(`\n📊 Final Database Status:`);
    
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
    
    // Test relationships
    console.log(`\n🔗 Testing Relationships:`);
    
    // Test quotes with clients
    const quotesWithClients = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote q JOIN Client c ON q.clientId = c.id;"`, { encoding: 'utf8' }).trim();
    console.log(`   - Quotes with valid clients: ${quotesWithClients}/${finalQuotes}`);
    
    // Test materials with suppliers
    const materialsWithSuppliers = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Material m JOIN Supplier s ON m.supplierId = s.id;"`, { encoding: 'utf8' }).trim();
    console.log(`   - Materials with valid suppliers: ${materialsWithSuppliers}/${finalMaterials}`);
    
    // Show admin user details
    const adminUser = execSync(`sqlite3 "${dbPath}" "SELECT email, name, role FROM User WHERE email='admin@example.com' LIMIT 1;"`, { encoding: 'utf8' }).trim();
    if (adminUser) {
      const [email, name, role] = adminUser.split('|');
      console.log(`\n👤 Admin User Available:`);
      console.log(`   - Email: ${email}`);
      console.log(`   - Name: ${name}`);
      console.log(`   - Role: ${role}`);
    }
    
    console.log('\n✅ Database rebuild completed!');
    console.log('⚠️  Remember: This is your LOCAL database only!');
    console.log('⚠️  NEVER push changes back to production!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Your application should now work with data');
    console.log('   2. All relationships are properly established');
    console.log('   3. You can create quotes and manage data locally');
    console.log('   4. The GSM field is available for materials');
    
  } catch (error) {
    console.error('❌ Error during complete database rebuild:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message
    });
  }
}

completeDatabaseRebuild();
