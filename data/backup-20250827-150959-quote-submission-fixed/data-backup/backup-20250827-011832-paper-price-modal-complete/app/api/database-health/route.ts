import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Database Health Check API called');
    
    // Test database connection
    const startTime = Date.now();
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Database connection successful:', { responseTime, result });
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        provider: process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'N/A'
      }
    });
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'N/A'
        },
        recommendations: [
          'Check DATABASE_URL environment variable',
          'Verify database server is running',
          'Check network connectivity',
          'Verify database credentials'
        ]
      },
      { status: 500 }
    );
  }
}
