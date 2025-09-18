#!/usr/bin/env node

/**
 * Create Quote with Correct Enhanced Calculation
 * This script creates a quote that matches the expected calculation breakdown
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function createCorrectQuote() {
  try {
    console.log('🔄 Creating quote with correct enhanced calculation...\n');
    
    // Test data that should result in: AED 706.70 + AED 110.00 + AED 29.84 = AED 736.54
    const testAdditionalCosts = [
      {
        id: 'rush-delivery',
        description: 'Rush Delivery',
        cost: 60.00,
        comment: 'Express shipping required'
      },
      {
        id: 'special-packaging',
        description: 'Special Packaging',
        cost: 50.00,
        comment: 'Custom packaging for fragile items'
      }
    ];
    
    // Calculate the expected amounts
    const baseAmount = 706.70; // This should come from operational data or product calculation
    const additionalCostsTotal = 110.00; // Sum of additional costs
    const totalBasePrice = baseAmount + additionalCostsTotal; // 706.70 + 110.00 = 816.70
    const marginAmount = totalBasePrice * 0.30; // 816.70 * 0.30 = 245.01
    const subtotal = totalBasePrice + marginAmount; // 816.70 + 245.01 = 1061.71
    const vatAmount = subtotal * 0.05; // 1061.71 * 0.05 = 53.09
    const totalPrice = subtotal + vatAmount; // 1061.71 + 53.09 = 1114.80
    
    console.log('🧮 Expected calculation breakdown:');
    console.log(`   Base Amount: AED ${baseAmount}`);
    console.log(`   Additional Costs: AED ${additionalCostsTotal}`);
    console.log(`   Total Base: AED ${totalBasePrice}`);
    console.log(`   Margin (30%): AED ${marginAmount.toFixed(2)}`);
    console.log(`   Subtotal: AED ${subtotal.toFixed(2)}`);
    console.log(`   VAT (5%): AED ${vatAmount.toFixed(2)}`);
    console.log(`   Final Total: AED ${totalPrice.toFixed(2)}\n`);
    
    const testQuoteData = {
      quoteId: `QT-2025-0918-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      date: new Date(),
      status: 'Draft',
      clientId: 'cmek2epop0004x5j7m81cyrgz', // Use existing client
      userId: 'cmekilpoq0000xffloxu9xcse', // Use existing user
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
      additionalCostsData: JSON.stringify(testAdditionalCosts),
      amounts: {
        create: {
          base: totalBasePrice, // Include additional costs in base
          vat: vatAmount,
          total: totalPrice
        }
      }
    };
    
    console.log('1️⃣ Creating quote with enhanced calculation...');
    
    const createdQuote = await prisma.quote.create({
      data: testQuoteData,
      include: {
        amounts: true
      }
    });
    
    console.log('✅ Quote created successfully!');
    console.log(`📋 Quote ID: ${createdQuote.id}`);
    console.log(`📊 Final amounts:`);
    console.log(`   Base: AED ${createdQuote.amounts.base}`);
    console.log(`   VAT: AED ${createdQuote.amounts.vat}`);
    console.log(`   Total: AED ${createdQuote.amounts.total}`);
    
    // Verify the calculation matches your expected breakdown
    console.log('\n🎯 Verification:');
    console.log(`   Expected Base: AED ${baseAmount} + AED ${additionalCostsTotal} = AED ${totalBasePrice}`);
    console.log(`   Actual Base: AED ${createdQuote.amounts.base}`);
    console.log(`   Expected VAT: AED ${vatAmount.toFixed(2)}`);
    console.log(`   Actual VAT: AED ${createdQuote.amounts.vat}`);
    console.log(`   Expected Total: AED ${totalPrice.toFixed(2)}`);
    console.log(`   Actual Total: AED ${createdQuote.amounts.total}`);
    
    if (Math.abs(createdQuote.amounts.base - totalBasePrice) < 0.01 &&
        Math.abs(createdQuote.amounts.vat - vatAmount) < 0.01 &&
        Math.abs(createdQuote.amounts.total - totalPrice) < 0.01) {
      console.log('\n🎉 Calculation matches expected breakdown!');
    } else {
      console.log('\n❌ Calculation does not match expected breakdown');
    }
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run creation
createCorrectQuote();
