const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function restoreOriginalDatabase() {
  console.log('🔄 Restoring original database from backup...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  const backupDir = path.join(__dirname, '..', 'data', 'production-backup');
  
  try {
    // Step 1: Restore Users
    console.log('👥 Restoring users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'users.json'), 'utf8'));
    for (const user of usersData) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO User (id, email, name, role, password, profilePicture, status, createdAt, updatedAt) VALUES ('${user.id}', '${user.email}', '${user.name.replace(/'/g, "''")}', '${user.role}', '${user.password}', ${user.profilePicture ? `'${user.profilePicture}'` : 'NULL'}, '${user.status}', '${user.createdAt}', '${user.updatedAt}');"`;
      execSync(insertCmd);
    }

    // Step 2: Restore Suppliers
    console.log('📦 Restoring suppliers...');
    const suppliersData = JSON.parse(fs.readFileSync(path.join(backupDir, 'suppliers.json'), 'utf8'));
    for (const supplier of suppliersData) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Supplier (id, name, contact, email, phone, countryCode, address, city, state, postalCode, country, status, createdAt, updatedAt) VALUES ('${supplier.id}', '${supplier.name.replace(/'/g, "''")}', ${supplier.contact ? `'${supplier.contact.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.email ? `'${supplier.email}'` : 'NULL'}, ${supplier.phone ? `'${supplier.phone}'` : 'NULL'}, '${supplier.countryCode}', ${supplier.address ? `'${supplier.address.replace(/'/g, "''")}'` : 'NULL'}, ${supplier.city ? `'${supplier.city}'` : 'NULL'}, ${supplier.state ? `'${supplier.state}'` : 'NULL'}, ${supplier.postalCode ? `'${supplier.postalCode}'` : 'NULL'}, '${supplier.country}', '${supplier.status}', '${supplier.createdAt}', '${supplier.updatedAt}');"`;
      execSync(insertCmd);
    }

    // Step 3: Restore Materials
    console.log('📄 Restoring materials...');
    const materialsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'materials.json'), 'utf8'));
    for (const material of materialsData) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Material (id, materialId, name, gsm, supplierId, cost, unit, status, lastUpdated, createdAt, updatedAt) VALUES ('${material.id}', '${material.materialId}', '${material.name.replace(/'/g, "''")}', ${material.gsm ? `'${material.gsm}'` : 'NULL'}, '${material.supplierId}', ${material.cost}, '${material.unit}', '${material.status}', '${material.lastUpdated}', '${material.createdAt}', '${material.updatedAt}');"`;
      execSync(insertCmd);
    }

    // Step 4: Restore Clients
    console.log('🏢 Restoring clients...');
    const clientsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'clients.json'), 'utf8'));
    for (const client of clientsData) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Client (id, clientType, companyName, contactPerson, email, phone, countryCode, role, createdAt, updatedAt) VALUES ('${client.id}', '${client.clientType}', ${client.companyName ? `'${client.companyName.replace(/'/g, "''")}'` : 'NULL'}, '${client.contactPerson.replace(/'/g, "''")}', '${client.email}', '${client.phone}', '${client.countryCode}', ${client.role ? `'${client.role.replace(/'/g, "''")}'` : 'NULL'}, '${client.createdAt}', '${client.updatedAt}');"`;
      execSync(insertCmd);
    }

    // Step 5: Restore Quotes
    console.log('📋 Restoring quotes...');
    const quotesData = JSON.parse(fs.readFileSync(path.join(backupDir, 'quotes.json'), 'utf8'));
    for (const quote of quotesData) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('${quote.id}', '${quote.quoteId}', '${quote.date}', '${quote.status}', '${quote.clientId}', ${quote.userId ? `'${quote.userId}'` : 'NULL'}, '${quote.product.replace(/'/g, "''")}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', ${quote.colors ? `'${quote.colors.replace(/'/g, "''")}'` : 'NULL'}, '${quote.createdAt}', '${quote.updatedAt}');"`;
      execSync(insertCmd);
    }

    // Step 6: Restore Search History
    console.log('🔍 Restoring search history...');
    const searchData = JSON.parse(fs.readFileSync(path.join(backupDir, 'search-history.json'), 'utf8'));
    for (const search of searchData) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO SearchHistory (id, query, timestamp, userId) VALUES ('${search.id}', '${search.query.replace(/'/g, "''")}', '${search.timestamp}', ${search.userId ? `'${search.userId}'` : 'NULL'});"`;
      execSync(insertCmd);
    }

    console.log('✅ Original database restored successfully!');
    
    // Display final counts
    const finalCounts = execSync(`sqlite3 "${dbPath}" "SELECT 'User' as table_name, COUNT(*) as count FROM User UNION ALL SELECT 'Supplier', COUNT(*) FROM Supplier UNION ALL SELECT 'Material', COUNT(*) FROM Material UNION ALL SELECT 'Client', COUNT(*) FROM Client UNION ALL SELECT 'Quote', COUNT(*) FROM Quote UNION ALL SELECT 'SearchHistory', COUNT(*) FROM SearchHistory;"`, { encoding: 'utf8' });
    
    console.log('\n📊 Final Database Counts:');
    console.log(finalCounts);

    // Show client types distribution
    const clientTypes = execSync(`sqlite3 "${dbPath}" "SELECT clientType, COUNT(*) as count FROM Client GROUP BY clientType;"`, { encoding: 'utf8' });
    console.log('\n🏢 Client Types Distribution:');
    console.log(clientTypes);

  } catch (error) {
    console.error('❌ Error restoring database:', error);
  }
}

restoreOriginalDatabase();
