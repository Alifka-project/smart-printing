import { NextRequest, NextResponse } from 'next/server';

// Excel-Based UAE Digital Printing Pricing (AED) - From Client's Excel Sheet
const DEFAULT_DIGITAL_PRICING = {
  perClick: 0.10,        // AED per click (from Excel analysis)
  parentSheetCost: 5.00, // AED per parent sheet (from Excel analysis)
  wasteParents: 3        // Fixed waste sheets (from Excel analysis)
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
        
        const pricing = await prisma.digitalPricing.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        });
        
        await prisma.$disconnect();
        
        if (pricing) {
          return NextResponse.json({
            perClick: Number(pricing.perClick),
            parentSheetCost: Number(pricing.parentSheetCost),
            wasteParents: pricing.wasteParents
          });
        }
      } catch (dbError) {
        console.warn('Database fetch failed, using defaults:', dbError.message);
      }
    }
    
    // Development or fallback: Return real UAE pricing
    return NextResponse.json(DEFAULT_DIGITAL_PRICING);
    
  } catch (error) {
    console.error('Error in digital pricing API:', error);
    return NextResponse.json(DEFAULT_DIGITAL_PRICING);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { perClick, parentSheetCost, wasteParents } = body;

    // Validate input
    if (typeof perClick !== 'number' || typeof parentSheetCost !== 'number' || typeof wasteParents !== 'number') {
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
        await prisma.digitalPricing.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });

        // Create new pricing record
        const newPricing = await prisma.digitalPricing.create({
          data: {
            perClick,
            parentSheetCost,
            wasteParents
          }
        });

        await prisma.$disconnect();

        return NextResponse.json({
          id: newPricing.id,
          perClick: Number(newPricing.perClick),
          parentSheetCost: Number(newPricing.parentSheetCost),
          wasteParents: newPricing.wasteParents
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
      perClick,
      parentSheetCost,
      wasteParents,
      message: 'Development mode - pricing not saved to database'
    });
    
  } catch (error) {
    console.error('Error creating digital pricing:', error);
    return NextResponse.json(
      { error: 'Failed to create digital pricing' },
      { status: 500 }
    );
  }
}
