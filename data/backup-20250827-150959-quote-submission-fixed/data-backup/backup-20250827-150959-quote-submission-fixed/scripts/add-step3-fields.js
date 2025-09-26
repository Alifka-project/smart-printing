const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

console.log('Adding Step 3 fields to Quote table...');

// Add new columns to Quote table
const addColumns = () => {
  return new Promise((resolve, reject) => {
    const alterQueries = [
      'ALTER TABLE Quote ADD COLUMN productName TEXT',
      'ALTER TABLE Quote ADD COLUMN printingSelection TEXT',
      'ALTER TABLE Quote ADD COLUMN flatSizeWidth REAL',
      'ALTER TABLE Quote ADD COLUMN flatSizeHeight REAL',
      'ALTER TABLE Quote ADD COLUMN flatSizeSpine REAL',
      'ALTER TABLE Quote ADD COLUMN closeSizeWidth REAL',
      'ALTER TABLE Quote ADD COLUMN closeSizeHeight REAL',
      'ALTER TABLE Quote ADD COLUMN closeSizeSpine REAL',
      'ALTER TABLE Quote ADD COLUMN useSameAsFlat BOOLEAN DEFAULT 0'
    ];

    let completed = 0;
    const total = alterQueries.length;

    alterQueries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          // Column might already exist, that's okay
          if (err.message.includes('duplicate column name')) {
            console.log(`Column already exists for query ${index + 1}: ${query}`);
          } else {
            console.log(`Warning for query ${index + 1}: ${err.message}`);
          }
        } else {
          console.log(`Added column for query ${index + 1}: ${query}`);
        }
        
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

// Update existing quotes with sample data for Step 3 fields
const updateExistingQuotes = () => {
  return new Promise((resolve, reject) => {
    const updateQueries = [
      `UPDATE Quote SET 
        productName = CASE 
          WHEN product = 'Business Card' THEN 'Business Card'
          WHEN product = 'Art Book' THEN 'Art Book'
          WHEN product = 'Poster A2' THEN 'Poster A2'
          WHEN product = 'Flyer A5' THEN 'Flyer A5'
          WHEN product = 'Magazine' THEN 'Magazine'
          WHEN product = 'Sticker Pack' THEN 'Sticker Pack'
          WHEN product = 'Banner 3x2m' THEN 'Banner 3x2m'
          ELSE 'Printing Product'
        END,
        printingSelection = 'Digital',
        flatSizeWidth = CASE 
          WHEN product = 'Business Card' THEN 9.0
          WHEN product = 'Art Book' THEN 21.0
          WHEN product = 'Poster A2' THEN 42.0
          WHEN product = 'Flyer A5' THEN 14.8
          WHEN product = 'Magazine' THEN 21.0
          WHEN product = 'Sticker Pack' THEN 5.0
          WHEN product = 'Banner 3x2m' THEN 300.0
          ELSE 21.0
        END,
        flatSizeHeight = CASE 
          WHEN product = 'Business Card' THEN 5.5
          WHEN product = 'Art Book' THEN 29.7
          WHEN product = 'Poster A2' THEN 59.4
          WHEN product = 'Flyer A5' THEN 21.0
          WHEN product = 'Magazine' THEN 29.7
          WHEN product = 'Sticker Pack' THEN 5.0
          WHEN product = 'Banner 3x2m' THEN 200.0
          ELSE 29.7
        END,
        flatSizeSpine = CASE 
          WHEN product = 'Magazine' THEN 0.5
          WHEN product = 'Art Book' THEN 1.0
          ELSE 0.0
        END,
        closeSizeWidth = CASE 
          WHEN product = 'Business Card' THEN 9.0
          WHEN product = 'Art Book' THEN 21.0
          WHEN product = 'Poster A2' THEN 42.0
          WHEN product = 'Flyer A5' THEN 14.8
          WHEN product = 'Magazine' THEN 21.0
          WHEN product = 'Sticker Pack' THEN 5.0
          WHEN product = 'Banner 3x2m' THEN 300.0
          ELSE 21.0
        END,
        closeSizeHeight = CASE 
          WHEN product = 'Business Card' THEN 5.5
          WHEN product = 'Art Book' THEN 29.7
          WHEN product = 'Poster A2' THEN 59.4
          WHEN product = 'Flyer A5' THEN 21.0
          WHEN product = 'Magazine' THEN 29.7
          WHEN product = 'Sticker Pack' THEN 5.0
          WHEN product = 'Banner 3x2m' THEN 200.0
          ELSE 29.7
        END,
        closeSizeSpine = CASE 
          WHEN product = 'Magazine' THEN 0.5
          WHEN product = 'Art Book' THEN 1.0
          ELSE 0.0
        END,
        useSameAsFlat = 1`
    ];

    db.run(updateQueries[0], (err) => {
      if (err) {
        console.error('Error updating existing quotes:', err.message);
        reject(err);
      } else {
        console.log('Updated existing quotes with Step 3 data');
        resolve();
      }
    });
  });
};

// Main execution
const main = async () => {
  try {
    await addColumns();
    await updateExistingQuotes();
    
    console.log('✅ Successfully added Step 3 fields to Quote table');
    console.log('✅ Updated existing quotes with sample data');
    
    // Show the updated table structure
    db.all("PRAGMA table_info(Quote)", (err, rows) => {
      if (err) {
        console.error('Error getting table info:', err.message);
      } else {
        console.log('\nUpdated Quote table structure:');
        rows.forEach(row => {
          console.log(`  ${row.name} (${row.type})`);
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
