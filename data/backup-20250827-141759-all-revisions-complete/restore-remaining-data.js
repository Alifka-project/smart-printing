import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Client } = pg;

async function restoreRemainingData() {
  // Local Prisma client (SQLite)
  const localPrisma = new PrismaClient();
  
  // Production PostgreSQL client
  const productionClient = new Client({
    connectionString: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
  });

  try {
    // Connect to both databases
    await productionClient.connect();
    console.log('✅ Connected to production database');
    
    console.log('\n🔄 RESTORING REMAINING DATA...');
    console.log('=' .repeat(50));

    // 1. Restore Paper data
    const localPaperCount = await localPrisma.paper.count();
    if (localPaperCount > 0) {
      console.log(`📄 Restoring ${localPaperCount} paper records...`);
      const localPapers = await localPrisma.paper.findMany();
      
      await productionClient.query('TRUNCATE TABLE "Paper" CASCADE');
      
      for (const paper of localPapers) {
        await productionClient.query(`
          INSERT INTO "Paper" (
            id, name, gsm, "quoteId", "inputWidth", "inputHeight", 
            "pricePerPacket", "pricePerSheet", "sheetsPerPacket", 
            "recommendedSheets", "enteredSheets", "outputWidth", 
            "outputHeight", "selectedColors"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          paper.id, paper.name, paper.gsm, paper.quoteId, paper.inputWidth, paper.inputHeight,
          paper.pricePerPacket, paper.pricePerSheet, paper.sheetsPerPacket, paper.recommendedSheets,
          paper.enteredSheets, paper.outputWidth, paper.outputHeight, paper.selectedColors
        ]);
      }
      console.log(`   ✅ Restored ${localPaperCount} paper records`);
    }

    // 2. Restore Finishing data
    const localFinishingCount = await localPrisma.finishing.count();
    if (localFinishingCount > 0) {
      console.log(`🎨 Restoring ${localFinishingCount} finishing records...`);
      const localFinishings = await localPrisma.finishing.findMany();
      
      await productionClient.query('TRUNCATE TABLE "Finishing" CASCADE');
      
      for (const finishing of localFinishings) {
        await productionClient.query(`
          INSERT INTO "Finishing" (id, name, "quoteId", cost)
          VALUES ($1, $2, $3, $4)
        `, [finishing.id, finishing.name, finishing.quoteId, finishing.cost]);
      }
      console.log(`   ✅ Restored ${localFinishingCount} finishing records`);
    }

    // 3. Restore QuoteAmount data
    const localQuoteAmountCount = await localPrisma.quoteAmount.count();
    if (localQuoteAmountCount > 0) {
      console.log(`💰 Restoring ${localQuoteAmountCount} quote amount records...`);
      const localQuoteAmounts = await localPrisma.quoteAmount.findMany();
      
      await productionClient.query('TRUNCATE TABLE "QuoteAmount" CASCADE');
      
      for (const amount of localQuoteAmounts) {
        await productionClient.query(`
          INSERT INTO "QuoteAmount" (id, base, vat, total, "quoteId")
          VALUES ($1, $2, $3, $4, $5)
        `, [amount.id, amount.base, amount.vat, amount.total, amount.quoteId]);
      }
      console.log(`   ✅ Restored ${localQuoteAmountCount} quote amount records`);
    }

    // 4. Restore QuoteOperational data
    const localQuoteOperationalCount = await localPrisma.quoteOperational.count();
    if (localQuoteOperationalCount > 0) {
      console.log(`⚙️  Restoring ${localQuoteOperationalCount} quote operational records...`);
      const localQuoteOperationals = await localPrisma.quoteOperational.findMany();
      
      await productionClient.query('TRUNCATE TABLE "QuoteOperational" CASCADE');
      
      for (const operational of localQuoteOperationals) {
        await productionClient.query(`
          INSERT INTO "QuoteOperational" (id, "quoteId", plates, units, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [operational.id, operational.quoteId, operational.plates, operational.units, operational.createdAt, operational.updatedAt]);
      }
      console.log(`   ✅ Restored ${localQuoteOperationalCount} quote operational records`);
    }

    // 5. Restore SearchHistory data
    const localSearchHistoryCount = await localPrisma.searchHistory.count();
    if (localSearchHistoryCount > 0) {
      console.log(`🔍 Restoring ${localSearchHistoryCount} search history records...`);
      const localSearchHistories = await localPrisma.searchHistory.findMany();
      
      await productionClient.query('TRUNCATE TABLE "SearchHistory" CASCADE');
      
      for (const history of localSearchHistories) {
        await productionClient.query(`
          INSERT INTO "SearchHistory" (id, query, timestamp, "userId")
          VALUES ($1, $2, $3, $4)
        `, [history.id, history.query, history.timestamp, history.userId]);
      }
      console.log(`   ✅ Restored ${localSearchHistoryCount} search history records`);
    }

    // 6. Restore SearchAnalytics data
    const localSearchAnalyticsCount = await localPrisma.searchAnalytics.count();
    if (localSearchAnalyticsCount > 0) {
      console.log(`📊 Restoring ${localSearchAnalyticsCount} search analytics records...`);
      const localSearchAnalytics = await localPrisma.searchAnalytics.findMany();
      
      await productionClient.query('TRUNCATE TABLE "SearchAnalytics" CASCADE');
      
      for (const analytics of localSearchAnalytics) {
        await productionClient.query(`
          INSERT INTO "SearchAnalytics" (id, query, timestamp, "userId")
          VALUES ($1, $2, $3, $4)
        `, [analytics.id, analytics.query, analytics.timestamp, analytics.userId]);
      }
      console.log(`   ✅ Restored ${localSearchAnalyticsCount} search analytics records`);
    }

    console.log('\n🎉 ALL DATA RESTORATION COMPLETED!');
    console.log('=' .repeat(50));
    
    // Final verification
    const tables = ['Paper', 'Finishing', 'QuoteAmount', 'QuoteOperational', 'SearchHistory', 'SearchAnalytics'];
    for (const table of tables) {
      const result = await productionClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = parseInt(result.rows[0].count);
      console.log(`   ${table.padEnd(20)}: ${count.toString().padStart(3)} records`);
    }

  } catch (error) {
    console.error('❌ Error restoring remaining data:', error.message);
  } finally {
    await localPrisma.$disconnect();
    await productionClient.end();
  }
}

restoreRemainingData();
