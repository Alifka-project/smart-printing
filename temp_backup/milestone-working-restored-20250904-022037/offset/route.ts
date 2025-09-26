import { NextRequest, NextResponse } from 'next/server';

// Default pricing values for development and fallback
const DEFAULT_OFFSET_PRICING = {
  parentCost: 2.50,
  plateCost: 25.00,
  makeReadySetup: 50.00,
  makeReadySheets: 10,
  runPer1000: 15.00,
  cutOpRate: 2.00
};

export async function GET() {
  try {
    // Check if we're in production and database is available
    const isProduction = process.env.NODE_ENV === 'production';
    const hasDatabase = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');
    
    if (isProduction && hasDatabase) {
      // Production: Try to fetch from database
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const pricing = await prisma.offsetPricing.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        });
        
        await prisma.$disconnect();
        
        if (pricing) {
          return NextResponse.json({
            parentCost: Number(pricing.parentCost),
            plateCost: Number(pricing.plateCost),
            makeReadySetup: Number(pricing.makeReadySetup),
            makeReadySheets: pricing.makeReadySheets,
            runPer1000: Number(pricing.runPer1000),
            cutOpRate: Number(pricing.cutOpRate)
          });
        }
      } catch (dbError) {
        console.warn('Database fetch failed, using defaults:', dbError.message);
      }
    }
    
    // Development or fallback: Return default pricing
    return NextResponse.json(DEFAULT_OFFSET_PRICING);
    
  } catch (error) {
    console.error('Error in offset pricing API:', error);
    return NextResponse.json(DEFAULT_OFFSET_PRICING);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      parentCost, 
      plateCost, 
      makeReadySetup, 
      makeReadySheets, 
      runPer1000, 
      cutOpRate 
    } = body;

    // Validate input
    if (typeof parentCost !== 'number' || typeof plateCost !== 'number' || 
        typeof makeReadySetup !== 'number' || typeof makeReadySheets !== 'number' ||
        typeof runPer1000 !== 'number' || typeof cutOpRate !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Check if we're in production and database is available
    const isProduction = process.env.NODE_ENV === 'production';
    const hasDatabase = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');
    
    if (isProduction && hasDatabase) {
      // Production: Save to database
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        // Deactivate all existing pricing
        await prisma.offsetPricing.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });

        // Create new pricing record
        const newPricing = await prisma.offsetPricing.create({
          data: {
            parentCost,
            plateCost,
            makeReadySetup,
            makeReadySheets,
            runPer1000,
            cutOpRate
          }
        });

        await prisma.$disconnect();

        return NextResponse.json({
          id: newPricing.id,
          parentCost: Number(newPricing.parentCost),
          plateCost: Number(newPricing.plateCost),
          makeReadySetup: Number(newPricing.makeReadySetup),
          makeReadySheets: newPricing.makeReadySheets,
          runPer1000: Number(newPricing.runPer1000),
          cutOpRate: Number(newPricing.cutOpRate)
        });
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        return NextResponse.json(
          { error: 'Failed to save pricing to database' },
          { status: 500 }
        );
      }
    }
    
    // Development: Return success without saving
    return NextResponse.json({
      id: 'dev-mode',
      parentCost,
      plateCost,
      makeReadySetup,
      makeReadySheets,
      runPer1000,
      cutOpRate,
      message: 'Development mode - pricing not saved to database'
    });
    
  } catch (error) {
    console.error('Error creating offset pricing:', error);
    return NextResponse.json(
      { error: 'Failed to create offset pricing' },
      { status: 500 }
    );
  }
}
