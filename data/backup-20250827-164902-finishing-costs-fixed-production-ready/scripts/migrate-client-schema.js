const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateClientSchema() {
  try {
    console.log('Starting Client schema migration...');
    
    // Get all existing clients
    const existingClients = await prisma.$queryRaw`SELECT * FROM Client`;
    console.log(`Found ${existingClients.length} existing clients`);
    
    // Create new table structure
    await prisma.$executeRaw`
      CREATE TABLE Client_new (
        id TEXT PRIMARY KEY,
        clientType TEXT NOT NULL,
        companyName TEXT,
        firstName TEXT,
        lastName TEXT,
        designation TEXT,
        contactPerson TEXT,
        emails TEXT NOT NULL DEFAULT '[]',
        phone TEXT NOT NULL,
        countryCode TEXT NOT NULL,
        trn TEXT,
        hasNoTrn INTEGER NOT NULL DEFAULT 0,
        address TEXT,
        area TEXT,
        state TEXT NOT NULL DEFAULT 'Dubai',
        country TEXT NOT NULL DEFAULT 'UAE',
        postalCode TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        userId TEXT
      )
    `;
    
    // Migrate existing data
    for (const client of existingClients) {
      // Convert existing email to emails array
      const emails = client.email ? JSON.stringify([client.email]) : '[]';
      
      // Set defaults for new fields
      const state = client.state || 'Dubai';
      const country = client.country || 'UAE';
      const hasNoTrn = 0; // Default to false
      
      await prisma.$executeRaw`
        INSERT INTO Client_new (
          id, clientType, companyName, firstName, lastName, designation,
          contactPerson, emails, phone, countryCode, trn, hasNoTrn,
          address, area, state, country, postalCode, createdAt, updatedAt, userId
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        client.id, client.clientType, client.companyName, 
        client.firstName || null, client.lastName || null, client.designation || null,
        client.contactPerson || null, emails, client.phone, client.countryCode,
        null, hasNoTrn, client.address || null, client.area || null,
        state, country, client.postalCode || null,
        client.createdAt, client.updatedAt, client.userId
      ];
    }
    
    // Drop old table and rename new one
    await prisma.$executeRaw`DROP TABLE Client`;
    await prisma.$executeRaw`ALTER TABLE Client_new RENAME TO Client`;
    
    console.log('✅ Client schema migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateClientSchema()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
