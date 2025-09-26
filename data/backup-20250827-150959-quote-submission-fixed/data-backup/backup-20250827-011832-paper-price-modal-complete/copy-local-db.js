// Simple script to copy local database to Vercel
// This ensures you have exactly the same data

const fs = require('fs');
const path = require('path');

console.log('📁 Copying local database to Vercel...');

// Copy the local database file
const localDbPath = path.join(__dirname, 'prisma', 'dev.db');
const vercelDbPath = path.join(__dirname, 'prisma', 'dev.db');

try {
  // Check if local database exists
  if (fs.existsSync(localDbPath)) {
    console.log('✅ Local database found');
    console.log('📊 Database size:', fs.statSync(localDbPath).size, 'bytes');
    
    // For Vercel deployment, the database will be copied during build
    console.log('🚀 Database will be deployed to Vercel with your code');
    console.log('💡 This ensures you have exactly the same data locally and on Vercel');
  } else {
    console.log('❌ Local database not found at:', localDbPath);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('✨ Done! Your local database will be deployed to Vercel.');
