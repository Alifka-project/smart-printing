import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

// Use production database service if in production
const getDatabaseService = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the production database service
    const { DatabaseService: ProductionDatabaseService } = require('@/lib/database-production');
    return new ProductionDatabaseService();
  }
  // In development, use the unified database service
  return new DatabaseService();
};

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0
    });
    
    const dbService = getDatabaseService();
    
    // Test database health
    const health = await dbService.checkHealth();
    console.log('Database health check:', health);
    
    // Test database info
    const dbInfo = await dbService.getDatabaseInfo();
    console.log('Database info:', dbInfo);
    
    // Test if we can query users (basic functionality test)
    try {
      const users = await dbService.getAllUsers();
      console.log(`Successfully queried ${users.length} users`);
    } catch (userError) {
      console.error('Error querying users:', userError);
    }
    
    return NextResponse.json({
      status: 'success',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
      },
      health,
      dbInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
