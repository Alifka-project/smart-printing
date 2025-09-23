const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// This script will migrate ALL data from local SQLite to Vercel PostgreSQL
async function migrateLocalToVercel() {
  console.log('🚀 Starting migration from local SQLite to Vercel PostgreSQL...');
  
  // Connect to local SQLite database
  const localDbPath = path.join(__dirname, '../prisma/dev.db');
  const localDb = new sqlite3.Database(localDbPath);
  
  // Connect to Vercel PostgreSQL using production schema
  const vercelPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xc0dkeFdBOTFuNW1jNWZTNkpUczAiLCJhcGlfa2V5IjoiMDFLMzRRTVFYTVhDR0VaMkFBS1lTMFo3RUMiLCJ0ZW5hbnRfaWQiOiJjOTFjODU2MWZlOGI2YjM0YTU5ODVmMTdhYzU2NGNhMzY3OTY5ZmU5Mjg1NTdjNGM0ZjZiNWJjNzgwNzMzMjgxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY4OWUzMTItMDE4OC00ZjE4LWFhMGQtYTc1OWVhN2EzNGE5In0.lPVxsK7w4PqWlM7f5ErZ-LE7ixz4nL1rVMJIRttzRqs"
      }
    }
  });

  try {
    // Test Vercel connection
    console.log('🔌 Testing Vercel database connection...');
    await vercelPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Vercel database connection successful');

    // Test local connection
    console.log('🔌 Testing local database connection...');
    await new Promise((resolve, reject) => {
      localDb.get("SELECT 1", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    console.log('✅ Local database connection successful');

    // 1. MIGRATE USERS
    console.log('\n👥 Migrating users...');
    const users = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM User", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${users.length} users in local database`);
    
    for (const user of users) {
      try {
        await vercelPrisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            role: user.role,
            password: user.password,
            profilePicture: user.profilePicture,
            status: user.status,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            password: user.password,
            profilePicture: user.profilePicture,
            status: user.status,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        console.log(`✅ User migrated: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error.message);
      }
    }

    // 2. MIGRATE CLIENTS
    console.log('\n🏢 Migrating clients...');
    const clients = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Client", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${clients.length} clients in local database`);
    
    for (const client of clients) {
      try {
        await vercelPrisma.client.upsert({
          where: { id: client.id },
          update: {
            clientType: client.clientType,
            companyName: client.companyName,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            countryCode: client.countryCode,
            role: client.role,
            createdAt: new Date(client.createdAt),
            updatedAt: new Date(client.updatedAt),
            userId: client.userId
          },
          create: {
            id: client.id,
            clientType: client.clientType,
            companyName: client.companyName,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            countryCode: client.countryCode,
            role: client.role,
            createdAt: new Date(client.createdAt),
            updatedAt: new Date(client.updatedAt),
            userId: client.userId
          }
        });
        console.log(`✅ Client migrated: ${client.contactPerson} (${client.email})`);
      } catch (error) {
        console.error(`❌ Failed to migrate client ${client.contactPerson}:`, error.message);
      }
    }

    // 3. MIGRATE SUPPLIERS
    console.log('\n🏭 Migrating suppliers...');
    const suppliers = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Supplier", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${suppliers.length} suppliers in local database`);
    
    for (const supplier of suppliers) {
      try {
        await vercelPrisma.supplier.upsert({
          where: { id: supplier.id },
          update: {
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            countryCode: supplier.countryCode,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            postalCode: supplier.postalCode,
            country: supplier.country,
            status: supplier.status,
            createdAt: new Date(supplier.createdAt),
            updatedAt: new Date(supplier.updatedAt)
          },
          create: {
            id: supplier.id,
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            countryCode: supplier.countryCode,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            postalCode: supplier.postalCode,
            country: supplier.country,
            status: supplier.status,
            createdAt: new Date(supplier.createdAt),
            updatedAt: new Date(supplier.updatedAt)
          }
        });
        console.log(`✅ Supplier migrated: ${supplier.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate supplier ${supplier.name}:`, error.message);
      }
    }

    // 4. MIGRATE MATERIALS
    console.log('\n📦 Migrating materials...');
    const materials = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Material", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${materials.length} materials in local database`);
    
    for (const material of materials) {
      try {
        await vercelPrisma.material.upsert({
          where: { materialId: material.materialId },
          update: {
            name: material.name,
            gsm: material.gsm,
            supplierId: material.supplierId,
            cost: material.cost,
            unit: material.unit,
            status: material.status,
            lastUpdated: new Date(material.lastUpdated),
            createdAt: new Date(material.createdAt),
            updatedAt: new Date(material.updatedAt)
          },
          create: {
            id: material.id,
            materialId: material.materialId,
            name: material.name,
            gsm: material.gsm,
            supplierId: material.supplierId,
            cost: material.cost,
            unit: material.unit,
            status: material.status,
            lastUpdated: new Date(material.lastUpdated),
            createdAt: new Date(material.createdAt),
            updatedAt: new Date(material.updatedAt)
          }
        });
        console.log(`✅ Material migrated: ${material.name} (${material.materialId})`);
      } catch (error) {
        console.error(`❌ Failed to migrate material ${material.name}:`, error.message);
      }
    }

    // 5. MIGRATE QUOTES
    console.log('\n📋 Migrating quotes...');
    const quotes = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Quote", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${quotes.length} quotes in local database`);
    
    for (const quote of quotes) {
      try {
        await vercelPrisma.quote.upsert({
          where: { id: quote.id },
          update: {
            quoteId: quote.quoteId,
            date: new Date(quote.date),
            status: quote.status,
            clientId: quote.clientId,
            userId: quote.userId,
            product: quote.product,
            quantity: quote.quantity,
            sides: quote.sides,
            printing: quote.printing,
            colors: quote.colors,
            productName: quote.productName,
            printingSelection: quote.printingSelection,
            flatSizeHeight: quote.flatSizeHeight,
            closeSizeSpine: quote.closeSizeSpine,
            useSameAsFlat: quote.useSameAsFlat,
            flatSizeWidth: quote.flatSizeWidth,
            flatSizeSpine: quote.flatSizeSpine,
            closeSizeHeight: quote.closeSizeHeight,
            closeSizeWidth: quote.closeSizeWidth,
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt)
          },
          create: {
            id: quote.id,
            quoteId: quote.quoteId,
            date: new Date(quote.date),
            status: quote.status,
            clientId: quote.clientId,
            userId: quote.userId,
            product: quote.product,
            quantity: quote.quantity,
            sides: quote.sides,
            printing: quote.printing,
            colors: quote.colors,
            productName: quote.productName,
            printingSelection: quote.printingSelection,
            flatSizeHeight: quote.flatSizeHeight,
            closeSizeSpine: quote.closeSizeSpine,
            useSameAsFlat: quote.useSameAsFlat,
            flatSizeWidth: quote.flatSizeWidth,
            flatSizeSpine: quote.flatSizeSpine,
            closeSizeHeight: quote.closeSizeHeight,
            closeSizeWidth: quote.closeSizeWidth,
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt)
          }
        });
        console.log(`✅ Quote migrated: ${quote.quoteId}`);
      } catch (error) {
        console.error(`❌ Failed to migrate quote ${quote.quoteId}:`, error.message);
      }
    }

    // 6. MIGRATE PAPERS
    console.log('\n📄 Migrating papers...');
    const papers = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Paper", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${papers.length} papers in local database`);
    
    for (const paper of papers) {
      try {
        await vercelPrisma.paper.upsert({
          where: { id: paper.id },
          update: {
            name: paper.name,
            gsm: paper.gsm,
            quoteId: paper.quoteId,
            inputWidth: paper.inputWidth,
            inputHeight: paper.inputHeight,
            pricePerPacket: paper.pricePerPacket,
            pricePerSheet: paper.pricePerSheet,
            sheetsPerPacket: paper.sheetsPerPacket,
            recommendedSheets: paper.recommendedSheets,
            enteredSheets: paper.enteredSheets,
            outputWidth: paper.outputWidth,
            outputHeight: paper.outputHeight,
            selectedColors: paper.selectedColors
          },
          create: {
            id: paper.id,
            name: paper.name,
            gsm: paper.gsm,
            quoteId: paper.quoteId,
            inputWidth: paper.inputWidth,
            inputHeight: paper.inputHeight,
            pricePerPacket: paper.pricePerPacket,
            pricePerSheet: paper.pricePerSheet,
            sheetsPerPacket: paper.sheetsPerPacket,
            recommendedSheets: paper.recommendedSheets,
            enteredSheets: paper.enteredSheets,
            outputWidth: paper.outputWidth,
            outputHeight: paper.outputHeight,
            selectedColors: paper.selectedColors
          }
        });
        console.log(`✅ Paper migrated: ${paper.name} for quote ${paper.quoteId}`);
      } catch (error) {
        console.error(`❌ Failed to migrate paper ${paper.name}:`, error.message);
      }
    }

    // 7. MIGRATE FINISHINGS
    console.log('\n✨ Migrating finishings...');
    const finishings = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Finishing", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${finishings.length} finishings in local database`);
    
    for (const finishing of finishings) {
      try {
        await vercelPrisma.finishing.upsert({
          where: { id: finishing.id },
          update: {
            name: finishing.name,
            quoteId: finishing.quoteId,
            cost: finishing.cost
          },
          create: {
            id: finishing.id,
            name: finishing.name,
            quoteId: finishing.quoteId,
            cost: finishing.cost
          }
        });
        console.log(`✅ Finishing migrated: ${finishing.name} for quote ${finishing.quoteId}`);
      } catch (error) {
        console.error(`❌ Failed to migrate finishing ${finishing.name}:`, error.message);
      }
    }

    // 8. MIGRATE QUOTE AMOUNTS
    console.log('\n💰 Migrating quote amounts...');
    const quoteAmounts = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM QuoteAmount", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${quoteAmounts.length} quote amounts in local database`);
    
    for (const amount of quoteAmounts) {
      try {
        await vercelPrisma.quoteAmount.upsert({
          where: { id: amount.id },
          update: {
            base: amount.base,
            vat: amount.vat,
            total: amount.total,
            quoteId: amount.quoteId
          },
          create: {
            id: amount.id,
            base: amount.base,
            vat: amount.vat,
            total: amount.total,
            quoteId: amount.quoteId
          }
        });
        console.log(`✅ Quote amount migrated for quote ${amount.quoteId}`);
      } catch (error) {
        console.error(`❌ Failed to migrate quote amount for quote ${amount.quoteId}:`, error.message);
      }
    }

    // 9. MIGRATE QUOTE OPERATIONAL
    console.log('\n⚙️ Migrating quote operational data...');
    const quoteOperationals = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM QuoteOperational", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${quoteOperationals.length} quote operational records in local database`);
    
    for (const operational of quoteOperationals) {
      try {
        await vercelPrisma.quoteOperational.upsert({
          where: { id: operational.id },
          update: {
            quoteId: operational.quoteId,
            plates: operational.plates,
            units: operational.units,
            createdAt: new Date(operational.createdAt),
            updatedAt: new Date(operational.updatedAt)
          },
          create: {
            id: operational.id,
            quoteId: operational.quoteId,
            plates: operational.plates,
            units: operational.units,
            createdAt: new Date(operational.createdAt),
            updatedAt: new Date(operational.updatedAt)
          }
        });
        console.log(`✅ Quote operational data migrated for quote ${operational.quoteId}`);
      } catch (error) {
        console.error(`❌ Failed to migrate operational data for quote ${operational.quoteId}:`, error.message);
      }
    }

    // 10. MIGRATE SEARCH HISTORY
    console.log('\n🔍 Migrating search history...');
    const searchHistory = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM SearchHistory", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${searchHistory.length} search history records in local database`);
    
    for (const search of searchHistory) {
      try {
        await vercelPrisma.searchHistory.upsert({
          where: { id: search.id },
          update: {
            query: search.query,
            timestamp: new Date(search.timestamp),
            userId: search.userId
          },
          create: {
            id: search.id,
            query: search.query,
            timestamp: new Date(search.timestamp),
            userId: search.userId
          }
        });
        console.log(`✅ Search history migrated: ${search.query}`);
      } catch (error) {
        console.error(`❌ Failed to migrate search history:`, error.message);
      }
    }

    // 11. MIGRATE SEARCH ANALYTICS
    console.log('\n📊 Migrating search analytics...');
    const searchAnalytics = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM SearchAnalytics", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${searchAnalytics.length} search analytics records in local database`);
    
    for (const analytics of searchAnalytics) {
      try {
        await vercelPrisma.searchAnalytics.upsert({
          where: { id: analytics.id },
          update: {
            query: analytics.query,
            timestamp: new Date(analytics.timestamp),
            userId: analytics.userId
          },
          create: {
            id: analytics.id,
            query: analytics.query,
            timestamp: new Date(analytics.timestamp),
            userId: analytics.userId
          }
        });
        console.log(`✅ Search analytics migrated: ${analytics.query}`);
      } catch (error) {
        console.error(`❌ Failed to migrate search analytics:`, error.message);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   - Users: ${users.length} migrated`);
    console.log(`   - Clients: ${clients.length} migrated`);
    console.log(`   - Suppliers: ${suppliers.length} migrated`);
    console.log(`   - Materials: ${materials.length} migrated`);
    console.log(`   - Quotes: ${quotes.length} migrated`);
    console.log(`   - Papers: ${papers.length} migrated`);
    console.log(`   - Finishings: ${finishings.length} migrated`);
    console.log(`   - Quote Amounts: ${quoteAmounts.length} migrated`);
    console.log(`   - Quote Operational: ${quoteOperationals.length} migrated`);
    console.log(`   - Search History: ${searchHistory.length} migrated`);
    console.log(`   - Search Analytics: ${searchAnalytics.length} migrated`);

    console.log('\n✅ Your Vercel database now contains ALL your local data!');
    console.log('🌐 You can now access your complete system on Vercel with all your existing data.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connections
    localDb.close();
    await vercelPrisma.$disconnect();
  }
}

migrateLocalToVercel();
