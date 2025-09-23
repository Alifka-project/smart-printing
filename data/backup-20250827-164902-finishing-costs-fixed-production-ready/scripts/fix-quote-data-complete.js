const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

console.log('Fixing complete quote data with realistic values...');

// Product specifications with realistic data
const productSpecs = {
  'Business Card': {
    productName: 'Business Card',
    printingSelection: 'Digital',
    sides: '1',
    flatSizeWidth: 9.0,
    flatSizeHeight: 5.5,
    flatSizeSpine: 0.0,
    closeSizeWidth: 9.0,
    closeSizeHeight: 5.5,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' }),
    // Pricing: Base cost per unit based on quantity
    basePricePerUnit: 0.15,
    vatRate: 0.05, // 5% VAT
    marginRate: 0.30 // 30% margin
  },
  'Art Book': {
    productName: 'Art Book',
    printingSelection: 'Offset',
    sides: '2',
    flatSizeWidth: 21.0,
    flatSizeHeight: 29.7,
    flatSizeSpine: 1.0,
    closeSizeWidth: 21.0,
    closeSizeHeight: 29.7,
    closeSizeSpine: 1.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' }),
    basePricePerUnit: 2.5,
    vatRate: 0.05,
    marginRate: 0.25
  },
  'Poster A2': {
    productName: 'Poster A2',
    printingSelection: 'Offset',
    sides: '2',
    flatSizeWidth: 42.0,
    flatSizeHeight: 59.4,
    flatSizeSpine: 0.0,
    closeSizeWidth: 42.0,
    closeSizeHeight: 59.4,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' }),
    basePricePerUnit: 1.8,
    vatRate: 0.05,
    marginRate: 0.20
  },
  'Flyer A5': {
    productName: 'Flyer A5',
    printingSelection: 'Digital',
    sides: '2',
    flatSizeWidth: 14.8,
    flatSizeHeight: 21.0,
    flatSizeSpine: 0.0,
    closeSizeWidth: 14.8,
    closeSizeHeight: 21.0,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' }),
    basePricePerUnit: 0.12,
    vatRate: 0.05,
    marginRate: 0.25
  },
  'Magazine': {
    productName: 'Magazine',
    printingSelection: 'Offset',
    sides: '2',
    flatSizeWidth: 21.0,
    flatSizeHeight: 29.7,
    flatSizeSpine: 0.5,
    closeSizeWidth: 21.0,
    closeSizeHeight: 29.7,
    closeSizeSpine: 0.5,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' }),
    basePricePerUnit: 3.2,
    vatRate: 0.05,
    marginRate: 0.30
  },
  'Sticker Pack': {
    productName: 'Sticker Pack',
    printingSelection: 'Digital',
    sides: '1',
    flatSizeWidth: 5.0,
    flatSizeHeight: 5.0,
    flatSizeSpine: 0.0,
    closeSizeWidth: 5.0,
    closeSizeHeight: 5.0,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' }),
    basePricePerUnit: 0.08,
    vatRate: 0.05,
    marginRate: 0.35
  },
  'Banner 3x2m': {
    productName: 'Banner 3x2m',
    printingSelection: 'Digital',
    sides: '1',
    flatSizeWidth: 300.0,
    flatSizeHeight: 200.0,
    flatSizeSpine: 0.0,
    closeSizeWidth: 300.0,
    closeSizeHeight: 200.0,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' }),
    basePricePerUnit: 25.0,
    vatRate: 0.05,
    marginRate: 0.20
  },
  'Brochure': {
    productName: 'Brochure',
    printingSelection: 'Offset',
    sides: '2',
    flatSizeWidth: 21.0,
    flatSizeHeight: 29.7,
    flatSizeSpine: 0.0,
    closeSizeWidth: 21.0,
    closeSizeHeight: 29.7,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' }),
    basePricePerUnit: 1.5,
    vatRate: 0.05,
    marginRate: 0.25
  },
  'Menu Card': {
    productName: 'Menu Card',
    printingSelection: 'Digital',
    sides: '2',
    flatSizeWidth: 21.0,
    flatSizeHeight: 29.7,
    flatSizeSpine: 0.0,
    closeSizeWidth: 21.0,
    closeSizeHeight: 29.7,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' }),
    basePricePerUnit: 0.8,
    vatRate: 0.05,
    marginRate: 0.30
  }
};

// Calculate realistic amounts based on product specs and quantity
const calculateAmounts = (productName, quantity) => {
  const specs = productSpecs[productName] || productSpecs['Business Card'];
  
  // Base cost with quantity discounts
  let basePricePerUnit = specs.basePricePerUnit;
  if (quantity >= 1000) basePricePerUnit *= 0.8; // 20% discount for large quantities
  else if (quantity >= 500) basePricePerUnit *= 0.9; // 10% discount for medium quantities
  
  const baseAmount = basePricePerUnit * quantity;
  const marginAmount = baseAmount * specs.marginRate;
  const subtotal = baseAmount + marginAmount;
  const vatAmount = subtotal * specs.vatRate;
  const totalAmount = subtotal + vatAmount;
  
  return {
    base: Math.round(baseAmount * 100) / 100,
    vat: Math.round(vatAmount * 100) / 100,
    total: Math.round(totalAmount * 100) / 100
  };
};

