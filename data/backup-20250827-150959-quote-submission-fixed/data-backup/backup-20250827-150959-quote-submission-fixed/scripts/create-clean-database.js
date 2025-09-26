const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function createCleanDatabase() {
  console.log('🚀 Creating completely clean database...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // Step 1: Add users first
    console.log('👥 Adding users...');
    const users = [
      {
        id: 'user_admin_001',
        email: 'admin@smartprint.com',
        name: 'Admin',
        role: 'admin',
        password: 'admin123',
        status: 'Active'
      },
      {
        id: 'user_manager_001',
        email: 'manager@smartprint.com',
        name: 'Manager',
        role: 'manager',
        password: 'manager123',
        status: 'Active'
      },
      {
        id: 'user_estimator_001',
        email: 'estimator@smartprint.com',
        name: 'Estimator',
        role: 'estimator',
        password: 'estimator123',
        status: 'Active'
      }
    ];

    for (const user of users) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO User (id, email, name, role, password, status, createdAt, updatedAt) VALUES ('${user.id}', '${user.email}', '${user.name}', '${user.role}', '${user.password}', '${user.status}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 2: Add suppliers
    console.log('📦 Adding suppliers...');
    const suppliers = [
      {
        id: 'supplier_001',
        name: 'Al Ghurair Printing',
        contact: 'Ahmed Al Mansouri',
        email: 'info@alghurairprinting.ae',
        phone: '+971-4-123-4567',
        countryCode: '+971',
        address: 'Sheikh Zayed Road Business Bay',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '12345',
        country: 'UAE',
        status: 'Active'
      },
      {
        id: 'supplier_002',
        name: 'Emirates Paper Products',
        contact: 'Fatima Al Zaabi',
        email: 'sales@emiratespaper.ae',
        phone: '+971-2-987-6543',
        countryCode: '+971',
        address: 'Al Salam Street Al Ain',
        city: 'Al Ain',
        state: 'Abu Dhabi',
        postalCode: '54321',
        country: 'UAE',
        status: 'Active'
      },
      {
        id: 'supplier_003',
        name: 'Dubai Paper Mills',
        contact: 'Omar Al Falasi',
        email: 'orders@dubaipapermills.ae',
        phone: '+971-6-555-1234',
        countryCode: '+971',
        address: 'Industrial Area 15 Sharjah',
        city: 'Sharjah',
        state: 'Sharjah',
        postalCode: '67890',
        country: 'UAE',
        status: 'Active'
      }
    ];

    for (const supplier of suppliers) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Supplier (id, name, contact, email, phone, countryCode, address, city, state, postalCode, country, status, createdAt, updatedAt) VALUES ('${supplier.id}', '${supplier.name}', '${supplier.contact}', '${supplier.email}', '${supplier.phone}', '${supplier.countryCode}', '${supplier.address}', '${supplier.city}', '${supplier.state}', '${supplier.postalCode}', '${supplier.country}', '${supplier.status}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 3: Add materials
    console.log('📄 Adding materials...');
    const materials = [
      { id: 'mat_001', materialId: 'ART-300', name: 'Premium Art Paper', gsm: '300', supplierId: 'supplier_001', cost: 45.50, unit: 'packet' },
      { id: 'mat_002', materialId: 'ART-250', name: 'Premium Art Paper', gsm: '250', supplierId: 'supplier_001', cost: 38.75, unit: 'packet' },
      { id: 'mat_003', materialId: 'ART-200', name: 'Premium Art Paper', gsm: '200', supplierId: 'supplier_001', cost: 32.00, unit: 'packet' },
      { id: 'mat_004', materialId: 'GLOSS-300', name: 'High Gloss Paper', gsm: '300', supplierId: 'supplier_002', cost: 52.00, unit: 'packet' },
      { id: 'mat_005', materialId: 'GLOSS-250', name: 'High Gloss Paper', gsm: '250', supplierId: 'supplier_002', cost: 44.50, unit: 'packet' },
      { id: 'mat_006', materialId: 'CARD-400', name: 'Premium Cardboard', gsm: '400', supplierId: 'supplier_003', cost: 65.25, unit: 'packet' }
    ];

    for (const material of materials) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Material (id, materialId, name, gsm, supplierId, cost, unit, status, lastUpdated, createdAt, updatedAt) VALUES ('${material.id}', '${material.materialId}', '${material.name}', '${material.gsm}', '${material.supplierId}', ${material.cost}, '${material.unit}', 'Active', datetime('now'), datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 4: Add clients with proper types (Corporate and Small Business)
    console.log('🏢 Adding clients...');
    const clients = [
      // Corporate clients
      { id: 'client_corp_001', clientType: 'Corporate', companyName: 'Emaar Properties', contactPerson: 'Sarah Al Hashimi', email: 'marketing@emaar.ae', phone: '+971-4-366-8888', countryCode: '+971', role: 'Marketing Manager' },
      { id: 'client_corp_002', clientType: 'Corporate', companyName: 'Emirates NBD', contactPerson: 'Omar Al Zaabi', email: 'marketing@emiratesnbd.ae', phone: '+971-4-609-2222', countryCode: '+971', role: 'Marketing Director' },
      { id: 'client_corp_003', clientType: 'Corporate', companyName: 'Jumeirah Group', contactPerson: 'Aisha Al Falasi', email: 'marketing@jumeirah.com', phone: '+971-4-366-5000', countryCode: '+971', role: 'Marketing Manager' },
      { id: 'client_corp_004', clientType: 'Corporate', companyName: 'Chalhoub Group', contactPerson: 'Layla Al Qassimi', email: 'marketing@chalhoubgroup.com', phone: '+971-4-809-0000', countryCode: '+971', role: 'Marketing Director' },
      { id: 'client_corp_005', clientType: 'Corporate', companyName: 'Dubai Future Foundation', contactPerson: 'Zayed Al Nuaimi', email: 'communications@dubaifuture.ae', phone: '+971-4-455-8888', countryCode: '+971', role: 'Communications Director' },
      
      // Small Business clients
      { id: 'client_smb_001', clientType: 'Small Business', companyName: 'Desert Rose Design', contactPerson: 'Layla Al Nuaimi', email: 'hello@desertrosedesign.ae', phone: '+971-50-123-4567', countryCode: '+971', role: 'Founder' },
      { id: 'client_smb_002', clientType: 'Small Business', companyName: 'Camel Caravan Tours', contactPerson: 'Hassan Al Falasi', email: 'info@camelcaravan.ae', phone: '+971-55-987-6543', countryCode: '+971', role: 'Owner' },
      { id: 'client_smb_003', clientType: 'Small Business', companyName: 'Arabian Nights Events', contactPerson: 'Amina Al Zaabi', email: 'events@arabiannights.ae', phone: '+971-52-555-1234', countryCode: '+971', role: 'Event Manager' },
      { id: 'client_smb_004', clientType: 'Small Business', companyName: 'Desert Oasis Spa', contactPerson: 'Noora Al Qassimi', email: 'spa@desertoasis.ae', phone: '+971-54-777-8888', countryCode: '+971', role: 'Manager' },
      { id: 'client_smb_005', clientType: 'Small Business', companyName: 'Falcon Photography', contactPerson: 'Yousef Al Mansouri', email: 'photos@falconphotography.ae', phone: '+971-56-999-0000', countryCode: '+971', role: 'Photographer' }
    ];

    for (const client of clients) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Client (id, clientType, companyName, contactPerson, email, phone, countryCode, role, createdAt, updatedAt) VALUES ('${client.id}', '${client.clientType}', '${client.companyName}', '${client.contactPerson}', '${client.email}', '${client.phone}', '${client.countryCode}', '${client.role}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 5: Add simple quotes with no special characters
    console.log('📋 Adding quotes...');
    const quotes = [
      {
        id: 'quote_001',
        quoteId: 'QT-2025-001',
        date: '2025-01-15',
        status: 'Approved',
        clientId: 'client_corp_001',
        userId: 'user_manager_001',
        product: 'Corporate Brochures',
        quantity: 5000,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK'
      },
      {
        id: 'quote_002',
        quoteId: 'QT-2025-002',
        date: '2025-01-16',
        status: 'Pending',
        clientId: 'client_corp_002',
        userId: 'user_estimator_001',
        product: 'Business Cards',
        quantity: 2000,
        sides: 'Double-sided',
        printing: 'Offset',
        colors: '4 Colors CMYK'
      },
      {
        id: 'quote_003',
        quoteId: 'QT-2025-003',
        date: '2025-01-17',
        status: 'Approved',
        clientId: 'client_smb_001',
        userId: 'user_admin_001',
        product: 'Business Cards',
        quantity: 500,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '2 Colors Black'
      }
    ];

    for (const quote of quotes) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('${quote.id}', '${quote.quoteId}', '${quote.date}', '${quote.status}', '${quote.clientId}', '${quote.userId}', '${quote.product}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', '${quote.colors}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 6: Add quote amounts
    console.log('💰 Adding quote amounts...');
    const amounts = [
      { id: 'amount_001', base: 1250.00, vat: 62.50, total: 1312.50, quoteId: 'quote_001' },
      { id: 'amount_002', base: 580.00, vat: 29.00, total: 609.00, quoteId: 'quote_002' },
      { id: 'amount_003', base: 180.00, vat: 9.00, total: 189.00, quoteId: 'quote_003' }
    ];

    for (const amount of amounts) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO QuoteAmount (id, base, vat, total, quoteId) VALUES ('${amount.id}', ${amount.base}, ${amount.vat}, ${amount.total}, '${amount.quoteId}');"`;
      execSync(insertCmd);
    }

    // Step 7: Add search history
    console.log('🔍 Adding search history...');
    const searchQueries = [
      'business cards printing dubai',
      'brochure printing services',
      'offset printing companies',
      'digital printing uae',
      'paper suppliers dubai'
    ];

    for (let i = 0; i < 20; i++) {
      const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(Date.now() - (randomDaysAgo * 24 * 60 * 60 * 1000)).toISOString();
      
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO SearchHistory (id, query, timestamp) VALUES ('search_${i + 1}', '${randomQuery}', '${timestamp}');"`;
      execSync(insertCmd);
    }

    console.log('✅ Clean database created successfully!');
    
    // Display final counts
    const finalCounts = execSync(`sqlite3 "${dbPath}" "SELECT 'User' as table_name, COUNT(*) as count FROM User UNION ALL SELECT 'Supplier', COUNT(*) FROM Supplier UNION ALL SELECT 'Material', COUNT(*) FROM Material UNION ALL SELECT 'Client', COUNT(*) FROM Client UNION ALL SELECT 'Quote', COUNT(*) FROM Quote UNION ALL SELECT 'QuoteAmount', COUNT(*) FROM QuoteAmount UNION ALL SELECT 'SearchHistory', COUNT(*) FROM SearchHistory;"`, { encoding: 'utf8' });
    
    console.log('\n📊 Final Database Counts:');
    console.log(finalCounts);

    // Show client types distribution
    const clientTypes = execSync(`sqlite3 "${dbPath}" "SELECT clientType, COUNT(*) as count FROM Client GROUP BY clientType;"`, { encoding: 'utf8' });
    console.log('\n🏢 Client Types Distribution:');
    console.log(clientTypes);

  } catch (error) {
    console.error('❌ Error creating clean database:', error);
  }
}

createCleanDatabase();
