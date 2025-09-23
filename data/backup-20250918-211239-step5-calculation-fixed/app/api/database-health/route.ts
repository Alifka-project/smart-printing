import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment
    const isProduction = process.env.NODE_ENV === 'production';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    if (isProduction && hasDatabaseUrl) {
      // Use production database configuration
      const { checkDatabaseConnection } = await import('@/lib/database-production');
      const result = await checkDatabaseConnection();
      
      return NextResponse.json({
        status: result.status === 'connected' ? 'healthy' : 'unhealthy',
        database: result,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl,
          databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'none'
        },
        recommendations: result.status === 'failed' ? [
          'Check DATABASE_URL environment variable',
          'Verify database server is running',
          'Check network connectivity',
          'Verify database credentials'
        ] : []
      });
    } else {
      // Use local database configuration
      const { prisma } = await import('@/lib/database-unified');
      
      try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
          status: 'healthy',
          database: {
            status: 'connected',
            responseTime: 'local',
            timestamp: new Date().toISOString(),
            provider: 'SQLite'
          },
          environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            hasDatabaseUrl,
            databaseUrlPrefix: 'file:./dev.db'
          }
        });
      } catch (error) {
        return NextResponse.json({
          status: 'unhealthy',
          database: {
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            provider: 'SQLite'
          },
          environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            hasDatabaseUrl,
            databaseUrlPrefix: 'file:./dev.db'
          }
        });
      }
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
