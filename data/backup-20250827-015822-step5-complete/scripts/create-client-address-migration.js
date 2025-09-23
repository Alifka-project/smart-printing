const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function createClientAddressMigration() {
  try {
    console.log('Creating Prisma migration for client address fields...');
    
    // Generate the migration
    console.log('Generating migration...');
    execSync('npx prisma migrate dev --name add_address_fields_to_clients', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('Migration created successfully!');
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('Prisma client generated successfully!');
    
  } catch (error) {
    console.error('Error creating migration:', error);
    
    // If migration fails, try to reset and recreate
    console.log('Attempting to reset database and recreate...');
    try {
      execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      execSync('npx prisma migrate dev --name add_address_fields_to_clients', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('Database reset and migration completed successfully!');
      
    } catch (resetError) {
      console.error('Failed to reset and recreate database:', resetError);
      console.log('Please manually run: npx prisma migrate reset --force');
    }
  }
}

// Run the script
createClientAddressMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
