#!/usr/bin/env node

/**
 * Test Step 5 Calculation Logic
 * Verify that the new calculation produces AED 1,461.51
 */

function testStep5Calculation() {
  try {
    console.log('🧪 Testing Step 5 Calculation Logic...\n');
    
    // Simulate the data from the screenshot
    const paperCost = 100.00;      // Example paper cost
    const platesCost = 70.00;     // Example plates cost (2 plates × 35)
    const finishingCost = 50.00;  // Example finishing cost
    const additionalCostsTotal = 110.00; // From screenshot
    
    console.log('📊 Input Costs:');
    console.log(`   Paper Cost: AED ${paperCost}`);
    console.log(`   Plates Cost: AED ${platesCost}`);
    console.log(`   Finishing Cost: AED ${finishingCost}`);
    console.log(`   Additional Costs: AED ${additionalCostsTotal}\n`);
    
    // Step 1: Calculate total base cost
    const totalBaseCost = paperCost + platesCost + finishingCost + additionalCostsTotal;
    console.log('1️⃣ Total Base Cost:');
    console.log(`   Paper + Plates + Finishing + Additional = ${paperCost} + ${platesCost} + ${finishingCost} + ${additionalCostsTotal} = ${totalBaseCost}`);
    
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
    
    console.log('\n📋 Complete Breakdown:');
    console.log(`   Paper Cost: AED ${paperCost}`);
    console.log(`   Plates Cost: AED ${platesCost}`);
    console.log(`   Finishing Cost: AED ${finishingCost}`);
    console.log(`   Additional Costs: AED ${additionalCostsTotal}`);
    console.log(`   ─────────────────────────`);
    console.log(`   Total Base: AED ${totalBaseCost}`);
    console.log(`   Margin (30%): AED ${marginAmount}`);
    console.log(`   ─────────────────────────`);
    console.log(`   Subtotal: AED ${subtotal}`);
    console.log(`   VAT (5%): AED ${vatAmount}`);
    console.log(`   ─────────────────────────`);
    console.log(`   FINAL TOTAL: AED ${finalTotal}`);
    
    // Check if this matches the expected calculation
    const expectedTotal = 1461.51;
    console.log('\n🎯 Verification:');
    console.log(`   Expected Total: AED ${expectedTotal}`);
    console.log(`   Calculated Total: AED ${finalTotal}`);
    console.log(`   Difference: AED ${Math.abs(finalTotal - expectedTotal)}`);
    
    if (Math.abs(finalTotal - expectedTotal) < 0.01) {
      console.log('✅ Calculation matches expected result!');
    } else {
      console.log('❌ Calculation does not match expected result');
      
      // Let's see what the base costs should be to get 1461.51
      console.log('\n🔍 Reverse Engineering:');
      const targetTotal = 1461.51;
      const targetVAT = targetTotal / 1.05 * 0.05;
      const targetSubtotal = targetTotal - targetVAT;
      const targetMargin = targetSubtotal / 1.30 * 0.30;
      const targetBase = targetSubtotal - targetMargin;
      
      console.log(`   Target Base Cost: AED ${targetBase}`);
      console.log(`   Target Margin: AED ${targetMargin}`);
      console.log(`   Target Subtotal: AED ${targetSubtotal}`);
      console.log(`   Target VAT: AED ${targetVAT}`);
      console.log(`   Target Total: AED ${targetTotal}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testStep5Calculation();
