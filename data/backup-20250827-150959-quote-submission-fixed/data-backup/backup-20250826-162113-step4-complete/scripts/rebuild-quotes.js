const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function rebuildQuotes() {
  console.log('🔄 Rebuilding quotes table completely...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // First, clear all quote-related data
    console.log('Clearing quote-related tables...');
    execSync(`sqlite3 "${dbPath}" "DELETE FROM QuoteOperational;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM QuoteAmount;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Finishing;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Paper;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Quote;"`);
    
    // Rebuild quotes with simple, clean data
    console.log('Creating clean quotes...');
    const cleanQuotes = [
      {
        id: 'quote_001',
        quoteId: 'QT-2025-001',
        date: '2025-01-15',
        status: 'Approved',
        clientId: 'client_re_001',
        userId: 'cmekilpoq0000xffloxu9xcse',
        product: 'Corporate Brochures',
        quantity: 5000,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK Front and Back'
      },
      {
        id: 'quote_002',
        quoteId: 'QT-2025-002',
        date: '2025-01-16',
        status: 'Pending',
        clientId: 'client_bank_001',
        userId: 'cmekilpoq0000xffloxu9xcse',
        product: 'Business Cards',
        quantity: 2000,
        sides: 'Double-sided',
        printing: 'Offset',
        colors: '4 Colors CMYK Front 1 Color Black Back'
      },
      {
        id: 'quote_003',
        quoteId: 'QT-2025-003',
        date: '2025-01-17',
        status: 'Approved',
        clientId: 'client_hotel_001',
        userId: 'cmekilpoq0000xffloxu9xcse',
        product: 'Hotel Brochures',
        quantity: 3000,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK Front and Back'
      },
      {
        id: 'quote_004',
        quoteId: 'QT-2025-004',
        date: '2025-01-18',
        status: 'Rejected',
        clientId: 'client_retail_001',
        userId: 'cmekilpoq0000xffloxu9xcse',
        product: 'Product Catalogs',
        quantity: 10000,
        sides: 'Double-sided',
        printing: 'Offset',
        colors: '4 Colors CMYK Front and Back'
      },
      {
        id: 'quote_005',
        quoteId: 'QT-2025-005',
        date: '2025-01-19',
        status: 'Pending',
        clientId: 'client_tech_001',
        userId: 'cmekilpoq0000xffloxu9xcse',
        product: 'Event Flyers',
        quantity: 1500,
        sides: 'Single-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK Front Only'
      }
    ];

    for (const quote of cleanQuotes) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('${quote.id}', '${quote.quoteId}', '${quote.date}', '${quote.status}', '${quote.clientId}', '${quote.userId}', '${quote.product}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', '${quote.colors}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Add quote amounts
    console.log('Adding quote amounts...');
    const amounts = [
      { id: 'amount_001', base: 1250.00, vat: 62.50, total: 1312.50, quoteId: 'quote_001' },
      { id: 'amount_002', base: 580.00, vat: 29.00, total: 609.00, quoteId: 'quote_002' },
      { id: 'amount_003', base: 890.00, vat: 44.50, total: 934.50, quoteId: 'quote_003' },
      { id: 'amount_004', base: 3200.00, vat: 160.00, total: 3360.00, quoteId: 'quote_004' },
      { id: 'amount_005', base: 420.00, vat: 21.00, total: 441.00, quoteId: 'quote_005' }
    ];

    for (const amount of amounts) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO QuoteAmount (id, base, vat, total, quoteId) VALUES ('${amount.id}', ${amount.base}, ${amount.vat}, ${amount.total}, '${amount.quoteId}');"`;
      execSync(insertCmd);
    }

    // Add paper specifications
    console.log('Adding paper specifications...');
    const papers = [
      { id: 'paper_001', name: 'Premium Art Paper', gsm: '250', quoteId: 'quote_001', inputWidth: 210, inputHeight: 297, pricePerPacket: 38.75, pricePerSheet: 0.155, sheetsPerPacket: 250, recommendedSheets: 5000, enteredSheets: 5000, outputWidth: 200, outputHeight: 280 },
      { id: 'paper_002', name: 'Premium Cardboard', gsm: '400', quoteId: 'quote_002', inputWidth: 210, inputHeight: 297, pricePerPacket: 65.25, pricePerSheet: 0.261, sheetsPerPacket: 250, recommendedSheets: 2000, enteredSheets: 2000, outputWidth: 85, outputHeight: 55 },
      { id: 'paper_003', name: 'High Gloss Paper', gsm: '200', quoteId: 'quote_003', inputWidth: 210, inputHeight: 297, pricePerPacket: 37.75, pricePerSheet: 0.151, sheetsPerPacket: 250, recommendedSheets: 3000, enteredSheets: 3000, outputWidth: 200, outputHeight: 280 },
      { id: 'paper_004', name: 'Premium Art Paper', gsm: '150', quoteId: 'quote_004', inputWidth: 210, inputHeight: 297, pricePerPacket: 28.50, pricePerSheet: 0.114, sheetsPerPacket: 250, recommendedSheets: 10000, enteredSheets: 10000, outputWidth: 200, outputHeight: 280 },
      { id: 'paper_005', name: 'Premium Matte Paper', gsm: '200', quoteId: 'quote_005', inputWidth: 210, inputHeight: 297, pricePerPacket: 35.00, pricePerSheet: 0.140, sheetsPerPacket: 250, recommendedSheets: 1500, enteredSheets: 1500, outputWidth: 200, outputHeight: 280 }
    ];

    for (const paper of papers) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Paper (id, name, gsm, quoteId, inputWidth, inputHeight, pricePerPacket, pricePerSheet, sheetsPerPacket, recommendedSheets, enteredSheets, outputWidth, outputHeight) VALUES ('${paper.id}', '${paper.name}', '${paper.gsm}', '${paper.quoteId}', ${paper.inputWidth}, ${paper.inputHeight}, ${paper.pricePerPacket}, ${paper.pricePerSheet}, ${paper.sheetsPerPacket}, ${paper.recommendedSheets}, ${paper.enteredSheets}, ${paper.outputWidth}, ${paper.outputHeight});"`;
      execSync(insertCmd);
    }

    // Add finishing options
    console.log('Adding finishing options...');
    const finishing = [
      { id: 'finish_001', name: 'UV Coating', quoteId: 'quote_001', cost: 0.15 },
      { id: 'finish_002', name: 'Spot UV', quoteId: 'quote_002', cost: 0.25 },
      { id: 'finish_003', name: 'Lamination Gloss', quoteId: 'quote_003', cost: 0.20 },
      { id: 'finish_004', name: 'Perfect Binding', quoteId: 'quote_004', cost: 2.50 },
      { id: 'finish_005', name: 'Stapling', quoteId: 'quote_005', cost: 0.05 }
    ];

    for (const finish of finishing) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Finishing (id, name, quoteId, cost) VALUES ('${finish.id}', '${finish.name}', '${finish.quoteId}', ${finish.cost});"`;
      execSync(insertCmd);
    }

    // Add operational specifications
    console.log('Adding operational specifications...');
    const operational = [
      { id: 'op_001', quoteId: 'quote_001', plates: 4, units: 1 },
      { id: 'op_002', quoteId: 'quote_002', plates: 5, units: 1 },
      { id: 'op_003', quoteId: 'quote_003', plates: 4, units: 1 },
      { id: 'op_004', quoteId: 'quote_004', plates: 4, units: 2 },
      { id: 'op_005', quoteId: 'quote_005', plates: 4, units: 1 }
    ];

    for (const op of operational) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO QuoteOperational (id, quoteId, plates, units, createdAt, updatedAt) VALUES ('${op.id}', '${op.quoteId}', ${op.plates}, ${op.units}, datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    console.log('✅ Quotes rebuilt successfully!');
    
    // Test the new quotes
    const quoteCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote;"`, { encoding: 'utf8' });
    console.log('Total quotes:', quoteCount.trim());
    
    const sampleQuotes = execSync(`sqlite3 "${dbPath}" "SELECT quoteId, product, status FROM Quote;"`, { encoding: 'utf8' });
    console.log('All quotes:');
    console.log(sampleQuotes);
    
  } catch (error) {
    console.error('❌ Error rebuilding quotes:', error);
  }
}

rebuildQuotes();
