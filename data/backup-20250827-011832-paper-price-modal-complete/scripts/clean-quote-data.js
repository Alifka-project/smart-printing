const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function cleanQuoteData() {
  console.log('🧹 Cleaning quote data...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    // Clean up colors field by replacing problematic characters
    console.log('Cleaning colors field...');
    execSync(`sqlite3 "${dbPath}" "UPDATE Quote SET colors = REPLACE(colors, '&', 'and') WHERE colors LIKE '%&%';"`);
    execSync(`sqlite3 "${dbPath}" "UPDATE Quote SET colors = REPLACE(colors, ' - ', ' ') WHERE colors LIKE '% - %';"`);
    
    // Clean up product names
    console.log('Cleaning product names...');
    execSync(`sqlite3 "${dbPath}" "UPDATE Quote SET product = REPLACE(product, '&', 'and') WHERE product LIKE '%&%';"`);
    
    // Check for any other problematic characters in text fields
    console.log('Checking for other issues...');
    const problemQuotes = execSync(`sqlite3 "${dbPath}" "SELECT quoteId, colors FROM Quote WHERE colors LIKE '%&%' OR colors LIKE '%<%' OR colors LIKE '%>%' OR colors LIKE '%\"\"\"\"%';"`, { encoding: 'utf8' });
    
    if (problemQuotes.trim()) {
      console.log('Found problematic quotes:', problemQuotes);
    } else {
      console.log('No problematic quotes found');
    }
    
    // Test if we can now query quotes
    console.log('Testing quotes query...');
    const quoteCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Quote;"`, { encoding: 'utf8' });
    console.log('Total quotes:', quoteCount.trim());
    
    const sampleQuotes = execSync(`sqlite3 "${dbPath}" "SELECT quoteId, product, colors FROM Quote LIMIT 3;"`, { encoding: 'utf8' });
    console.log('Sample quotes:');
    console.log(sampleQuotes);
    
    console.log('✅ Quote data cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning quote data:', error);
  }
}

cleanQuoteData();
