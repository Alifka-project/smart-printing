import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Get table information using raw SQL
    let tableInfo;
    try {
      // Try PostgreSQL first
      tableInfo = await prisma.$queryRaw`
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
    } catch (error) {
      try {
        // Try SQLite if PostgreSQL fails
        tableInfo = await prisma.$queryRaw`
          SELECT 
            name as table_name,
            type as table_type
          FROM sqlite_master 
          WHERE type='table' 
          ORDER BY name;
        `;
      } catch (sqliteError) {
        console.error('Both PostgreSQL and SQLite queries failed:', { error, sqliteError });
        tableInfo = [];
      }
    }

    // Get model information from Prisma
    const prismaModels = [
      'User', 'Client', 'Quote', 'Paper', 'Finishing', 
      'QuoteAmount', 'SearchHistory', 'SearchAnalytics', 
      'Supplier', 'Material'
    ];

    // Check which models are actually accessible
    const accessibleModels = [];
    for (const model of prismaModels) {
      try {
        const count = await (prisma as any)[model.toLowerCase()].count();
        accessibleModels.push({ model, accessible: true, count });
      } catch (error) {
        accessibleModels.push({ model, accessible: false, count: 0 });
      }
    }

    return NextResponse.json({
      success: true,
      database: {
        provider: process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite',
        urlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'N/A',
        tables: tableInfo,
        tableCount: Array.isArray(tableInfo) ? tableInfo.length : 0
      },
      prisma: {
        expectedModels: prismaModels.length,
        accessibleModels,
        accessibleCount: accessibleModels.filter(m => m.accessible).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check database structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
