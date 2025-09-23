const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const backupDir = path.join(__dirname, '../data/enhanced-database-backup');
const backupTimestamp = '2025-08-23T02-18-53-587Z';

async function restoreFromBackup() {
  try {
    console.log('Starting database restoration from JSON backup...');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await prisma.searchHistory.deleteMany();
    await prisma.searchAnalytics.deleteMany();
    await prisma.quoteOperational.deleteMany();
    await prisma.quoteAmount.deleteMany();
    await prisma.finishing.deleteMany();
    await prisma.paper.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.client.deleteMany();
    await prisma.material.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('Existing data cleared successfully');
    
    // Restore Users
    console.log('Restoring users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(backupDir, `User-${backupTimestamp}.json`), 'utf8'));
    for (const user of usersData) {
      await prisma.user.create({
        data: {
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
    }
    console.log(`Restored ${usersData.length} users`);
    
    // Restore Suppliers
    console.log('Restoring suppliers...');
    const suppliersData = JSON.parse(fs.readFileSync(path.join(backupDir, `Supplier-${backupTimestamp}.json`), 'utf8'));
    for (const supplier of suppliersData) {
      await prisma.supplier.create({
        data: {
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
    }
    console.log(`Restored ${suppliersData.length} suppliers`);
    
    // Restore Materials
    console.log('Restoring materials...');
    const materialsData = JSON.parse(fs.readFileSync(path.join(backupDir, `Material-${backupTimestamp}.json`), 'utf8'));
    for (const material of materialsData) {
      await prisma.material.create({
        data: {
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
    }
    console.log(`Restored ${materialsData.length} materials`);
    
    // Restore Clients
    console.log('Restoring clients...');
    const clientsData = JSON.parse(fs.readFileSync(path.join(backupDir, `Client-${backupTimestamp}.json`), 'utf8'));
    for (const client of clientsData) {
      await prisma.client.create({
        data: {
          id: client.id,
          clientType: client.clientType,
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          countryCode: client.countryCode,
          role: client.role,
          status: client.status,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt),
          userId: client.userId,
          address: client.address,
          city: client.city,
          state: client.state,
          postalCode: client.postalCode,
          country: client.country
        }
      });
    }
    console.log(`Restored ${clientsData.length} clients`);
    
    // Restore Quotes
    console.log('Restoring quotes...');
    const quotesData = JSON.parse(fs.readFileSync(path.join(backupDir, `Quote-${backupTimestamp}.json`), 'utf8'));
    for (const quote of quotesData) {
      await prisma.quote.create({
        data: {
          id: quote.id,
          quoteId: quote.quoteId,
          date: new Date(quote.date),
          status: quote.status,
          clientId: quote.clientId,
          userId: quote.userId,
          createdAt: new Date(quote.createdAt),
          updatedAt: new Date(quote.updatedAt),
          product: quote.product,
          quantity: quote.quantity,
          sides: quote.sides,
          printing: quote.printing,
          colors: quote.colors,
          productName: quote.productName,
          printingSelection: quote.printingSelection,
          flatSizeHeight: quote.flatSizeHeight,
          closeSizeSpine: quote.closeSizeSpine,
          useSameAsFlat: quote.useSameAsFlat === 1 ? true : quote.useSameAsFlat === 0 ? false : null,
          flatSizeWidth: quote.flatSizeWidth,
          flatSizeSpine: quote.flatSizeSpine,
          closeSizeHeight: quote.closeSizeHeight,
          closeSizeWidth: quote.closeSizeWidth
        }
      });
    }
    console.log(`Restored ${quotesData.length} quotes`);
    
    // Restore Papers
    console.log('Restoring papers...');
    const papersData = JSON.parse(fs.readFileSync(path.join(backupDir, `Paper-${backupTimestamp}.json`), 'utf8'));
    for (const paper of papersData) {
      await prisma.paper.create({
        data: {
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
    }
    console.log(`Restored ${papersData.length} papers`);
    
    // Restore Finishing
    console.log('Restoring finishing...');
    const finishingData = JSON.parse(fs.readFileSync(path.join(backupDir, `Finishing-${backupTimestamp}.json`), 'utf8'));
    for (const finishing of finishingData) {
      await prisma.finishing.create({
        data: {
          id: finishing.id,
          name: finishing.name,
          quoteId: finishing.quoteId,
          cost: finishing.cost
        }
      });
    }
    console.log(`Restored ${finishingData.length} finishing records`);
    
    // Restore QuoteAmount
    console.log('Restoring quote amounts...');
    const amountsData = JSON.parse(fs.readFileSync(path.join(backupDir, `QuoteAmount-${backupTimestamp}.json`), 'utf8'));
    for (const amount of amountsData) {
      await prisma.quoteAmount.create({
        data: {
          id: amount.id,
          base: amount.base,
          vat: amount.vat,
          total: amount.total,
          quoteId: amount.quoteId
        }
      });
    }
    console.log(`Restored ${amountsData.length} quote amounts`);
    
    // Restore QuoteOperational
    console.log('Restoring quote operational data...');
    const operationalData = JSON.parse(fs.readFileSync(path.join(backupDir, `QuoteOperational-${backupTimestamp}.json`), 'utf8'));
    for (const operational of operationalData) {
      await prisma.quoteOperational.create({
        data: {
          id: operational.id,
          quoteId: operational.quoteId,
          plates: operational.plates,
          units: operational.units,
          createdAt: new Date(operational.createdAt),
          updatedAt: new Date(operational.updatedAt)
        }
      });
    }
    console.log(`Restored ${operationalData.length} operational records`);
    
    // Restore SearchHistory
    console.log('Restoring search history...');
    const searchHistoryData = JSON.parse(fs.readFileSync(path.join(backupDir, `SearchHistory-${backupTimestamp}.json`), 'utf8'));
    for (const search of searchHistoryData) {
      await prisma.searchHistory.create({
        data: {
          id: search.id,
          query: search.query,
          timestamp: new Date(search.timestamp),
          userId: search.userId
        }
      });
    }
    console.log(`Restored ${searchHistoryData.length} search history records`);
    
    // Restore SearchAnalytics
    console.log('Restoring search analytics...');
    const searchAnalyticsData = JSON.parse(fs.readFileSync(path.join(backupDir, `SearchAnalytics-${backupTimestamp}.json`), 'utf8'));
    for (const analytics of searchAnalyticsData) {
      await prisma.searchAnalytics.create({
        data: {
          id: analytics.id,
          query: analytics.query,
          timestamp: new Date(analytics.timestamp),
          userId: analytics.userId
        }
      });
    }
    console.log(`Restored ${searchAnalyticsData.length} search analytics records`);
    
    console.log('Database restoration completed successfully!');
    
    // Print summary
    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const quoteCount = await prisma.quote.count();
    const supplierCount = await prisma.supplier.count();
    const materialCount = await prisma.material.count();
    
    console.log('\nRestoration Summary:');
    console.log(`Users: ${userCount}`);
    console.log(`Clients: ${clientCount}`);
    console.log(`Quotes: ${quoteCount}`);
    console.log(`Suppliers: ${supplierCount}`);
    console.log(`Materials: ${materialCount}`);
    
  } catch (error) {
    console.error('Error during restoration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreFromBackup()
  .then(() => {
    console.log('Restoration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Restoration script failed:', error);
    process.exit(1);
  });