// Fix all quote data
const fixAllQuoteData = () => {
  return new Promise((resolve, reject) => {
    // Get all quotes
    db.all("SELECT id, product, productName, quantity FROM Quote", (err, quotes) => {
      if (err) {
        console.error('Error fetching quotes:', err.message);
        reject(err);
        return;
      }

      console.log(`Found ${quotes.length} quotes to fix`);

      let completed = 0;
      const total = quotes.length;

      quotes.forEach((quote) => {
        const productName = quote.productName || quote.product;
        const specs = productSpecs[productName] || productSpecs['Business Card'];
        const amounts = calculateAmounts(productName, quote.quantity);
        
        // Update quote with complete Step 3 data
        const updateQuoteQuery = `
          UPDATE Quote SET 
            productName = ?,
            printingSelection = ?,
            sides = ?,
            flatSizeWidth = ?,
            flatSizeHeight = ?,
            flatSizeSpine = ?,
            closeSizeWidth = ?,
            closeSizeHeight = ?,
            closeSizeSpine = ?,
            useSameAsFlat = ?,
            colors = ?,
            printing = ?
          WHERE id = ?
        `;

        const quoteParams = [
          specs.productName,
          specs.printingSelection,
          specs.sides,
          specs.flatSizeWidth,
          specs.flatSizeHeight,
          specs.flatSizeSpine,
          specs.closeSizeWidth,
          specs.closeSizeHeight,
          specs.closeSizeSpine,
          specs.useSameAsFlat ? 1 : 0,
          specs.colors,
          specs.printingSelection,
          quote.id
        ];

        db.run(updateQuoteQuery, quoteParams, (updateErr) => {
          if (updateErr) {
            console.error(`Error updating quote ${quote.id}:`, updateErr.message);
          } else {
            console.log(`✅ Updated quote ${quote.id} (${productName}) with complete Step 3 data`);
          }

          // Create or update amounts
          const upsertAmountsQuery = `
            INSERT OR REPLACE INTO QuoteAmount (id, base, vat, total, quoteId)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          const amountId = `amount_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const amountParams = [amountId, amounts.base, amounts.vat, amounts.total, quote.id];

          db.run(upsertAmountsQuery, amountParams, (amountErr) => {
            if (amountErr) {
              console.error(`Error updating amounts for quote ${quote.id}:`, amountErr.message);
            } else {
              console.log(`✅ Updated amounts for quote ${quote.id}: Base $${amounts.base}, VAT $${amounts.vat}, Total $${amounts.total}`);
            }

            completed++;
            if (completed === total) {
              resolve();
            }
          });
        });
      });
    });
  });
};

// Add missing papers and finishing
const addMissingPapersAndFinishing = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, productName FROM Quote", (err, quotes) => {
      if (err) {
        console.error('Error fetching quotes for papers/finishing:', err.message);
        reject(err);
        return;
      }

      let completed = 0;
      const total = quotes.length;

      quotes.forEach((quote) => {
        // Add sample paper based on product type
        let paperName = 'Art Paper';
        let gsm = '150';
        
        if (quote.productName === 'Business Card') {
          paperName = 'Premium Card Stock';
          gsm = '350';
        } else if (quote.productName === 'Art Book') {
          paperName = 'Coated Paper';
          gsm = '200';
        } else if (quote.productName === 'Poster A2') {
          paperName = 'Glossy Paper';
          gsm = '200';
        } else if (quote.productName === 'Magazine') {
          paperName = 'Coated Paper';
          gsm = '200';
        }

        // Insert paper
        const paperQuery = `
          INSERT OR IGNORE INTO Paper (id, name, gsm, quoteId) 
          VALUES (?, ?, ?, ?)
        `;
        
        const paperId = `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const paperParams = [paperId, paperName, gsm, quote.id];

        db.run(paperQuery, paperParams, (paperErr) => {
          if (paperErr) {
            console.log(`Paper already exists for quote ${quote.id} or error:`, paperErr.message);
          } else {
            console.log(`✅ Added paper ${paperName} ${gsm}gsm to quote ${quote.id}`);
          }

          // Add sample finishing
          let finishingName = 'Lamination';
          if (quote.productName === 'Business Card') {
            finishingName = 'UV Spot';
          } else if (quote.productName === 'Art Book') {
            finishingName = 'Embossing';
          } else if (quote.productName === 'Poster A2') {
            finishingName = 'Lamination';
          }

          const finishingQuery = `
            INSERT OR IGNORE INTO Finishing (id, name, quoteId) 
            VALUES (?, ?, ?)
          `;
          
          const finishingId = `finish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const finishingParams = [finishingId, finishingName, quote.id];

          db.run(finishingQuery, finishingParams, (finishingErr) => {
            if (finishingErr) {
              console.log(`Finishing already exists for quote ${quote.id} or error:`, finishingErr.message);
            } else {
              console.log(`✅ Added finishing ${finishingName} to quote ${quote.id}`);
            }

            completed++;
            if (completed === total) {
              resolve();
            }
          });
        });
      });
    });
  });
};

// Main execution
const main = async () => {
  try {
    await fixAllQuoteData();
    await addMissingPapersAndFinishing();
    
    console.log('\n✅ Successfully fixed all quote data');
    console.log('✅ Updated Step 3 specifications');
    console.log('✅ Calculated realistic amounts based on product and quantity');
    console.log('✅ Added missing papers and finishing options');
    
    // Show sample of fixed quotes
    db.all("SELECT q.id, q.productName, q.quantity, q.sides, q.printingSelection, qa.total FROM Quote q LEFT JOIN QuoteAmount qa ON q.id = qa.quoteId LIMIT 5", (err, rows) => {
      if (err) {
        console.error('Error getting sample quotes:', err.message);
      } else {
        console.log('\nSample of fixed quotes:');
        rows.forEach(row => {
          console.log(`  ${row.productName}: Qty ${row.quantity}, ${row.sides} side(s), ${row.printingSelection}, Total $${row.total || 'N/A'}`);
        });
      }
      
      db.close();
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    db.close();
    process.exit(1);
  }
};

main();
