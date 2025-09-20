import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET() {
  try {
    console.log('🔍 Fetching database tables (simple)...');
    
    const dbService = new DatabaseService();
    
    // Get list of tables using PostgreSQL system tables
    const result = await dbService.getClient().$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('Tables found:', result);
    
    return NextResponse.json({
      tables: result,
      message: 'Database tables fetched successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching database tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database tables', details: error.message },
      { status: 500 }
    );
  }
}
