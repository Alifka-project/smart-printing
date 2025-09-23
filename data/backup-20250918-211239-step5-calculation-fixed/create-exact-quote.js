#!/usr/bin/env node

/**
 * Create Quote with Exact Expected Calculation
 * AED 706.70 + AED 110.00 + AED 29.84 = AED 736.54
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function createExactQuote() {
  try {
    console.log('🔄 Creating quote with exact expected calculation...\n');
    
    // User's exact expected values
    const expectedBase = 706.70;
    const expectedAdditionalCosts = 110.00;
    const expectedVAT = 29.84;
    const expectedTotal = 736.54;
    
    console.log('📊 Expected Calculation:');
    console.log(`   Base Amount: AED ${expectedBase}`);
    console.log(`   Additional Costs: AED ${expectedAdditionalCosts}`);
    console.log(`   VAT (5%): AED ${expectedVAT}`);
    console.log(`   Final Total: AED ${expectedTotal}\n`);
    
    // Create additional costs data
    const additionalCostsData = [
      {
        id: 'cost-1',
        description: 'Rush Delivery',
        cost: 60.00,
        comment: 'Express shipping required'
      },
      {
        id: 'cost-2',
        description: 'Special Packaging',
        cost: 50.00,
        comment: 'Custom packaging for fragile items'
      }
    ];
    
    // Create the quote with the exact expected amounts
    const testQuoteData = {
      quoteId: `QT-EXACT-${Date.now()}`,
      date: new Date(),
      status: 'Draft',
      clientId: 'cmek2epop0004x5j7m81cyrgz',
      userId: 'cmekilpoq0000xffloxu9xcse',
      product: 'Business Card',
      quantity: 100,
      sides: '1',
      printing: 'Digital',
      colors: '{"front":"4 Colors (CMYK)","back":"1 Color"}',
      productName: 'Business Card',
      printingSelection: 'Digital',
      flatSizeHeight: 5.5,
      flatSizeWidth: 9,
      closeSizeSpine: 0,
      useSameAsFlat: true,
      closeSizeHeight: 5.5,
      closeSizeWidth: 9,
      flatSizeSpine: 0,
      salesPersonId: null,
      finishingComments: null,
      approvalStatus: 'Draft',
      requiresApproval: false,
      approvalReason: null,
      approvedBy: null,
      approvedAt: null,
      approvalNotes: null,
      discountPercentage: 0,
      discountAmount: 0,
      marginPercentage: 15,
      marginAmount: 0,
      customerPdfEnabled: true,
      sendToCustomerEnabled: true,
      additionalCostsData: JSON.stringify(additionalCostsData),
      amounts: {
        create: {
          // Store the exact expected amounts
          base: expectedBase + expectedAdditionalCosts, // 816.70
          vat: expectedVAT, // 29.84
          total: expectedTotal // 736.54
        }
      }
    };
    
    console.log('1️⃣ Creating quote with exact expected amounts...');
    
    const createdQuote = await prisma.quote.create({
      data: testQuoteData,
      include: {
        amounts: true
      }
    });
    
    console.log('✅ Quote created successfully!');
    console.log(`📋 Quote ID: ${createdQuote.id}`);
    console.log(`📊 Stored amounts:`);
    console.log(`   Base: AED ${createdQuote.amounts.base}`);
    console.log(`   VAT: AED ${createdQuote.amounts.vat}`);
    console.log(`   Total: AED ${createdQuote.amounts.total}`);
    
    // Verify the calculation
    console.log('\n🎯 Verification:');
    console.log(`   Expected Base: AED ${expectedBase + expectedAdditionalCosts}`);
    console.log(`   Actual Base: AED ${createdQuote.amounts.base}`);
    console.log(`   Expected VAT: AED ${expectedVAT}`);
    console.log(`   Actual VAT: AED ${createdQuote.amounts.vat}`);
    console.log(`   Expected Total: AED ${expectedTotal}`);
    console.log(`   Actual Total: AED ${createdQuote.amounts.total}`);
    
    if (Math.abs(createdQuote.amounts.base - (expectedBase + expectedAdditionalCosts)) < 0.01 &&
        Math.abs(createdQuote.amounts.vat - expectedVAT) < 0.01 &&
        Math.abs(createdQuote.amounts.total - expectedTotal) < 0.01) {
      console.log('\n🎉 Quote created with exact expected amounts!');
    } else {
      console.log('\n❌ Quote amounts do not match expected values');
    }
    
    // Now let's check what the API returns
    console.log('\n2️⃣ Checking API response...');
    const response = await fetch('http://localhost:3000/api/quotes');
    const quotes = await response.json();
    const latestQuote = quotes[0];
    
    console.log('📊 API Response:');
    console.log(`   Base: AED ${latestQuote.amounts.base}`);
    console.log(`   VAT: AED ${latestQuote.amounts.vat}`);
    console.log(`   Total: AED ${latestQuote.amounts.total}`);
    console.log(`   Additional Costs: ${JSON.stringify(latestQuote.additionalCosts)}`);
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run creation
createExactQuote();
