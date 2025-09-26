const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function createCleanQuotes() {
  console.log('🧹 Creating completely clean quotes...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // Clear all quote-related data
    execSync(`sqlite3 "${dbPath}" "DELETE FROM QuoteOperational;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM QuoteAmount;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Finishing;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Paper;"`);
    execSync(`sqlite3 "${dbPath}" "DELETE FROM Quote;"`);
    
    // Create extremely simple quotes with no special characters
    const cleanQuotes = [
      {
        id: 'quote_001',
        quoteId: 'QT-2025-001',
        date: '2025-01-15',
        status: 'Approved',
        clientId: 'client_re_001',
        userId: 'user_admin_001',
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
        clientId: 'client_bank_001',
        userId: 'user_manager_001',
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
        clientId: 'client_hotel_001',
        userId: 'user_estimator_001',
        product: 'Hotel Brochures',
        quantity: 3000,
        sides: 'Double-sided',
        printing: 'Digital',
        colors: '4 Colors CMYK'
      }
    ];

    console.log('Creating simple quotes...');
    for (const quote of cleanQuotes) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Quote (id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt) VALUES ('${quote.id}', '${quote.quoteId}', '${quote.date}', '${quote.status}', '${quote.clientId}', '${quote.userId}', '${quote.product}', ${quote.quantity}, '${quote.sides}', '${quote.printing}', '${quote.colors}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    // Add simple amounts
    console.log('Adding simple amounts...');
    const amounts = [
      { id: 'amount_001', base: 1250.00, vat: 62.50, total: 1312.50, quoteId: 'quote_001' },
      { id: 'amount_002', base: 580.00, vat: 29.00, total: 609.00, quoteId: 'quote_002' },
      { id: 'amount_003', base: 890.00, vat: 44.50, total: 934.50, quoteId: 'quote_003' }
    ];

    for (const amount of amounts) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO QuoteAmount (id, base, vat, total, quoteId) VALUES ('${amount.id}', ${amount.base}, ${amount.vat}, ${amount.total}, '${amount.quoteId}');"`;
      execSync(insertCmd);
    }

    console.log('✅ Clean quotes created successfully!');
    
    // Test the quotes
    const quoteCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote;"`, { encoding: 'utf8' });
    console.log('Total quotes:', quoteCount.trim());
    
    const sampleQuotes = execSync(`sqlite3 "${dbPath}" "SELECT quoteId, product, status, colors FROM Quote;"`, { encoding: 'utf8' });
    console.log('All quotes:');
    console.log(sampleQuotes);
    
  } catch (error) {
    console.error('❌ Error creating clean quotes:', error);
  }
}

createCleanQuotes();
