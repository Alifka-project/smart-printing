import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-unified';

// Default pricing structure for different product types
const DEFAULT_PRICING = {
  'Book': { basePrice: 2.50, finishingMultiplier: 1.2 },
  'Flyer A5': { basePrice: 0.15, finishingMultiplier: 1.1 },
  'Business Card': { basePrice: 0.08, finishingMultiplier: 1.3 },
  'Brochure': { basePrice: 0.25, finishingMultiplier: 1.15 },
  'Colorful Business Card': { basePrice: 0.12, finishingMultiplier: 1.4 },
  'default': { basePrice: 1.00, finishingMultiplier: 1.1 }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔢 CALCULATE AMOUNTS: Starting amount calculation for quotes...');

    // Get all quotes without amounts or with zero amounts
    const quotesToCalculate = await prisma.quote.findMany({
      where: {
        OR: [
          { amounts: null },
          { amounts: { total: 0 } }
        ]
      },
      include: {
        papers: true,
        finishing: true
      }
    });

    console.log(`📊 Found ${quotesToCalculate.length} quotes needing amount calculation`);

    const results = [];

    for (const quote of quotesToCalculate) {
      try {
        let basePrice = 0;
        let calculatedFrom = 'default';

        // Try to calculate from papers data first
        if (quote.papers && quote.papers.length > 0) {
          for (const paper of quote.papers) {
            if (paper.pricePerSheet && paper.enteredSheets) {
              basePrice += paper.pricePerSheet * paper.enteredSheets;
            }
          }
          calculatedFrom = 'papers';
        }

        // If no paper data, use default pricing based on product
        if (basePrice === 0) {
          const productName = quote.productName || quote.product || 'default';
          const pricing = DEFAULT_PRICING[productName] || DEFAULT_PRICING['default'];
          
                  // Calculate base price based on quantity and product type
        basePrice = pricing.basePrice * (quote.quantity || 1);
        
        // Apply finishing multiplier if finishing options exist
        if (quote.finishing && quote.finishing.length > 0) {
          basePrice *= pricing.finishingMultiplier;
        }
        
        calculatedFrom = 'default_pricing';
      }

      // Add finishing costs if they exist
      if (quote.finishing && quote.finishing.length > 0) {
        for (const finish of quote.finishing) {
          if (finish.cost) {
            basePrice += finish.cost;
          }
        }
      }

      // Quantity is already applied above, no need to multiply again

        // Simple VAT calculation (5% for UAE)
        const vatAmount = basePrice * 0.05;
        const total = basePrice + vatAmount;

        console.log(`💰 Quote ${quote.quoteId}: Base: ${basePrice.toFixed(2)}, VAT: ${vatAmount.toFixed(2)}, Total: ${total.toFixed(2)} (calculated from: ${calculatedFrom})`);

        // Create or update amounts
        const amounts = await prisma.quoteAmount.upsert({
          where: { quoteId: quote.id },
          update: {
            base: basePrice,
            vat: vatAmount,
            total: total
          },
          create: {
            quoteId: quote.id,
            base: basePrice,
            vat: vatAmount,
            total: total
          }
        });

        results.push({
          quoteId: quote.quoteId,
          success: true,
          amounts,
          calculatedFrom,
          basePrice: basePrice.toFixed(2),
          total: total.toFixed(2)
        });

      } catch (error) {
        console.error(`❌ Error calculating amounts for quote ${quote.quoteId}:`, error);
        results.push({
          quoteId: quote.quoteId,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      message: `Amount calculation completed for ${quotesToCalculate.length} quotes`,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('❌ CALCULATE AMOUNTS Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate amounts', details: error.message },
      { status: 500 }
    );
  }
}
