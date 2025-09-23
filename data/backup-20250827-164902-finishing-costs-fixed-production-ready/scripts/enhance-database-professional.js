const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function enhanceDatabaseProfessional() {
  console.log('🚀 Starting professional database enhancement...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // Step 1: Enhance Suppliers with realistic UAE-based printing companies
    console.log('📦 Enhancing suppliers...');
    const suppliers = [
      {
        id: 'supplier_uae_paper_001',
        name: 'Al Ghurair Printing & Publishing',
        contact: 'Ahmed Al Mansouri',
        email: 'info@alghurairprinting.ae',
        phone: '+971-4-123-4567',
        countryCode: '+971',
        address: 'Sheikh Zayed Road, Business Bay',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '12345',
        country: 'UAE',
        status: 'Active'
      },
      {
        id: 'supplier_uae_paper_002',
        name: 'Emirates Paper Products Co.',
        contact: 'Fatima Al Zaabi',
        email: 'sales@emiratespaper.ae',
        phone: '+971-2-987-6543',
        countryCode: '+971',
        address: 'Al Salam Street, Al Ain',
        city: 'Al Ain',
        state: 'Abu Dhabi',
        postalCode: '54321',
        country: 'UAE',
        status: 'Active'
      },
      {
        id: 'supplier_uae_paper_003',
        name: 'Dubai Paper Mills',
        contact: 'Omar Al Falasi',
        email: 'orders@dubaipapermills.ae',
        phone: '+971-6-555-1234',
        countryCode: '+971',
        address: 'Industrial Area 15, Sharjah',
        city: 'Sharjah',
        state: 'Sharjah',
        postalCode: '67890',
        country: 'UAE',
        status: 'Active'
      },
      {
        id: 'supplier_uae_paper_004',
        name: 'Abu Dhabi Paper Solutions',
        contact: 'Mariam Al Qassimi',
        email: 'contact@adpapersolutions.ae',
        phone: '+971-2-456-7890',
        countryCode: '+971',
        address: 'Corniche Road, Al Bateen',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        postalCode: '11111',
        country: 'UAE',
        status: 'Active'
      },
      {
        id: 'supplier_uae_paper_005',
        name: 'Ras Al Khaimah Paper Co.',
        contact: 'Khalid Al Nuaimi',
        email: 'info@rakpaper.ae',
        phone: '+971-7-777-8888',
        countryCode: '+971',
        address: 'Al Qusaidat Industrial Area',
        city: 'Ras Al Khaimah',
        state: 'Ras Al Khaimah',
        postalCode: '22222',
        country: 'UAE',
        status: 'Active'
      }
    ];

    // Clear existing suppliers and add new ones
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Supplier;"`);
    
    for (const supplier of suppliers) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Supplier (id, name, contact, email, phone, countryCode, address, city, state, postalCode, country, status, createdAt, updatedAt) VALUES ('${supplier.id}', '${supplier.name.replace(/'/g, "''")}', '${supplier.contact.replace(/'/g, "''")}', '${supplier.email}', '${supplier.phone}', '${supplier.countryCode}', '${supplier.address.replace(/'/g, "''")}', '${supplier.city}', '${supplier.state}', '${supplier.postalCode}', '${supplier.country}', '${supplier.status}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 2: Enhance Materials with realistic printing materials
    console.log('📄 Enhancing materials...');
    const materials = [
      // Art Papers
      { id: 'mat_art_001', materialId: 'ART-300', name: 'Premium Art Paper', gsm: '300', supplierId: 'supplier_uae_paper_001', cost: 45.50, unit: 'packet' },
      { id: 'mat_art_002', materialId: 'ART-250', name: 'Premium Art Paper', gsm: '250', supplierId: 'supplier_uae_paper_001', cost: 38.75, unit: 'packet' },
      { id: 'mat_art_003', materialId: 'ART-200', name: 'Premium Art Paper', gsm: '200', supplierId: 'supplier_uae_paper_001', cost: 32.00, unit: 'packet' },
      { id: 'mat_art_004', materialId: 'ART-150', name: 'Premium Art Paper', gsm: '150', supplierId: 'supplier_uae_paper_001', cost: 28.50, unit: 'packet' },
      { id: 'mat_art_005', materialId: 'ART-120', name: 'Premium Art Paper', gsm: '120', supplierId: 'supplier_uae_paper_001', cost: 24.25, unit: 'packet' },
      
      // Glossy Papers
      { id: 'mat_gloss_001', materialId: 'GLOSS-300', name: 'High Gloss Paper', gsm: '300', supplierId: 'supplier_uae_paper_002', cost: 52.00, unit: 'packet' },
      { id: 'mat_gloss_002', materialId: 'GLOSS-250', name: 'High Gloss Paper', gsm: '250', supplierId: 'supplier_uae_paper_002', cost: 44.50, unit: 'packet' },
      { id: 'mat_gloss_003', materialId: 'GLOSS-200', name: 'High Gloss Paper', gsm: '200', supplierId: 'supplier_uae_paper_002', cost: 37.75, unit: 'packet' },
      { id: 'mat_gloss_004', materialId: 'GLOSS-150', name: 'High Gloss Paper', gsm: '150', supplierId: 'supplier_uae_paper_002', cost: 31.25, unit: 'packet' },
      
      // Matte Papers
      { id: 'mat_matte_001', materialId: 'MATTE-300', name: 'Premium Matte Paper', gsm: '300', supplierId: 'supplier_uae_paper_003', cost: 48.75, unit: 'packet' },
      { id: 'mat_matte_002', materialId: 'MATTE-250', name: 'Premium Matte Paper', gsm: '250', supplierId: 'supplier_uae_paper_003', cost: 41.50, unit: 'packet' },
      { id: 'mat_matte_003', materialId: 'MATTE-200', name: 'Premium Matte Paper', gsm: '200', supplierId: 'supplier_uae_paper_003', cost: 35.00, unit: 'packet' },
      
      // Cardboard & Heavy Papers
      { id: 'mat_card_001', materialId: 'CARD-400', name: 'Premium Cardboard', gsm: '400', supplierId: 'supplier_uae_paper_004', cost: 65.25, unit: 'packet' },
      { id: 'mat_card_002', materialId: 'CARD-350', name: 'Premium Cardboard', gsm: '350', supplierId: 'supplier_uae_paper_004', cost: 58.50, unit: 'packet' },
      { id: 'mat_card_003', materialId: 'CARD-300', name: 'Premium Cardboard', gsm: '300', supplierId: 'supplier_uae_paper_004', cost: 52.75, unit: 'packet' },
      
      // Special Papers
      { id: 'mat_special_001', materialId: 'SPEC-250', name: 'Metallic Paper', gsm: '250', supplierId: 'supplier_uae_paper_005', cost: 78.50, unit: 'packet' },
      { id: 'mat_special_002', materialId: 'SPEC-200', name: 'Textured Paper', gsm: '200', supplierId: 'supplier_uae_paper_005', cost: 62.25, unit: 'packet' },
      { id: 'mat_special_003', materialId: 'SPEC-180', name: 'Recycled Paper', gsm: '180', supplierId: 'supplier_uae_paper_005', cost: 28.75, unit: 'packet' }
    ];

    // Clear existing materials and add new ones
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Material;"`);
    
    for (const material of materials) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Material (id, materialId, name, gsm, supplierId, cost, unit, status, lastUpdated, createdAt, updatedAt) VALUES ('${material.id}', '${material.materialId}', '${material.name.replace(/'/g, "''")}', '${material.gsm}', '${material.supplierId}', ${material.cost}, '${material.unit}', 'Active', datetime('now'), datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 3: Enhance Clients with realistic UAE companies
    console.log('🏢 Enhancing clients...');
    const clients = [
      // Real Estate & Property
      { id: 'client_re_001', clientType: 'Corporate', companyName: 'Emaar Properties PJSC', contactPerson: 'Sarah Al Hashimi', email: 'marketing@emaar.ae', phone: '+971-4-366-8888', countryCode: '+971', role: 'Marketing Manager' },
      { id: 'client_re_002', clientType: 'Corporate', companyName: 'Meraas Holding', contactPerson: 'Ahmed Al Falasi', email: 'communications@meraas.ae', phone: '+971-4-317-7777', countryCode: '+971', role: 'Communications Director' },
      { id: 'client_re_003', clientType: 'Corporate', companyName: 'Nakheel Properties', contactPerson: 'Fatima Al Mansouri', email: 'branding@nakheel.ae', phone: '+971-4-390-3333', countryCode: '+971', role: 'Brand Manager' },
      
      // Banking & Finance
      { id: 'client_bank_001', clientType: 'Corporate', companyName: 'Emirates NBD', contactPerson: 'Omar Al Zaabi', email: 'marketing@emiratesnbd.ae', phone: '+971-4-609-2222', countryCode: '+971', role: 'Marketing Director' },
      { id: 'client_bank_002', clientType: 'Corporate', companyName: 'Abu Dhabi Commercial Bank', contactPerson: 'Mariam Al Qassimi', email: 'communications@adcb.ae', phone: '+971-2-621-0100', countryCode: '+971', role: 'Communications Manager' },
      { id: 'client_bank_003', clientType: 'Corporate', companyName: 'Mashreq Bank', contactPerson: 'Khalid Al Nuaimi', email: 'branding@mashreq.ae', phone: '+971-4-424-7000', countryCode: '+971', role: 'Brand Director' },
      
      // Hospitality & Tourism
      { id: 'client_hotel_001', clientType: 'Corporate', companyName: 'Jumeirah Group', contactPerson: 'Aisha Al Falasi', email: 'marketing@jumeirah.com', phone: '+971-4-366-5000', countryCode: '+971', role: 'Marketing Manager' },
      { id: 'client_hotel_002', clientType: 'Corporate', companyName: 'Atlantis Dubai', contactPerson: 'Hassan Al Mansouri', email: 'communications@atlantisdubai.com', phone: '+971-4-426-1000', countryCode: '+971', role: 'Communications Director' },
      { id: 'client_hotel_003', clientType: 'Corporate', companyName: 'Emirates Palace', contactPerson: 'Noora Al Zaabi', email: 'branding@emiratespalace.ae', phone: '+971-2-690-9000', countryCode: '+971', role: 'Brand Manager' },
      
      // Retail & Fashion
      { id: 'client_retail_001', clientType: 'Corporate', companyName: 'Chalhoub Group', contactPerson: 'Layla Al Qassimi', email: 'marketing@chalhoubgroup.com', phone: '+971-4-809-0000', countryCode: '+971', role: 'Marketing Director' },
      { id: 'client_retail_002', clientType: 'Corporate', companyName: 'Al Tayer Group', contactPerson: 'Yousef Al Falasi', email: 'communications@altayer.ae', phone: '+971-4-295-5000', countryCode: '+971', role: 'Communications Manager' },
      { id: 'client_retail_003', clientType: 'Corporate', companyName: 'Majid Al Futtaim', contactPerson: 'Amina Al Mansouri', email: 'branding@maf.ae', phone: '+971-4-809-0000', countryCode: '+971', role: 'Brand Director' },
      
      // Technology & Innovation
      { id: 'client_tech_001', clientType: 'Corporate', companyName: 'Dubai Future Foundation', contactPerson: 'Zayed Al Nuaimi', email: 'communications@dubaifuture.ae', phone: '+971-4-455-8888', countryCode: '+971', role: 'Communications Director' },
      { id: 'client_tech_002', clientType: 'Corporate', companyName: 'Abu Dhabi Digital Authority', contactPerson: 'Salem Al Zaabi', email: 'marketing@digitalabudhabi.ae', phone: '+971-2-418-0000', countryCode: '+971', role: 'Marketing Manager' },
      { id: 'client_tech_003', clientType: 'Corporate', companyName: 'Smart Dubai', contactPerson: 'Huda Al Falasi', email: 'branding@smartdubai.ae', phone: '+971-4-455-8888', countryCode: '+971', role: 'Brand Manager' },
      
      // Healthcare & Medical
      { id: 'client_health_001', clientType: 'Corporate', companyName: 'Cleveland Clinic Abu Dhabi', contactPerson: 'Dr. Amira Al Qassimi', email: 'marketing@clevelandclinicabudhabi.ae', phone: '+971-2-659-0200', countryCode: '+971', role: 'Marketing Director' },
      { id: 'client_health_002', clientType: 'Corporate', companyName: 'American Hospital Dubai', contactPerson: 'Dr. Khalid Al Mansouri', email: 'communications@ahdubai.com', phone: '+971-4-377-5000', countryCode: '+971', role: 'Communications Manager' },
      { id: 'client_health_003', clientType: 'Corporate', companyName: 'Medcare Hospital', contactPerson: 'Dr. Fatima Al Zaabi', email: 'branding@medcare.ae', phone: '+971-4-407-0000', countryCode: '+971', role: 'Brand Manager' },
      
      // Education & Universities
      { id: 'client_edu_001', clientType: 'Corporate', companyName: 'American University of Dubai', contactPerson: 'Prof. Sarah Al Falasi', email: 'marketing@aud.edu', phone: '+971-4-318-3100', countryCode: '+971', role: 'Marketing Director' },
      { id: 'client_edu_002', clientType: 'Corporate', companyName: 'Zayed University', contactPerson: 'Prof. Omar Al Qassimi', email: 'communications@zu.ac.ae', phone: '+971-2-599-3333', countryCode: '+971', role: 'Communications Manager' },
      { id: 'client_edu_003', clientType: 'Corporate', companyName: 'Heriot-Watt University Dubai', contactPerson: 'Prof. Mariam Al Mansouri', email: 'branding@hw.ac.uk', phone: '+971-4-435-7000', countryCode: '+971', role: 'Brand Manager' },
      
      // Small Businesses & Startups
      { id: 'client_smb_001', clientType: 'Small Business', companyName: 'Desert Rose Design Studio', contactPerson: 'Layla Al Nuaimi', email: 'hello@desertrosedesign.ae', phone: '+971-50-123-4567', countryCode: '+971', role: 'Founder' },
      { id: 'client_smb_002', clientType: 'Small Business', companyName: 'Camel Caravan Tours', contactPerson: 'Hassan Al Falasi', email: 'info@camelcaravan.ae', phone: '+971-55-987-6543', countryCode: '+971', role: 'Owner' },
      { id: 'client_smb_003', clientType: 'Small Business', companyName: 'Arabian Nights Events', contactPerson: 'Amina Al Zaabi', email: 'events@arabiannights.ae', phone: '+971-52-555-1234', countryCode: '+971', role: 'Event Manager' },
      { id: 'client_smb_004', clientType: 'Small Business', companyName: 'Desert Oasis Spa', contactPerson: 'Noora Al Qassimi', email: 'spa@desertoasis.ae', phone: '+971-54-777-8888', countryCode: '+971', role: 'Manager' },
      { id: 'client_smb_005', clientType: 'Small Business', companyName: 'Falcon Photography', contactPerson: 'Yousef Al Mansouri', email: 'photos@falconphotography.ae', phone: '+971-56-999-0000', countryCode: '+971', role: 'Photographer' }
    ];

    // Clear existing clients and add new ones
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Client;"`);
    
    for (const client of clients) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Client (id, clientType, companyName, contactPerson, email, phone, countryCode, role, createdAt, updatedAt) VALUES ('${client.id}', '${client.clientType}', ${client.companyName ? `'${client.companyName.replace(/'/g, "''")}'` : 'NULL'}, '${client.contactPerson.replace(/'/g, "''")}', '${client.email}', '${client.phone}', '${client.countryCode}', ${client.role ? `'${client.role.replace(/'/g, "''")}'` : 'NULL'}, datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 4: Create realistic quotes with detailed specifications
    console.log('📋 Creating realistic quotes...');
    
    // Clear existing quotes and related data
    execSync(`sqlite3 "${dbPath}" "DELETE FROM QuoteOperational;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM QuoteAmount;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Finishing;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Paper;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Quote;"`);
    
    const quotes = [
      {
        id: 'quote_001',
        quoteId: 'QT-2025-001',
        date: '2025-01-15',
        status: 'Approved',
        clientId: 'client_re_001',
        product: 'Corporate Brochures',
        quantity: 5000,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK - Front & Back'
      },
      {
        id: 'quote_002',
        quoteId: 'QT-2025-002',
        date: '2025-01-16',
        status: 'Pending',
        clientId: 'client_bank_001',
        product: 'Business Cards',
        quantity: 2000,
        sides: 'Double-sided',
        printing: 'Offset',
        colors: '4 Colors CMYK Front, 1 Color Black Back'
      },
      {
        id: 'quote_003',
        quoteId: 'QT-2025-003',
        date: '2025-01-17',
        status: 'Approved',
        clientId: 'client_hotel_001',
        product: 'Hotel Brochures',
        quantity: 3000,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK - Front & Back'
      },
      {
        id: 'quote_004',
        quoteId: 'QT-2025-004',
        date: '2025-01-18',
        status: 'Rejected',
        clientId: 'client_retail_001',
        product: 'Product Catalogs',
        quantity: 10000,
        sides: 'Double-sided',
        printing: 'Offset',
        colors: '4 Colors CMYK - Front & Back'
      },
      {
        id: 'quote_005',
        quoteId: 'QT-2025-005',
        date: '2025-01-19',
        status: 'Pending',
        clientId: 'client_tech_001',
        product: 'Event Flyers',
        quantity: 1500,
        sides: 'Single-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK - Front Only'
      },
      {
        id: 'quote_006',
        quoteId: 'QT-2025-006',
        date: '2025-01-20',
        status: 'Approved',
        clientId: 'client_health_001',
        product: 'Medical Brochures',
        quantity: 2500,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '2 Colors Blue Black - Front & Back'
      },
      {
        id: 'quote_007',
        quoteId: 'QT-2025-007',
        date: '2025-01-21',
        status: 'Approved',
        clientId: 'client_edu_001',
        product: 'University Prospectus',
        quantity: 8000,
        sides: 'Double-sided',
        printing: 'Offset',
        colors: '4 Colors CMYK - Front & Back'
      },
      {
        id: 'quote_008',
        quoteId: 'QT-2025-008',
        date: '2025-01-22',
        status: 'Pending',
        clientId: 'client_smb_001',
        product: 'Business Cards',
        quantity: 500,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '2 Colors Black Gold Front, 1 Color Black Back'
      },
      {
        id: 'quote_009',
        quoteId: 'QT-2025-009',
        date: '2025-01-23',
        status: 'Approved',
        clientId: 'client_hotel_002',
        product: 'Restaurant Menus',
        quantity: 1000,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK - Front & Back'
      },
      {
        id: 'quote_010',
        quoteId: 'QT-2025-010',
        date: '2025-01-24',
        status: 'Pending',
        clientId: 'client_bank_002',
        product: 'Annual Reports',
        quantity: 15000,
        sides: 'Double-sided',
        printing: 'Offset',
        colors: '4 Colors CMYK - Front & Back'
      }
    ];

    // Insert quotes
    for (const quote of quotes) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('${quote.id}', '${quote.quoteId}', '${quote.date}', '${quote.status}', '${quote.clientId}', '${quote.product.replace(/'/g, "''")}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', '${quote.colors.replace(/'/g, "''")}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 5: Add detailed paper specifications for each quote
    console.log('📄 Adding paper specifications...');
    
    const papers = [
      // Quote 1 - Corporate Brochures
      { id: 'paper_001', name: 'Premium Art Paper', gsm: '250', quoteId: 'quote_001', inputWidth: 210, inputHeight: 297, pricePerPacket: 38.75, pricePerSheet: 0.155, sheetsPerPacket: 250, recommendedSheets: 5000, enteredSheets: 5000, outputWidth: 200, outputHeight: 280, selectedColors: '["cmyk"]' },
      
      // Quote 2 - Business Cards
      { id: 'paper_002', name: 'Premium Cardboard', gsm: '400', quoteId: 'quote_002', inputWidth: 210, inputHeight: 297, pricePerPacket: 65.25, pricePerSheet: 0.261, sheetsPerPacket: 250, recommendedSheets: 2000, enteredSheets: 2000, outputWidth: 85, outputHeight: 55, selectedColors: '["cmyk", "black"]' },
      
      // Quote 3 - Hotel Brochures
      { id: 'paper_003', name: 'High Gloss Paper', gsm: '200', quoteId: 'quote_003', inputWidth: 210, inputHeight: 297, pricePerPacket: 37.75, pricePerSheet: 0.151, sheetsPerPacket: 250, recommendedSheets: 3000, enteredSheets: 3000, outputWidth: 200, outputHeight: 280, selectedColors: '["cmyk"]' },
      
      // Quote 4 - Product Catalogs
      { id: 'paper_004', name: 'Premium Art Paper', gsm: '150', quoteId: 'quote_004', inputWidth: 210, inputHeight: 297, pricePerPacket: 28.50, pricePerSheet: 0.114, sheetsPerPacket: 250, recommendedSheets: 10000, enteredSheets: 10000, outputWidth: 200, outputHeight: 280, selectedColors: '["cmyk"]' },
      
      // Quote 5 - Event Flyers
      { id: 'paper_005', name: 'Premium Matte Paper', gsm: '200', quoteId: 'quote_005', inputWidth: 210, inputHeight: 297, pricePerPacket: 35.00, pricePerSheet: 0.140, sheetsPerPacket: 250, recommendedSheets: 1500, enteredSheets: 1500, outputWidth: 200, outputHeight: 280, selectedColors: '["cmyk"]' },
      
      // Quote 6 - Medical Brochures
      { id: 'paper_006', name: 'Premium Art Paper', gsm: '200', quoteId: 'quote_006', inputWidth: 210, inputHeight: 297, pricePerPacket: 32.00, pricePerSheet: 0.128, sheetsPerPacket: 250, recommendedSheets: 2500, enteredSheets: 2500, outputWidth: 200, outputHeight: 280, selectedColors: '["blue", "black"]' },
      
      // Quote 7 - University Prospectus
      { id: 'paper_007', name: 'Premium Art Paper', gsm: '300', quoteId: 'quote_007', inputWidth: 210, inputHeight: 297, pricePerPacket: 45.50, pricePerSheet: 0.182, sheetsPerPacket: 250, recommendedSheets: 8000, enteredSheets: 8000, outputWidth: 200, outputHeight: 280, selectedColors: '["cmyk"]' },
      
      // Quote 8 - Business Cards (Small Business)
      { id: 'paper_008', name: 'Premium Cardboard', gsm: '350', quoteId: 'quote_008', inputWidth: 210, inputHeight: 297, pricePerPacket: 58.50, pricePerSheet: 0.234, sheetsPerPacket: 250, recommendedSheets: 500, enteredSheets: 500, outputWidth: 85, outputHeight: 55, selectedColors: '["black", "gold"]' },
      
      // Quote 9 - Restaurant Menus
      { id: 'paper_009', name: 'Premium Matte Paper', gsm: '250', quoteId: 'quote_009', inputWidth: 210, inputHeight: 297, pricePerPacket: 41.50, pricePerSheet: 0.166, sheetsPerPacket: 250, recommendedSheets: 1000, enteredSheets: 1000, outputWidth: 200, outputHeight: 280, selectedColors: '["cmyk"]' },
      
      // Quote 10 - Annual Reports
      { id: 'paper_010', name: 'Premium Art Paper', gsm: '200', quoteId: 'quote_010', inputWidth: 210, inputHeight: 297, pricePerPacket: 32.00, pricePerSheet: 0.128, sheetsPerPacket: 250, recommendedSheets: 15000, enteredSheets: 15000, outputWidth: 200, outputHeight: 280, selectedColors: '["cmyk"]' }
    ];

    for (const paper of papers) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Paper (id, name, gsm, quoteId, inputWidth, inputHeight, pricePerPacket, pricePerSheet, sheetsPerPacket, recommendedSheets, enteredSheets, outputWidth, outputHeight, selectedColors) VALUES ('${paper.id}', '${paper.name.replace(/'/g, "''")}', '${paper.gsm}', '${paper.quoteId}', ${paper.inputWidth}, ${paper.inputHeight}, ${paper.pricePerPacket}, ${paper.pricePerSheet}, ${paper.sheetsPerPacket}, ${paper.recommendedSheets}, ${paper.enteredSheets}, ${paper.outputWidth}, ${paper.outputHeight}, '${paper.selectedColors}');"`;
      execSync(insertCmd);
    }

    // Step 6: Add finishing options
    console.log('✨ Adding finishing options...');
    
    const finishing = [
      { id: 'finish_001', name: 'UV Coating', quoteId: 'quote_001', cost: 0.15 },
      { id: 'finish_002', name: 'Spot UV', quoteId: 'quote_002', cost: 0.25 },
      { id: 'finish_003', name: 'Lamination (Gloss)', quoteId: 'quote_003', cost: 0.20 },
      { id: 'finish_004', name: 'Perfect Binding', quoteId: 'quote_004', cost: 2.50 },
      { id: 'finish_005', name: 'Stapling', quoteId: 'quote_005', cost: 0.05 },
      { id: 'finish_006', name: 'Folding', quoteId: 'quote_006', cost: 0.10 },
      { id: 'finish_007', name: 'Die Cutting', quoteId: 'quote_007', cost: 1.50 },
      { id: 'finish_008', name: 'Embossing', quoteId: 'quote_008', cost: 0.75 },
      { id: 'finish_009', name: 'Foil Stamping', quoteId: 'quote_009', cost: 0.50 },
      { id: 'finish_010', name: 'Wire-O Binding', quoteId: 'quote_010', cost: 3.00 }
    ];

    for (const finish of finishing) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Finishing (id, name, quoteId, cost) VALUES ('${finish.id}', '${finish.name.replace(/'/g, "''")}', '${finish.quoteId}', ${finish.cost});"`;
      execSync(insertCmd);
    }

    // Step 7: Add quote amounts with realistic pricing
    console.log('💰 Adding quote amounts...');
    
    const amounts = [
      { id: 'amount_001', base: 1250.00, vat: 62.50, total: 1312.50, quoteId: 'quote_001' },
      { id: 'amount_002', base: 580.00, vat: 29.00, total: 609.00, quoteId: 'quote_002' },
      { id: 'amount_003', base: 890.00, vat: 44.50, total: 934.50, quoteId: 'quote_003' },
      { id: 'amount_004', base: 3200.00, vat: 160.00, total: 3360.00, quoteId: 'quote_004' },
      { id: 'amount_005', base: 420.00, vat: 21.00, total: 441.00, quoteId: 'quote_005' },
      { id: 'amount_006', base: 680.00, vat: 34.00, total: 714.00, quoteId: 'quote_006' },
      { id: 'amount_007', base: 4800.00, vat: 240.00, total: 5040.00, quoteId: 'quote_007' },
      { id: 'amount_008', base: 180.00, vat: 9.00, total: 189.00, quoteId: 'quote_008' },
      { id: 'amount_009', base: 350.00, vat: 17.50, total: 367.50, quoteId: 'quote_009' },
      { id: 'amount_010', base: 7200.00, vat: 360.00, total: 7560.00, quoteId: 'quote_010' }
    ];

    for (const amount of amounts) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO QuoteAmount (id, base, vat, total, quoteId) VALUES ('${amount.id}', ${amount.base}, ${amount.vat}, ${amount.total}, '${amount.quoteId}');"`;
      execSync(insertCmd);
    }

    // Step 8: Add operational specifications
    console.log('⚙️ Adding operational specifications...');
    
    const operational = [
      { id: 'op_001', quoteId: 'quote_001', plates: 4, units: 1 },
      { id: 'op_002', quoteId: 'quote_002', plates: 5, units: 1 },
      { id: 'op_003', quoteId: 'quote_003', plates: 4, units: 1 },
      { id: 'op_004', quoteId: 'quote_004', plates: 4, units: 2 },
      { id: 'op_005', quoteId: 'quote_005', plates: 4, units: 1 },
      { id: 'op_006', quoteId: 'quote_006', plates: 2, units: 1 },
      { id: 'op_007', quoteId: 'quote_007', plates: 4, units: 3 },
      { id: 'op_008', quoteId: 'quote_008', plates: 3, units: 1 },
      { id: 'op_009', quoteId: 'quote_009', plates: 4, units: 1 },
      { id: 'op_010', quoteId: 'quote_010', plates: 4, units: 4 }
    ];

    for (const op of operational) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO QuoteOperational (id, quoteId, plates, units, createdAt, updatedAt) VALUES ('${op.id}', '${op.quoteId}', ${op.plates}, ${op.units}, datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Step 9: Add realistic search history
    console.log('🔍 Adding realistic search history...');
    
    // Clear existing search history
    execSync(`sqlite3 "${dbPath}" "DELETE FROM SearchHistory;"`);
    
    const searchQueries = [
      'business cards printing dubai',
      'brochure printing services',
      'offset printing companies',
      'digital printing uae',
      'paper suppliers dubai',
      'printing materials gsm',
      'finishing options printing',
      'corporate printing services',
      'large format printing',
      'eco-friendly printing materials',
      'metallic paper printing',
      'uv coating services',
      'embossing printing dubai',
      'foil stamping uae',
      'perfect binding services',
      'wire-o binding dubai',
      'die cutting printing',
      'lamination services uae',
      'spot uv printing',
      'textured paper printing'
    ];

    for (let i = 0; i < 50; i++) {
      const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(Date.now() - (randomDaysAgo * 24 * 60 * 60 * 1000)).toISOString();
      
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO SearchHistory (id, query, timestamp) VALUES ('search_${i + 1}', '${randomQuery.replace(/'/g, "''")}', '${timestamp}');"`;
      execSync(insertCmd);
    }

    console.log('✅ Database enhancement completed successfully!');
    
    // Display final counts
    const finalCounts = execSync(`sqlite3 "${dbPath}" "SELECT 'Supplier' as table_name, COUNT(*) as count FROM Supplier UNION ALL SELECT 'Material', COUNT(*) FROM Material UNION ALL SELECT 'Client', COUNT(*) FROM Client UNION ALL SELECT 'Quote', COUNT(*) FROM Quote UNION ALL SELECT 'Paper', COUNT(*) FROM Paper UNION ALL SELECT 'Finishing', COUNT(*) FROM Finishing UNION ALL SELECT 'QuoteAmount', COUNT(*) FROM QuoteAmount UNION ALL SELECT 'QuoteOperational', COUNT(*) FROM QuoteOperational UNION ALL SELECT 'SearchHistory', COUNT(*) FROM SearchHistory;"`, { encoding: 'utf8' });
    
    console.log('\n📊 Final Database Counts:');
    console.log(finalCounts);

  } catch (error) {
    console.error('❌ Error enhancing database:', error);
  }
}

enhanceDatabaseProfessional();
