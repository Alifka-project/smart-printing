const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

console.log('Enhancing existing quotes with realistic Step 3 data...');

// Product specifications mapping
const productSpecs = {
  'Business Card': {
    productName: 'Business Card',
    printingSelection: 'Digital',
    flatSizeWidth: 9.0,
    flatSizeHeight: 5.5,
    flatSizeSpine: 0.0,
    closeSizeWidth: 9.0,
    closeSizeHeight: 5.5,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' })
  },
  'Art Book': {
    productName: 'Art Book',
    printingSelection: 'Offset',
    flatSizeWidth: 21.0,
    flatSizeHeight: 29.7,
    flatSizeSpine: 1.0,
    closeSizeWidth: 21.0,
    closeSizeHeight: 29.7,
    closeSizeSpine: 1.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' })
  },
  'Poster A2': {
    productName: 'Poster A2',
    printingSelection: 'Offset',
    flatSizeWidth: 42.0,
    flatSizeHeight: 59.4,
    flatSizeSpine: 0.0,
    closeSizeWidth: 42.0,
    closeSizeHeight: 59.4,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' })
  },
  'Flyer A5': {
    productName: 'Flyer A5',
    printingSelection: 'Digital',
    flatSizeWidth: 14.8,
    flatSizeHeight: 21.0,
    flatSizeSpine: 0.0,
    closeSizeWidth: 14.8,
    closeSizeHeight: 21.0,
    flatSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' })
  },
  'Magazine': {
    productName: 'Magazine',
    printingSelection: 'Offset',
    flatSizeWidth: 21.0,
    flatSizeHeight: 29.7,
    flatSizeSpine: 0.5,
    closeSizeWidth: 21.0,
    closeSizeHeight: 29.7,
    closeSizeSpine: 0.5,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' })
  },
  'Sticker Pack': {
    productName: 'Sticker Pack',
    printingSelection: 'Digital',
    flatSizeWidth: 5.0,
    flatSizeHeight: 5.0,
    flatSizeSpine: 0.0,
    closeSizeWidth: 5.0,
    closeSizeHeight: 5.0,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' })
  },
  'Banner 3x2m': {
    productName: 'Banner 3x2m',
    printingSelection: 'Digital',
    flatSizeWidth: 300.0,
    flatSizeHeight: 200.0,
    flatSizeSpine: 0.0,
    closeSizeWidth: 300.0,
    closeSizeHeight: 200.0,
    closeSizeSpine: 0.0,
    useSameAsFlat: true,
    colors: JSON.stringify({ front: '4 Colors (CMYK)', back: '1 Color' })
  }
};

// Update quotes with realistic Step 3 data
const enhanceQuotes = () => {
  return new Promise((resolve, reject) => {
    // First, get all quotes to see what products we have
    db.all("SELECT id, product FROM Quote", (err, quotes) => {
      if (err) {
        console.error('Error fetching quotes:', err.message);
        reject(err);
        return;
      }

      console.log(`Found ${quotes.length} quotes to enhance`);

      let completed = 0;
      const total = quotes.length;

      quotes.forEach((quote) => {
        const specs = productSpecs[quote.product] || productSpecs['Business Card']; // Default fallback
        
        const updateQuery = `
          UPDATE Quote SET 
            productName = ?,
            printingSelection = ?,
            flatSizeWidth = ?,
            flatSizeHeight = ?,
            flatSizeSpine = ?,
            closeSizeWidth = ?,
            closeSizeHeight = ?,
            closeSizeSpine = ?,
            useSameAsFlat = ?,
            colors = ?
          WHERE id = ?
        `;

        const params = [
          specs.productName,
          specs.printingSelection,
          specs.flatSizeWidth,
          specs.flatSizeHeight,
          specs.flatSizeSpine,
          specs.closeSizeWidth,
          specs.closeSizeHeight,
          specs.closeSizeSpine,
          specs.useSameAsFlat ? 1 : 0,
          specs.colors,
          quote.id
        ];

        db.run(updateQuery, params, (updateErr) => {
          if (updateErr) {
            console.error(`Error updating quote ${quote.id}:`, updateErr.message);
          } else {
            console.log(`✅ Enhanced quote ${quote.id} (${quote.product}) with Step 3 data`);
          }
          
          completed++;
          if (completed === total) {
            resolve();
          }
        });
      });
    });
  });
};

// Add sample papers and finishing to quotes
const addSamplePapersAndFinishing = () => {
  return new Promise((resolve, reject) => {
    // Get all quotes
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
        }

        // Insert paper
        const paperQuery = `
          INSERT INTO Paper (id, name, gsm, quoteId) 
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
          }

          const finishingQuery = `
            INSERT INTO Finishing (id, name, quoteId) 
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
    await enhanceQuotes();
    await addSamplePapersAndFinishing();
    
    console.log('\n✅ Successfully enhanced all quotes with Step 3 data');
    console.log('✅ Added sample papers and finishing options');
    
    // Show a sample of enhanced quotes
    db.all("SELECT id, productName, printingSelection, flatSizeWidth, flatSizeHeight FROM Quote LIMIT 5", (err, rows) => {
      if (err) {
        console.error('Error getting sample quotes:', err.message);
      } else {
        console.log('\nSample of enhanced quotes:');
        rows.forEach(row => {
          console.log(`  ${row.productName}: ${row.printingSelection}, Size: ${row.flatSizeWidth}cm x ${row.flatSizeHeight}cm`);
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
