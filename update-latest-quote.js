#!/usr/bin/env node

/**
 * Update Latest Quote with Enhanced Calculation
 * This script updates the latest quote with the correct amounts
 */

const { PrismaClient } = require('@prisma/client');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function updateLatestQuote() {
  try {
    console.log('🔄 Updating latest quote with enhanced calculation...\n');
    
    // Get the latest quote
    const latestQuote = await prisma.quote.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        amounts: true
      }
    });
    
    if (!latestQuote) {
      console.log('❌ No quotes found');
      return;
    }
    
    console.log('📋 Current quote details:');
    console.log(`   ID: ${latestQuote.id}`);
    console.log(`   Product: ${latestQuote.product}`);
    console.log(`   Quantity: ${latestQuote.quantity}`);
    console.log(`   Current Base: $${latestQuote.amounts.base}`);
    console.log(`   Current VAT: $${latestQuote.amounts.vat}`);
    console.log(`   Current Total: $${latestQuote.amounts.total}`);
    console.log(`   Additional Costs Data: ${latestQuote.additionalCostsData || 'null'}\n`);
    
    // Calculate enhanced amounts
    const product = latestQuote.product;
    const quantity = latestQuote.quantity || 0;
    
    // Basic pricing based on product type
    let basePricePerUnit = 0;
    switch (product) {
      case 'Business Card':
        basePricePerUnit = 0.08; // $0.08 per card
        break;
      case 'Flyer A5':
        basePricePerUnit = 0.15; // $0.15 per flyer
        break;
      case 'Poster A2':
        basePricePerUnit = 2.50; // $2.50 per poster
        break;
      case 'Magazine':
        basePricePerUnit = 1.00; // $1.00 per magazine
        break;
      case 'Art Book':
        basePricePerUnit = 1.00; // $1.00 per book
        break;
      case 'Sticker Pack':
        basePricePerUnit = 0.50; // $0.50 per sticker pack
        break;
      default:
        basePricePerUnit = 0.10; // Default $0.10 per unit
    }
    
    // Calculate base price
    let basePrice = quantity * basePricePerUnit;
    
    // Add additional costs if present
    let additionalCostsTotal = 0;
    if (latestQuote.additionalCostsData) {
      try {
        const additionalCosts = JSON.parse(latestQuote.additionalCostsData);
        additionalCostsTotal = additionalCosts.reduce((total, cost) => total + (cost.cost || 0), 0);
      } catch (error) {
        console.log('⚠️  Could not parse additional costs data');
      }
    }
    
    const totalBasePrice = basePrice + additionalCostsTotal;
    const marginAmount = totalBasePrice * 0.30; // 30% margin
    const subtotal = totalBasePrice + marginAmount;
    const vatAmount = subtotal * 0.05; // 5% VAT
    const totalPrice = subtotal + vatAmount;
    
    console.log('🧮 Enhanced calculation:');
    console.log(`   Product base: ${quantity} × $${basePricePerUnit} = $${basePrice}`);
    console.log(`   Additional costs: $${additionalCostsTotal}`);
    console.log(`   Total base: $${totalBasePrice}`);
    console.log(`   Margin (30%): $${marginAmount.toFixed(2)}`);
    console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`   VAT (5%): $${vatAmount.toFixed(2)}`);
    console.log(`   Total: $${totalPrice.toFixed(2)}\n`);
    
    // Update the quote amounts
    const updatedAmounts = await prisma.quoteAmount.update({
      where: { id: latestQuote.amounts.id },
      data: {
        base: totalBasePrice,
        vat: vatAmount,
        total: totalPrice
      }
    });
    
    console.log('✅ Quote amounts updated successfully!');
    console.log(`📊 New amounts:`);
    console.log(`   Base: $${updatedAmounts.base}`);
    console.log(`   VAT: $${updatedAmounts.vat}`);
    console.log(`   Total: $${updatedAmounts.total}`);
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run update
updateLatestQuote();
