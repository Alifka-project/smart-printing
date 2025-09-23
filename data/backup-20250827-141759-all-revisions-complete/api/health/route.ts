import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🏥 Health check API called');
    
    // Simple health check that doesn't require database connection during build
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      message: 'SmartPrint API is running',
      checks: {
        api: 'healthy',
        environment: process.env.DATABASE_URL ? 'configured' : 'not_configured',
        build: 'successful'
      }
    };
    
    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('💥 Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
