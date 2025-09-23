#!/usr/bin/env node

/**
 * Test Script to Understand Correct Calculation
 * Based on user's expected: AED 706.70 + AED 110.00 + AED 29.84 = AED 736.54
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function testCorrectCalculation() {
  try {
    console.log('🧪 Testing Correct Calculation Logic...\n');
    
    // User's expected calculation:
    // Base Amount: AED 706.70
    // Additional Costs: AED 110.00
    // VAT (5%): AED 29.84
    // Final Total: AED 736.54
    
    console.log('📊 User\'s Expected Calculation:');
    console.log('   Base Amount: AED 706.70');
    console.log('   Additional Costs: AED 110.00');
    console.log('   VAT (5%): AED 29.84');
    console.log('   Final Total: AED 736.54\n');
    
    // Let's reverse engineer the calculation
    const expectedTotal = 736.54;
    const expectedVAT = 29.84;
    const expectedBase = 706.70;
    const expectedAdditionalCosts = 110.00;
    
    // If VAT is 5%, then the subtotal before VAT should be:
    const subtotalBeforeVAT = expectedVAT / 0.05; // 29.84 / 0.05 = 596.80
    console.log('🔍 Reverse Engineering:');
    console.log(`   Subtotal before VAT: AED ${subtotalBeforeVAT}`);
    console.log(`   Total Base (Base + Additional): AED ${expectedBase + expectedAdditionalCosts}`);
    console.log(`   Difference: AED ${subtotalBeforeVAT - (expectedBase + expectedAdditionalCosts)}`);
    
    // This suggests the calculation might be:
    // Base + Additional Costs = 816.70
    // But subtotal before VAT = 596.80
    // So there might be a discount or different margin calculation
    
    // Let's test different calculation approaches
    console.log('\n🧮 Testing Different Calculation Approaches:\n');
    
    // Approach 1: Simple calculation (Base + Additional + VAT)
    const approach1 = expectedBase + expectedAdditionalCosts + expectedVAT;
    console.log('Approach 1 (Base + Additional + VAT):');
    console.log(`   ${expectedBase} + ${expectedAdditionalCosts} + ${expectedVAT} = ${approach1}`);
    console.log(`   Expected: ${expectedTotal} ❌`);
    
    // Approach 2: VAT on (Base + Additional)
    const approach2Base = expectedBase + expectedAdditionalCosts;
    const approach2VAT = approach2Base * 0.05;
    const approach2Total = approach2Base + approach2VAT;
    console.log('\nApproach 2 (VAT on Base + Additional):');
    console.log(`   Base + Additional: ${approach2Base}`);
    console.log(`   VAT (5%): ${approach2VAT}`);
    console.log(`   Total: ${approach2Total}`);
    console.log(`   Expected: ${expectedTotal} ❌`);
    
    // Approach 3: VAT on Base only, Additional added after
    const approach3VAT = expectedBase * 0.05;
    const approach3Total = expectedBase + approach3VAT + expectedAdditionalCosts;
    console.log('\nApproach 3 (VAT on Base only, Additional after):');
    console.log(`   Base: ${expectedBase}`);
    console.log(`   VAT on Base (5%): ${approach3VAT}`);
    console.log(`   Additional: ${expectedAdditionalCosts}`);
    console.log(`   Total: ${approach3Total}`);
    console.log(`   Expected: ${expectedTotal} ❌`);
    
    // Approach 4: Check if there's a margin calculation
    const marginAmount = subtotalBeforeVAT - (expectedBase + expectedAdditionalCosts);
    console.log('\nApproach 4 (With Margin):');
    console.log(`   Base + Additional: ${expectedBase + expectedAdditionalCosts}`);
    console.log(`   Margin: ${marginAmount}`);
    console.log(`   Subtotal: ${subtotalBeforeVAT}`);
    console.log(`   VAT (5%): ${expectedVAT}`);
    console.log(`   Total: ${expectedTotal} ✅`);
    
    if (Math.abs(marginAmount - (expectedBase + expectedAdditionalCosts) * 0.30) < 0.01) {
      console.log('\n🎯 Found the correct calculation!');
      console.log('   Base + Additional Costs = Total Base');
      console.log('   Margin (30%) = Total Base × 0.30');
      console.log('   Subtotal = Total Base + Margin');
      console.log('   VAT (5%) = Subtotal × 0.05');
      console.log('   Final Total = Subtotal + VAT');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testCorrectCalculation();
