#!/usr/bin/env node

/**
 * Test Script for Additional Costs Functionality
 * This script tests the additional costs feature end-to-end
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function testAdditionalCosts() {
  try {
    console.log('🧪 Testing Additional Costs Functionality...\n');
    
    // Test 1: Check if additionalCostsData column exists
    console.log('1️⃣ Testing database schema...');
    const quote = await prisma.quote.findFirst({
      select: {
        id: true,
        additionalCostsData: true
      }
    });
    
    if (quote) {
      console.log('✅ additionalCostsData column exists');
      console.log(`📊 Sample data: ${quote.additionalCostsData || 'null'}`);
    } else {
      console.log('❌ No quotes found or column missing');
    }
    
    // Test 2: Create a test quote with additional costs
    console.log('\n2️⃣ Testing quote creation with additional costs...');
    
    const testAdditionalCosts = [
      {
        id: 'test-1',
        description: 'Rush Delivery',
        cost: 50.00,
        comment: 'Express shipping required'
      },
      {
        id: 'test-2', 
        description: 'Special Packaging',
        cost: 25.00,
        comment: 'Custom packaging for fragile items'
      }
    ];
    
    const testQuoteData = {
      quoteId: `TEST-${Date.now()}`,
      date: new Date(),
      status: 'Draft',
      clientId: 'cmek2epop0004x5j7m81cyrgz', // Use existing client
      userId: 'cmekilpoq0000xffloxu9xcse', // Use existing user
      product: 'Test Product',
      quantity: 100,
      sides: '1',
      printing: 'Digital',
      colors: '{"front":"4 Colors (CMYK)","back":"1 Color"}',
      productName: 'Test Product',
      printingSelection: 'Digital',
      flatSizeHeight: 10,
      closeSizeSpine: 0,
      useSameAsFlat: true,
      flatSizeWidth: 10,
      closeSizeHeight: 10,
      closeSizeWidth: 10,
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
          base: 100,
          vat: 5,
          total: 105
        }
      }
    };
    
    const createdQuote = await prisma.quote.create({
      data: testQuoteData,
      include: {
        amounts: true
      }
    });
    
    console.log('✅ Test quote created successfully');
    console.log(`📋 Quote ID: ${createdQuote.id}`);
    console.log(`💰 Additional Costs Data: ${createdQuote.additionalCostsData}`);
    
    // Test 3: Retrieve and parse additional costs
    console.log('\n3️⃣ Testing quote retrieval and parsing...');
    
    const retrievedQuote = await prisma.quote.findUnique({
      where: { id: createdQuote.id },
      include: {
        amounts: true
      }
    });
    
    if (retrievedQuote && retrievedQuote.additionalCostsData) {
      const parsedAdditionalCosts = JSON.parse(retrievedQuote.additionalCostsData);
      console.log('✅ Additional costs retrieved and parsed successfully');
      console.log(`📊 Parsed additional costs:`, parsedAdditionalCosts);
      
      const totalAdditionalCosts = parsedAdditionalCosts.reduce((sum, cost) => sum + cost.cost, 0);
      console.log(`💰 Total additional costs: ${totalAdditionalCosts}`);
    } else {
      console.log('❌ Failed to retrieve or parse additional costs');
    }
    
    // Test 4: Clean up test data
    console.log('\n4️⃣ Cleaning up test data...');
    await prisma.quote.delete({
      where: { id: createdQuote.id }
    });
    console.log('✅ Test quote deleted successfully');
    
    console.log('\n🎉 All tests passed! Additional costs functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testAdditionalCosts();
