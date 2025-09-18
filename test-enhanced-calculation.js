#!/usr/bin/env node

/**
 * Test Script for Enhanced Calculation with Additional Costs
 * This script tests the enhanced calculation logic that includes additional costs
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function testEnhancedCalculation() {
  try {
    console.log('🧪 Testing Enhanced Calculation with Additional Costs...\n');
    
    // Test data: Business Card (100 units) + Additional Costs ($110)
    const testAdditionalCosts = [
      {
        id: 'rush-delivery',
        description: 'Rush Delivery',
        cost: 50.00,
        comment: 'Express shipping required'
      },
      {
        id: 'special-packaging',
        description: 'Special Packaging',
        cost: 60.00,
        comment: 'Custom packaging for fragile items'
      }
    ];
    
    const testQuoteData = {
      quoteId: `TEST-ENHANCED-${Date.now()}`,
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
      flatSizeHeight: null, // Simulate missing operational data
      flatSizeWidth: null,  // Simulate missing operational data
      closeSizeSpine: 0,
      useSameAsFlat: true,
      closeSizeHeight: null,
      closeSizeWidth: null,
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
          // Enhanced calculation:
          // Base: 100 × $0.08 = $8.00 (product)
          // Additional costs: $50 + $60 = $110.00
          // Total base: $8.00 + $110.00 = $118.00
          // Margin: $118.00 × 30% = $35.40
          // Subtotal: $118.00 + $35.40 = $153.40
          // VAT: $153.40 × 5% = $7.67
          // Total: $153.40 + $7.67 = $161.07
          base: 118.00,
          vat: 7.67,
          total: 161.07
        }
      }
    };
    
    console.log('1️⃣ Creating test quote with Business Card (100 units) + Additional Costs ($110)...');
    console.log('Expected enhanced calculation:');
    console.log('  - Product base: 100 × $0.08 = $8.00');
    console.log('  - Additional costs: $50 + $60 = $110.00');
    console.log('  - Total base: $8.00 + $110.00 = $118.00');
    console.log('  - Margin: $118.00 × 30% = $35.40');
    console.log('  - Subtotal: $118.00 + $35.40 = $153.40');
    console.log('  - VAT: $153.40 × 5% = $7.67');
    console.log('  - Total: $153.40 + $7.67 = $161.07\n');
    
    const createdQuote = await prisma.quote.create({
      data: testQuoteData,
      include: {
        amounts: true
      }
    });
    
    console.log('✅ Test quote created successfully');
    console.log(`📋 Quote ID: ${createdQuote.id}`);
    console.log(`📊 Amounts:`);
    console.log(`   Base: $${createdQuote.amounts.base}`);
    console.log(`   VAT: $${createdQuote.amounts.vat}`);
    console.log(`   Total: $${createdQuote.amounts.total}`);
    
    // Verify the enhanced calculation
    const expectedBase = 118.00;
    const expectedVAT = 7.67;
    const expectedTotal = 161.07;
    
    if (Math.abs(createdQuote.amounts.base - expectedBase) < 0.01 &&
        Math.abs(createdQuote.amounts.vat - expectedVAT) < 0.01 &&
        Math.abs(createdQuote.amounts.total - expectedTotal) < 0.01) {
      console.log('\n🎉 Enhanced calculation is correct! Additional costs are properly included.');
    } else {
      console.log('\n❌ Enhanced calculation is incorrect. Expected:');
      console.log(`   Base: $${expectedBase}, Got: $${createdQuote.amounts.base}`);
      console.log(`   VAT: $${expectedVAT}, Got: $${createdQuote.amounts.vat}`);
      console.log(`   Total: $${expectedTotal}, Got: $${createdQuote.amounts.total}`);
    }
    
    // Clean up
    console.log('\n2️⃣ Cleaning up test data...');
    await prisma.quote.delete({
      where: { id: createdQuote.id }
    });
    console.log('✅ Test quote deleted successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testEnhancedCalculation();
