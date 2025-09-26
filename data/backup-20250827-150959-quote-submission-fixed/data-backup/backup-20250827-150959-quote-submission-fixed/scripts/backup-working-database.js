const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function backupWorkingDatabase() {
  console.log('💾 Creating backup of working database...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  const backupDir = path.join(__dirname, '..', 'data', 'working-database-backup');
  
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Step 1: Backup Users
    console.log('👥 Backing up users...');
    const usersResult = execSync(`sqlite3 "${dbPath}" "SELECT * FROM User;"`, { encoding: 'utf8' });
    const users = usersResult.trim().split('\n').map(line => {
      const columns = line.split('|');
      return {
        id: columns[0],
        email: columns[1],
        name: columns[2],
        role: columns[3],
        password: columns[4],
        profilePicture: columns[5] === 'NULL' ? null : columns[5],
        status: columns[6],
        createdAt: columns[7],
        updatedAt: columns[8]
      };
    });
    fs.writeFileSync(path.join(backupDir, 'users.json'), JSON.stringify(users, null, 2));
    
    // Step 2: Backup Suppliers
    console.log('📦 Backing up suppliers...');
    const suppliersResult = execSync(`sqlite3 "${dbPath}" "SELECT * FROM Supplier;"`, { encoding: 'utf8' });
    const suppliers = suppliersResult.trim().split('\n').map(line => {
      const columns = line.split('|');
      return {
        id: columns[0],
        name: columns[1],
        contact: columns[2] === 'NULL' ? null : columns[2],
        email: columns[3] === 'NULL' ? null : columns[3],
        phone: columns[4] === 'NULL' ? null : columns[4],
        countryCode: columns[5],
        address: columns[6] === 'NULL' ? null : columns[6],
        city: columns[7] === 'NULL' ? null : columns[7],
        state: columns[8] === 'NULL' ? null : columns[8],
        postalCode: columns[9] === 'NULL' ? null : columns[9],
        country: columns[10],
        status: columns[11],
        createdAt: columns[12],
        updatedAt: columns[13]
      };
    });
    fs.writeFileSync(path.join(backupDir, 'suppliers.json'), JSON.stringify(suppliers, null, 2));
    
    // Step 3: Backup Materials
    console.log('📄 Backing up materials...');
    const materialsResult = execSync(`sqlite3 "${dbPath}" "SELECT * FROM Material;"`, { encoding: 'utf8' });
    const materials = materialsResult.trim().split('\n').map(line => {
      const columns = line.split('|');
      return {
        id: columns[0],
        materialId: columns[1],
        name: columns[2],
        gsm: columns[3] === 'NULL' ? null : columns[3],
        supplierId: columns[4],
        cost: parseFloat(columns[5]),
        unit: columns[6],
        status: columns[7],
        lastUpdated: columns[8],
        createdAt: columns[9],
        updatedAt: columns[10]
      };
    });
    fs.writeFileSync(path.join(backupDir, 'materials.json'), JSON.stringify(materials, null, 2));
    
    // Step 4: Backup Clients
    console.log('🏢 Backing up clients...');
    const clientsResult = execSync(`sqlite3 "${dbPath}" "SELECT * FROM Client;"`, { encoding: 'utf8' });
    const clients = clientsResult.trim().split('\n').map(line => {
      const columns = line.split('|');
      return {
        id: columns[0],
        clientType: columns[1],
        companyName: columns[2] === 'NULL' ? null : columns[2],
        contactPerson: columns[3],
        email: columns[4],
        phone: columns[5],
        countryCode: columns[6],
        role: columns[7] === 'NULL' ? null : columns[7],
        createdAt: columns[8],
        updatedAt: columns[9],
        userId: columns[10] === 'NULL' ? null : columns[10]
      };
    });
    fs.writeFileSync(path.join(backupDir, 'clients.json'), JSON.stringify(clients, null, 2));
    
    // Step 5: Backup Quotes
    console.log('📋 Backing up quotes...');
    const quotesResult = execSync(`sqlite3 "${dbPath}" "SELECT * FROM Quote;"`, { encoding: 'utf8' });
    const quotes = quotesResult.trim().split('\n').map(line => {
      const columns = line.split('|');
      return {
        id: columns[0],
        quoteId: columns[1],
        date: columns[2],
        status: columns[3],
        clientId: columns[4],
        userId: columns[5] === 'NULL' ? null : columns[5],
        product: columns[6],
        quantity: parseInt(columns[7]),
        sides: columns[8],
        printing: columns[9],
        colors: columns[10] === 'NULL' ? null : columns[10],
        createdAt: columns[11],
        updatedAt: columns[12]
      };
    });
    fs.writeFileSync(path.join(backupDir, 'quotes.json'), JSON.stringify(quotes, null, 2));
    
    // Step 6: Backup Search History
    console.log('🔍 Backing up search history...');
    const searchResult = execSync(`sqlite3 "${dbPath}" "SELECT * FROM SearchHistory;"`, { encoding: 'utf8' });
    const searchHistory = searchResult.trim().split('\n').map(line => {
      const columns = line.split('|');
      return {
        id: columns[0],
        query: columns[1],
        timestamp: columns[2],
        userId: columns[3] === 'NULL' ? null : columns[3]
      };
    });
    fs.writeFileSync(path.join(backupDir, 'search-history.json'), JSON.stringify(searchHistory, null, 2));
    
    // Step 7: Create a summary file
    console.log('📊 Creating backup summary...');
    const summary = {
      backupDate: new Date().toISOString(),
      databaseVersion: 'Working Database Backup',
      tableCounts: {
        users: users.length,
        suppliers: suppliers.length,
        materials: materials.length,
        clients: clients.length,
        quotes: quotes.length,
        searchHistory: searchHistory.length
      },
      clientTypes: clients.reduce((acc, client) => {
        acc[client.clientType] = (acc[client.clientType] || 0) + 1;
        return acc;
      }, {}),
      quoteStatuses: quotes.reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
      }, {}),
      notes: 'This is a backup of the working database with all relationships properly established'
    };
    
    fs.writeFileSync(path.join(backupDir, 'backup-summary.json'), JSON.stringify(summary, null, 2));
    
    console.log('✅ Working database backup completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    console.log('\n📊 Backup Summary:');
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
  }
}

backupWorkingDatabase();
