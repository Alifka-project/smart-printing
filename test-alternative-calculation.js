#!/usr/bin/env node

/**
 * Test Alternative Calculation Logic
 * Theory: Base amount (706.70) already includes margin, additional costs added separately
 */

async function testAlternativeCalculation() {
  try {
    console.log('🧪 Testing Alternative Calculation Logic...\n');
    
    // User's expected calculation:
    const expectedBase = 706.70;
    const expectedAdditionalCosts = 110.00;
    const expectedVAT = 29.84;
    const expectedTotal = 736.54;
    
    console.log('📊 User\'s Expected Calculation:');
    console.log(`   Base Amount: AED ${expectedBase}`);
    console.log(`   Additional Costs: AED ${expectedAdditionalCosts}`);
    console.log(`   VAT (5%): AED ${expectedVAT}`);
    console.log(`   Final Total: AED ${expectedTotal}\n`);
    
    // Theory 1: Base already includes margin, Additional costs added separately
    console.log('🧮 Theory 1: Base includes margin, Additional costs separate');
    const theory1Subtotal = expectedBase + expectedAdditionalCosts;
    const theory1VAT = theory1Subtotal * 0.05;
    const theory1Total = theory1Subtotal + theory1VAT;
    console.log(`   Subtotal: ${expectedBase} + ${expectedAdditionalCosts} = ${theory1Subtotal}`);
    console.log(`   VAT (5%): ${theory1Subtotal} × 0.05 = ${theory1VAT}`);
    console.log(`   Total: ${theory1Subtotal} + ${theory1VAT} = ${theory1Total}`);
    console.log(`   Expected: ${expectedTotal} ${Math.abs(theory1Total - expectedTotal) < 0.01 ? '✅' : '❌'}\n`);
    
    // Theory 2: VAT is calculated on Base only, Additional costs added after VAT
    console.log('🧮 Theory 2: VAT on Base only, Additional costs after VAT');
    const theory2VAT = expectedBase * 0.05;
    const theory2Total = expectedBase + theory2VAT + expectedAdditionalCosts;
    console.log(`   VAT on Base: ${expectedBase} × 0.05 = ${theory2VAT}`);
    console.log(`   Total: ${expectedBase} + ${theory2VAT} + ${expectedAdditionalCosts} = ${theory2Total}`);
    console.log(`   Expected: ${expectedTotal} ${Math.abs(theory2Total - expectedTotal) < 0.01 ? '✅' : '❌'}\n`);
    
    // Theory 3: VAT is calculated on a different subtotal
    console.log('🧮 Theory 3: VAT calculated on different subtotal');
    const theory3Subtotal = expectedVAT / 0.05; // Reverse calculate subtotal
    console.log(`   Subtotal (from VAT): ${expectedVAT} ÷ 0.05 = ${theory3Subtotal}`);
    console.log(`   Base + Additional: ${expectedBase + expectedAdditionalCosts}`);
    console.log(`   Difference: ${theory3Subtotal - (expectedBase + expectedAdditionalCosts)}`);
    
    // Check if the difference suggests a discount
    const discount = (expectedBase + expectedAdditionalCosts) - theory3Subtotal;
    const discountPercentage = (discount / (expectedBase + expectedAdditionalCosts)) * 100;
    console.log(`   Possible discount: ${discount} (${discountPercentage.toFixed(2)}%)`);
    
    // Theory 4: Base amount is after margin, Additional costs added before VAT
    console.log('\n🧮 Theory 4: Base is after margin, Additional costs added before VAT');
    const theory4BaseBeforeMargin = expectedBase / 1.30; // Remove 30% margin
    const theory4Subtotal = theory4BaseBeforeMargin + expectedAdditionalCosts;
    const theory4WithMargin = theory4Subtotal * 1.30;
    const theory4VAT = theory4WithMargin * 0.05;
    const theory4Total = theory4WithMargin + theory4VAT;
    console.log(`   Base before margin: ${expectedBase} ÷ 1.30 = ${theory4BaseBeforeMargin}`);
    console.log(`   Subtotal: ${theory4BaseBeforeMargin} + ${expectedAdditionalCosts} = ${theory4Subtotal}`);
    console.log(`   With margin: ${theory4Subtotal} × 1.30 = ${theory4WithMargin}`);
    console.log(`   VAT: ${theory4WithMargin} × 0.05 = ${theory4VAT}`);
    console.log(`   Total: ${theory4WithMargin} + ${theory4VAT} = ${theory4Total}`);
    console.log(`   Expected: ${expectedTotal} ${Math.abs(theory4Total - expectedTotal) < 0.01 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testAlternativeCalculation();
