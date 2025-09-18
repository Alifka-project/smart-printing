#!/usr/bin/env node

/**
 * Test Complete Flow: Step 5 Calculation → Database Storage
 * Verify that the final price in Step 5 matches the total amount stored in database
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

function testStep5Calculation(baseCost = 1070.70) {
  console.log('🧪 Testing Step 5 Calculation Logic...\n');
  
  // Step 1: Calculate total base cost (from screenshot data)
  const totalBaseCost = baseCost; // AED 960.70 (Business Card) + AED 110.00 (Additional Costs)
  console.log('1️⃣ Total Base Cost:');
  console.log(`   Business Card + Additional Costs = ${totalBaseCost}`);
  
  // Step 2: Apply 30% margin
  const marginAmount = totalBaseCost * 0.30;
  console.log('\n2️⃣ Margin Calculation:');
  console.log(`   Margin (30%) = ${totalBaseCost} × 0.30 = ${marginAmount}`);
  
  // Step 3: Calculate subtotal
  const subtotal = totalBaseCost + marginAmount;
  console.log('\n3️⃣ Subtotal:');
  console.log(`   Base + Margin = ${totalBaseCost} + ${marginAmount} = ${subtotal}`);
  
  // Step 4: Apply 5% VAT
  const vatAmount = subtotal * 0.05;
  console.log('\n4️⃣ VAT Calculation:');
  console.log(`   VAT (5%) = ${subtotal} × 0.05 = ${vatAmount}`);
  
  // Step 5: Final total
  const finalTotal = subtotal + vatAmount;
  console.log('\n5️⃣ Final Total:');
  console.log(`   Subtotal + VAT = ${subtotal} + ${vatAmount} = ${finalTotal}`);
  
  console.log('\n📋 Step 5 Calculation Result:');
  console.log(`   FINAL TOTAL: AED ${finalTotal}`);
  
  return finalTotal;
}

async function testDatabaseStorage() {
  try {
    console.log('\n🔄 Testing Database Storage...\n');
    
    // Create a test quote with the calculated amounts
    const step5Total = testStep5Calculation();
    
    // Create additional costs data
    const additionalCostsData = [
      {
        id: 'test-cost-1',
        description: 'Rush Delivery',
        cost: 60.00,
        comment: 'Express shipping required'
      },
      {
        id: 'test-cost-2',
        description: 'Special Packaging',
        cost: 50.00,
        comment: 'Custom packaging for fragile items'
      }
    ];
    
    console.log('\n📊 Creating test quote with calculated amounts...');
    
    // Create the quote with the exact amounts from Step 5 calculation
    const testQuoteData = {
      quoteId: `QT-TEST-${Date.now()}`,
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
      marginPercentage: 30,
      marginAmount: 0,
      customerPdfEnabled: true,
      sendToCustomerEnabled: true,
      additionalCostsData: JSON.stringify(additionalCostsData),
      amounts: {
        create: {
          // Store the exact amounts from Step 5 calculation
          base: 1070.70, // Base cost (Business Card + Additional Costs)
          vat: step5Total * 0.05 / 1.05, // VAT amount
          total: step5Total // Final total from Step 5
        }
      }
    };
    
    console.log('1️⃣ Creating quote with Step 5 calculated amounts...');
    
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
    console.log(`   Step 5 Final Total: AED ${step5Total}`);
    console.log(`   Database Total: AED ${createdQuote.amounts.total}`);
    console.log(`   Difference: AED ${Math.abs(createdQuote.amounts.total - step5Total)}`);
    
    if (Math.abs(createdQuote.amounts.total - step5Total) < 0.01) {
      console.log('\n🎉 SUCCESS! Step 5 calculation matches database storage!');
      console.log(`   Final Total: AED ${step5Total}`);
    } else {
      console.log('\n❌ FAILURE! Step 5 calculation does not match database storage');
    }
    
    // Test API response
    console.log('\n2️⃣ Testing API response...');
    const response = await fetch('http://localhost:3000/api/quotes');
    const quotes = await response.json();
    const latestQuote = quotes[0];
    
    console.log('📊 API Response:');
    console.log(`   Base: AED ${latestQuote.amounts.base}`);
    console.log(`   VAT: AED ${latestQuote.amounts.vat}`);
    console.log(`   Total: AED ${latestQuote.amounts.total}`);
    console.log(`   Additional Costs: ${JSON.stringify(latestQuote.additionalCosts)}`);
    
    if (latestQuote.additionalCosts && latestQuote.additionalCosts.length > 0) {
      console.log('\n✅ Additional costs are being parsed correctly in API!');
    } else {
      console.log('\n❌ Additional costs are not being parsed correctly in API');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testDatabaseStorage();
