#!/usr/bin/env node

/**
 * Test Complete Calculation Logic
 * Verify: Paper Cost + Plates Cost + Finishing Cost + Additional Costs + 30% Margin + 5% VAT
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function testCompleteCalculation() {
  try {
    console.log('🧪 Testing Complete Calculation Logic...\n');
    
    // Simulate the calculation from the frontend
    const MARGIN_PERCENTAGE = 0.3; // 30%
    const VAT_PERCENTAGE = 0.05;   // 5%
    const PLATE_COST_PER_PLATE = 35;
    
    // Example operational data
    const paperCost = 100.00;      // Example paper cost
    const platesCost = 2 * PLATE_COST_PER_PLATE; // 2 plates
    const finishingCost = 50.00;  // Example finishing cost
    const additionalCostsTotal = 110.00; // From user's example
    
    console.log('📊 Input Costs:');
    console.log(`   Paper Cost: AED ${paperCost}`);
    console.log(`   Plates Cost: AED ${platesCost} (2 plates × ${PLATE_COST_PER_PLATE})`);
    console.log(`   Finishing Cost: AED ${finishingCost}`);
    console.log(`   Additional Costs: AED ${additionalCostsTotal}\n`);
    
    // Step 1: Calculate base price (Paper + Plates + Finishing)
    const basePrice = paperCost + platesCost + finishingCost;
    console.log('1️⃣ Base Price Calculation:');
    console.log(`   Paper + Plates + Finishing = ${paperCost} + ${platesCost} + ${finishingCost} = ${basePrice}`);
    
    // Step 2: Add additional costs
    const totalBasePrice = basePrice + additionalCostsTotal;
    console.log('\n2️⃣ Total Base Price:');
    console.log(`   Base Price + Additional Costs = ${basePrice} + ${additionalCostsTotal} = ${totalBasePrice}`);
    
    // Step 3: Apply 30% margin
    const marginAmount = totalBasePrice * MARGIN_PERCENTAGE;
    console.log('\n3️⃣ Margin Calculation:');
    console.log(`   Margin (30%) = ${totalBasePrice} × ${MARGIN_PERCENTAGE} = ${marginAmount}`);
    
    // Step 4: Calculate subtotal
    const subtotal = totalBasePrice + marginAmount;
    console.log('\n4️⃣ Subtotal:');
    console.log(`   Total Base + Margin = ${totalBasePrice} + ${marginAmount} = ${subtotal}`);
    
    // Step 5: Apply 5% VAT
    const vatAmount = subtotal * VAT_PERCENTAGE;
    console.log('\n5️⃣ VAT Calculation:');
    console.log(`   VAT (5%) = ${subtotal} × ${VAT_PERCENTAGE} = ${vatAmount}`);
    
    // Step 6: Final total
    const totalPrice = subtotal + vatAmount;
    console.log('\n6️⃣ Final Total:');
    console.log(`   Subtotal + VAT = ${subtotal} + ${vatAmount} = ${totalPrice}`);
    
    console.log('\n📋 Complete Breakdown:');
    console.log(`   Paper Cost: AED ${paperCost}`);
    console.log(`   Plates Cost: AED ${platesCost}`);
    console.log(`   Finishing Cost: AED ${finishingCost}`);
    console.log(`   Additional Costs: AED ${additionalCostsTotal}`);
    console.log(`   ─────────────────────────`);
    console.log(`   Total Base: AED ${totalBasePrice}`);
    console.log(`   Margin (30%): AED ${marginAmount}`);
    console.log(`   ─────────────────────────`);
    console.log(`   Subtotal: AED ${subtotal}`);
    console.log(`   VAT (5%): AED ${vatAmount}`);
    console.log(`   ─────────────────────────`);
    console.log(`   FINAL TOTAL: AED ${totalPrice}`);
    
    // Compare with user's expected calculation
    console.log('\n🎯 Comparison with User\'s Expected:');
    console.log(`   User Expected: AED 736.54`);
    console.log(`   Our Calculation: AED ${totalPrice}`);
    console.log(`   Difference: AED ${Math.abs(totalPrice - 736.54)}`);
    
    if (Math.abs(totalPrice - 736.54) < 0.01) {
      console.log('✅ Calculation matches user\'s expected result!');
    } else {
      console.log('❌ Calculation does not match user\'s expected result');
      
      // Try to reverse engineer what the user's calculation might be
      console.log('\n🔍 Reverse Engineering User\'s Calculation:');
      const userExpectedTotal = 736.54;
      const userExpectedVAT = 29.84;
      const userExpectedBase = 706.70;
      const userExpectedAdditional = 110.00;
      
      const userSubtotalBeforeVAT = userExpectedVAT / VAT_PERCENTAGE;
      console.log(`   User's subtotal before VAT: ${userExpectedVAT} ÷ ${VAT_PERCENTAGE} = ${userSubtotalBeforeVAT}`);
      console.log(`   User's base + additional: ${userExpectedBase} + ${userExpectedAdditional} = ${userExpectedBase + userExpectedAdditional}`);
      
      const userMargin = userSubtotalBeforeVAT - (userExpectedBase + userExpectedAdditional);
      console.log(`   User's margin: ${userSubtotalBeforeVAT} - ${userExpectedBase + userExpectedAdditional} = ${userMargin}`);
      
      if (userMargin < 0) {
        console.log(`   This suggests a DISCOUNT of ${Math.abs(userMargin)} instead of a margin!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testCompleteCalculation();
