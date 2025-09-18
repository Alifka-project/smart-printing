#!/usr/bin/env node

/**
 * Test Database Service Directly
 * Verify that getAllQuotes() returns additionalCosts correctly
 */

const { DatabaseService } = require('./lib/database-production.ts');

async function testDatabaseService() {
  try {
    console.log('🧪 Testing Database Service directly...\n');
    
    const dbService = new DatabaseService();
    const quotes = await dbService.getAllQuotes();
    
    console.log(`📊 Found ${quotes.length} quotes`);
    
    if (quotes.length > 0) {
      const latestQuote = quotes[0];
      console.log('\n📋 Latest Quote Details:');
      console.log(`   ID: ${latestQuote.id}`);
      console.log(`   Additional Costs Data (raw): ${latestQuote.additionalCostsData}`);
      console.log(`   Additional Costs (parsed): ${JSON.stringify(latestQuote.additionalCosts)}`);
      
      if (latestQuote.additionalCosts && latestQuote.additionalCosts.length > 0) {
        console.log('\n✅ Additional costs are being parsed correctly!');
        latestQuote.additionalCosts.forEach((cost, index) => {
          console.log(`   Cost ${index + 1}: ${cost.description} - AED ${cost.cost}`);
        });
      } else {
        console.log('\n❌ Additional costs are not being parsed correctly');
        console.log('   Raw data:', latestQuote.additionalCostsData);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run test
testDatabaseService();
